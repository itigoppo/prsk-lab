# API開発ガイド

このプロジェクトでは、OpenAPI定義を基にしたスキーマファースト開発を採用しています。

## 概要

```
Zodスキーマ定義
    ↓
OpenAPI定義 (Hono + ハンドラー統合)
    ↓
自動生成 (Orval)
    ↓
React Query フック + TypeScript型
```

## ディレクトリ構造

```
src/
├── lib/
│   ├── schemas/           # Zodスキーマ定義（真実の唯一の情報源）
│   │   ├── api.ts        # API共通スキーマ
│   │   ├── dto/          # リクエストDTO
│   │   │   ├── user.ts   # ユーザー関連DTO
│   │   │   ├── setting.ts # 設定関連DTO
│   │   │   └── index.ts  # 再エクスポート
│   │   ├── user.ts       # ユーザー関連レスポンス
│   │   ├── character.ts  # キャラクター関連
│   │   └── utils.ts      # Zodユーティリティ（formatZodErrors）
│   │
│   ├── hono/
│   │   └── openapi.ts    # OpenAPI定義 + ハンドラー + ミドルウェア統合
│   │
│   ├── handlers/          # APIハンドラー実装
│   │   ├── users/        # ユーザー関連ハンドラー
│   │   └── characters/   # キャラクター関連ハンドラー
│   │
│   ├── middleware/        # Honoミドルウェア
│   │   ├── verify-nextauth-session.ts
│   │   └── verify-discord-token.ts
│   │
│   └── api/
│       ├── mutator.ts    # Axiosカスタムインスタンス
│       └── generated/    # Orval自動生成（.gitignore）
│
└── app/api/
    ├── docs/             # Swagger UI
    ├── openapi.json/     # OpenAPI JSON定義エンドポイント
    └── [endpoints]/      # Next.js APIルート
```

---

## 新しいAPIを追加する手順

### 1. スキーマ定義（Zod）

#### リクエストDTO: `src/lib/schemas/dto/todo.ts`

```typescript
import { z } from "zod"

// DTO作成スキーマ
export const createTodoDtoSchema = z.object({
  title: z.string().trim().min(1, "タイトルは必須です"),
  completed: z.boolean().default(false),
})

// Zodから型を推論
export type CreateTodoDto = z.infer<typeof createTodoDtoSchema>
```

#### `src/lib/schemas/dto/index.ts`に追加

```typescript
export * from "./todo"
```

#### レスポンススキーマ: `src/lib/schemas/todo.ts`

```typescript
import { z } from "zod"
import { createApiDataResponseSchema } from "./api"

export const todoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.string(),
})

export const todoListResponseSchema = createApiDataResponseSchema(
  z.object({
    todos: z.array(todoSchema),
  })
)

// Zodから型を推論
export type Todo = z.infer<typeof todoSchema>
export type TodoListResponse = z.infer<typeof todoListResponseSchema>
```

**ポイント**:

- すべての型は`z.infer`で推論
- DTOはドメインごとにファイル分割（`dto/user.ts`, `dto/setting.ts`, `dto/todo.ts`等）
- TypeScript型定義を手動で書かない（Single Source of Truth）

---

### 2. APIハンドラー実装

#### `src/lib/handlers/todos/get-todos.handler.ts`

```typescript
import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import type { Handler } from "hono"

export const getTodos: Handler = async (c) => {
  const discordId = c.get("discordId")

  try {
    const user = await prisma.user.findUnique({
      where: { discordId },
    })

    if (!user) {
      return c.json({ message: "ユーザーが見つかりません", success: false }, HTTP_STATUS.NOT_FOUND)
    }

    const todos = await prisma.todo.findMany({
      where: { userId: user.id },
    })

    return c.json({
      data: { todos },
      message: "取得成功",
      success: true,
    })
  } catch {
    return c.json(
      { message: "取得に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
```

#### `src/lib/handlers/todos/create-todo.handler.ts`

```typescript
import { HTTP_STATUS } from "@/constants/http-status"
import { prisma } from "@/lib/prisma"
import { CreateTodoDto, createTodoDtoSchema } from "@/lib/schemas/dto"
import { formatZodErrors } from "@/lib/schemas/utils"
import type { Handler } from "hono"

export const createTodo: Handler = async (c) => {
  const discordId = c.get("discordId")
  const body = await c.req.json()

  const parsed = createTodoDtoSchema.safeParse(body)
  if (!parsed.success) {
    const errors = formatZodErrors<CreateTodoDto>(parsed.error)
    return c.json(
      {
        errors,
        message: "入力内容に誤りがあります",
        success: false,
      },
      HTTP_STATUS.BAD_REQUEST
    )
  }

  try {
    const { title, completed } = parsed.data

    const user = await prisma.user.findUnique({
      where: { discordId },
    })

    if (!user) {
      return c.json({ message: "ユーザーが見つかりません", success: false }, HTTP_STATUS.NOT_FOUND)
    }

    const todo = await prisma.todo.create({
      data: {
        title,
        completed,
        userId: user.id,
      },
    })

    return c.json({
      data: { todo },
      message: "作成成功",
      success: true,
    })
  } catch {
    return c.json(
      { message: "作成に失敗しました", success: false },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}
```

**ポイント**:

- `formatZodErrors`でバリデーションエラーをフラットな形式に変換
- `safeParse`でバリデーション実行
- エラーハンドリングを適切に実装

---

### 3. OpenAPI定義とハンドラー統合: `src/lib/hono/openapi.ts`

```typescript
import { getTodos } from "@/lib/handlers/todos/get-todos.handler"
import { createTodo } from "@/lib/handlers/todos/create-todo.handler"
import { verifyNextAuthSession } from "@/lib/middleware/verify-nextauth-session"
import { todoListResponseSchema } from "@/lib/schemas/todo"
import { createTodoDtoSchema } from "@/lib/schemas/dto"
import { createRoute } from "@hono/zod-openapi"

// GET /api/todos
const getTodosRoute = createRoute({
  method: "get",
  path: "/api/todos",
  tags: ["Todos"],
  summary: "Get all todos",
  description: "Retrieve all todos for the current user",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Todos retrieved successfully",
      content: {
        "application/json": {
          schema: todoListResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
    },
    404: {
      description: "User not found",
    },
  },
})

// POST /api/todos
const createTodoRoute = createRoute({
  method: "post",
  path: "/api/todos",
  tags: ["Todos"],
  summary: "Create a new todo",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createTodoDtoSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Todo created successfully",
      content: {
        "application/json": {
          schema: todoListResponseSchema,
        },
      },
    },
    400: {
      description: "Bad request",
    },
    401: {
      description: "Unauthorized",
    },
  },
})

// ルートを登録（ミドルウェア + ハンドラー統合）
app.use("/api/todos", verifyNextAuthSession)
app.openapi(getTodosRoute, getTodos)
app.openapi(createTodoRoute, createTodo)
```

**重要な変更点**:

- ✅ ハンドラーを直接`app.openapi()`に渡す
- ✅ ミドルウェアは`app.use()`で適用
- ❌ 個別のルートファイル不要（削除済み）
- ❌ `api.ts`での中間ルート統合不要（削除済み）

---

### 4. Next.js APIルート作成

#### `src/app/api/todos/route.ts`

```typescript
import { openAPIApp } from "@/lib/hono/openapi"

export const GET = (req: Request) => {
  return openAPIApp.fetch(req)
}

export const POST = (req: Request) => {
  return openAPIApp.fetch(req)
}
```

---

### 5. OpenAPI定義を生成してコード生成

```bash
# 開発サーバーを起動（別ターミナル）
npm run dev

# OpenAPI定義をダウンロード
npm run generate:openapi

# React QueryフックとTypeScript型を自動生成
npm run generate:api
```

生成されるファイル:

```
src/lib/api/generated/
├── todos/
│   └── todos.ts          # useGetApiTodos, usePostApiTodos
└── models/
    ├── getTodosList200.ts
    └── postTodosBody.ts
```

---

### 6. クライアントで使用

```typescript
"use client"

import { useGetApiTodos } from "@/lib/api/generated/todos/todos"

export default function TodoList() {
  const { data, error, isLoading } = useGetApiTodos()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  const todos = data?.data?.todos ?? []

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
```

---

## ベストプラクティス

### ✅ DO

1. **Zodスキーマを真実の唯一の情報源とする**

   ```typescript
   export const schema = z.object({...})
   export type Type = z.infer<typeof schema>
   ```

2. **OpenAPI定義でスキーマを再利用**

   ```typescript
   schema: userResponseSchema // ✅
   ```

3. **認証が必要なエンドポイントには`security`を指定**

   ```typescript
   security: [{ bearerAuth: [] }]
   ```

4. **エラーレスポンスを定義**
   ```typescript
   responses: {
     200: { description: "Success", ... },
     401: { description: "Unauthorized" },
     404: { description: "Not found" },
   }
   ```

### ❌ DON'T

1. **TypeScript型定義を手動で書かない**

   ```typescript
   // ❌ 手動で型定義
   export interface User { ... }

   // ✅ Zodから推論
   export type User = z.infer<typeof userSchema>
   ```

2. **生成ファイルを編集しない**
   - `src/lib/api/generated/` は自動生成されるため編集禁止

3. **fetch関数を手動実装しない**
   - Orval生成のフックを使用

4. **個別のルートファイルを作成しない**

   ```typescript
   // ❌ 個別ルートファイル（旧構成）
   src / lib / hono / routes / todos / get.route.ts

   // ✅ openapi.tsで直接統合（新構成）
   app.openapi(getTodosRoute, getTodos)
   ```

5. **ルート定義を分散させない**
   - すべてのルート定義は`src/lib/hono/openapi.ts`に集約
   - ハンドラーとOpenAPI定義を1箇所で管理

---

## トラブルシューティング

### Q. 生成されたフックが見つからない

**A.** OpenAPI定義を再生成してください

```bash
npm run generate:openapi
npm run generate:api
```

### Q. 型エラーが発生する

**A.** スキーマとOpenAPI定義が一致しているか確認

```bash
# TypeScript型チェック
npm run build
```

### Q. サーバーサイドでOrval関数が動かない

**A.** サーバーサイドでは標準`fetch`を使用

```typescript
// ❌ NextAuthコールバック内でOrval関数
await postApiUsers(...)

// ✅ 標準fetch
await fetch(`${baseUrl}/api/users`, { ... })
```

---

## 参考リンク

- [Orval Documentation](https://orval.dev/)
- [Hono + Zod OpenAPI](https://hono.dev/snippets/zod-openapi)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Swagger UI](http://localhost:30000/api/docs)
