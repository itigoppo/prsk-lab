#!/usr/bin/env ts-node
/**
 * ハンドラーファイルに対応するテストファイルが存在するかチェックするスクリプト
 */

import { existsSync, readFileSync, readdirSync, statSync } from "fs"
import path from "path"

// 再帰的にファイルを検索
function findFiles(dir: string, pattern: RegExp, files: string[] = []): string[] {
  if (!existsSync(dir)) return files

  const entries = readdirSync(dir)

  for (const entry of entries) {
    const fullPath = path.join(dir, entry)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      findFiles(fullPath, pattern, files)
    } else if (pattern.test(fullPath)) {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * openapi.ts から定義されている全エンドポイントを自動抽出
 */
function extractEndpointsFromOpenAPI(): Set<string> {
  const openapiPath = "src/lib/hono/openapi.ts"

  if (!existsSync(openapiPath)) {
    console.warn(`⚠️  Warning: ${openapiPath} not found`)
    return new Set()
  }

  const content = readFileSync(openapiPath, "utf-8")
  const endpoints = new Set<string>()

  // createRoute の定義から method と path を抽出
  // 例: method: "get", と path: "/api/users/me", を見つける
  // [\s\S] は改行を含む任意の文字にマッチ（s フラグの代替）
  const routePattern =
    /const\s+\w+Route\s*=\s*createRoute\s*\({[\s\S]*?method:\s*["'](\w+)["'][\s\S]*?path:\s*["']([^"']+)["'][\s\S]*?}\)/g

  let match
  while ((match = routePattern.exec(content)) !== null) {
    const method = match[1].toUpperCase()
    const path = match[2]
    endpoints.add(`${method} ${path}`)
  }

  return endpoints
}

/**
 * テストのパスをOpenAPIのパスパターンに変換
 * 例: /api/furnitures/leoneed -> /api/furnitures/{unitCode}
 */
function normalizePathToPattern(testPath: string, openApiPaths: Set<string>): string {
  // OpenAPIのパスからパターンを取得
  for (const endpoint of openApiPaths) {
    const [, openApiPath] = endpoint.split(" ")
    if (!openApiPath) continue

    // パスパラメータを正規表現に変換
    // 例: /api/furnitures/{unitCode} -> /api/furnitures/[^/]+
    const pattern = openApiPath.replace(/\{[^}]+\}/g, "[^/]+")
    const regex = new RegExp(`^${pattern}$`)

    if (regex.test(testPath)) {
      return openApiPath
    }
  }

  return testPath
}

/**
 * 統合テストファイルから実際にテストされているエンドポイントを抽出
 */
function extractTestedEndpoints(openApiEndpoints: Set<string>): Set<string> {
  const integrationTestFiles = findFiles("src/__tests__/integration", /\.integration\.test\.ts$/)
  const testedEndpoints = new Set<string>()

  for (const testFile of integrationTestFiles) {
    const content = readFileSync(testFile, "utf-8")

    // openAPIApp.request のパターンを探す
    // パターン1: 同じ行に method がある場合
    // 例: await openAPIApp.request("/api/users/me", { method: "GET" })
    const inlinePattern = /openAPIApp\.request\(["']([^"']+)["'][^)]*method:\s*["'](\w+)["']/gi

    let match
    while ((match = inlinePattern.exec(content)) !== null) {
      const testPath = match[1]
      const method = match[2].toUpperCase()
      const normalizedPath = normalizePathToPattern(testPath, openApiEndpoints)
      testedEndpoints.add(`${method} ${normalizedPath}`)
    }

    // パターン2: method が別の行にある場合
    // 例: await openAPIApp.request("/api/users/settings", {
    //        body: ...,
    //        method: "POST",
    //      })
    const multilinePattern =
      /openAPIApp\.request\(["']([^"']+)["'][\s\S]{0,500}?method:\s*["'](\w+)["']/gi

    while ((match = multilinePattern.exec(content)) !== null) {
      const testPath = match[1]
      const method = match[2].toUpperCase()
      const normalizedPath = normalizePathToPattern(testPath, openApiEndpoints)
      testedEndpoints.add(`${method} ${normalizedPath}`)
    }
  }

  return testedEndpoints
}

/**
 * ハンドラー名を抽出（例: get-current-user.handler.ts -> getCurrentUser）
 */
function extractHandlerName(filePath: string): string {
  const fileName = path.basename(filePath, ".ts")
  // get-current-user.handler -> getCurrentUser
  const parts = fileName.replace(".handler", "").split("-")
  return parts
    .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("")
}

function checkHandlerTests() {
  console.log("🔍 Checking handler test coverage...\n")

  // ハンドラーファイルを取得（テストファイルは除外）
  const handlerFiles = findFiles("src/lib/handlers", /\.handler\.ts$/).filter(
    (file) => !file.includes(".test.ts") && !file.includes(".spec.ts")
  )

  // 統合テストファイルを取得
  const integrationTestFiles = findFiles("src/__tests__/integration", /\.integration\.test\.ts$/)

  console.log(`Found ${handlerFiles.length} handler files`)
  console.log(`Found ${integrationTestFiles.length} integration test files\n`)

  const missingUnitTests: string[] = []
  const missingIntegrationTests: string[] = []
  const handlerDirs = new Set<string>()

  // ハンドラーのディレクトリを収集
  for (const handlerFile of handlerFiles) {
    const dir = path.dirname(handlerFile)
    handlerDirs.add(dir)
  }

  console.log("=".repeat(60))
  console.log("📋 Unit Test Coverage Check (per handler file)")
  console.log("=".repeat(60) + "\n")

  // 各ハンドラーファイルに対して対応するテストの存在をチェック
  for (const handlerFile of handlerFiles) {
    const dir = path.dirname(handlerFile)
    const handlerName = extractHandlerName(handlerFile)
    const relativeHandlerPath = path.relative("src/lib/handlers", handlerFile)

    // 同じディレクトリ内のテストファイルを探す
    const testFiles = findFiles(dir, /\.handler\.test\.ts$/)

    let matchedTestFile: string | null = null

    if (testFiles.length > 0) {
      // テストファイル内でハンドラー名が言及されているか確認
      for (const testFile of testFiles) {
        const testContent = readFileSync(testFile, "utf-8")
        // import文またはテスト内でハンドラー名が使用されているか
        const importRegex = new RegExp(`import\\s*\\{[^}]*\\b${handlerName}\\b`)
        if (
          importRegex.test(testContent) ||
          testContent.includes(`${handlerName}(`) ||
          testContent.includes(`${handlerName},`)
        ) {
          matchedTestFile = testFile
          break
        }
      }
    }

    if (matchedTestFile) {
      console.log(`✅ ${relativeHandlerPath}`)
      console.log(`   Tested in ${path.relative("src/lib/handlers", matchedTestFile)}`)
    } else {
      console.log(`❌ ${relativeHandlerPath}`)
      console.log(`   No unit test found`)
      missingUnitTests.push(handlerFile)
    }
  }

  console.log("\n" + "=".repeat(60))
  console.log("🌐 Integration Test Coverage Check")
  console.log("=".repeat(60) + "\n")

  // openapi.ts から自動的にエンドポイントを抽出
  console.log("📡 Extracting endpoints from openapi.ts...")
  const allEndpoints = extractEndpointsFromOpenAPI()
  console.log(`   Found ${allEndpoints.size} endpoint(s) defined in openapi.ts\n`)

  // 統合テストファイルから実際にテストされているエンドポイントを抽出
  console.log("🔬 Extracting tested endpoints from integration tests...")
  const testedEndpoints = extractTestedEndpoints(allEndpoints)
  console.log(`   Found ${testedEndpoints.size} endpoint(s) tested\n`)

  // 各エンドポイントがテストされているかチェック
  for (const endpoint of Array.from(allEndpoints).sort()) {
    if (testedEndpoints.has(endpoint)) {
      console.log(`✅ ${endpoint}`)
      console.log(`   Tested in integration tests`)
    } else {
      console.log(`❌ ${endpoint}`)
      console.log(`   No integration test found`)
      missingIntegrationTests.push(endpoint)
    }
  }

  // 統合テストファイルの情報
  if (integrationTestFiles.length > 0) {
    console.log("\n📦 Existing integration test files:")
    integrationTestFiles.forEach((file) => {
      console.log(`   • ${path.basename(file)}`)
    })
  }

  // 結果の表示
  console.log("\n" + "=".repeat(60))
  console.log("📊 Summary")
  console.log("=".repeat(60))

  const hasErrors = missingUnitTests.length > 0 || missingIntegrationTests.length > 0

  if (missingUnitTests.length > 0) {
    console.log(`\n❌ ${missingUnitTests.length} handler file(s) missing unit tests:`)
    missingUnitTests.forEach((handlerFile) => {
      const relativePath = path.relative("src/lib/handlers", handlerFile)
      const dir = path.dirname(handlerFile)
      const handlerName = extractHandlerName(handlerFile)
      console.log(`   - ${relativePath}`)
      console.log(
        `     Create test in: ${path.relative("src/lib/handlers", dir)}/*.handler.test.ts`
      )
      console.log(`     Import: import { ${handlerName} } from "./${path.basename(handlerFile)}"`)
    })
  } else {
    console.log("\n✅ All handlers have unit test coverage")
  }

  if (missingIntegrationTests.length > 0) {
    console.log(`\n❌ ${missingIntegrationTests.length} endpoint(s) missing integration tests:`)
    missingIntegrationTests.forEach((endpoint) => {
      console.log(`   - ${endpoint}`)
    })
    console.log("\n   Create integration tests in: src/__tests__/integration/")
  } else {
    console.log("\n✅ All endpoints have integration test coverage")
  }

  console.log("=".repeat(60))

  if (hasErrors) {
    console.log("\n💡 Both unit tests AND integration tests are required:")
    console.log("   • Unit tests: Test handler logic in detail")
    console.log("   • Integration tests: Verify actual API endpoints work")
    process.exit(1)
  } else {
    console.log("\n🎉 Perfect! All handlers are properly tested.")
    process.exit(0)
  }
}

checkHandlerTests()
