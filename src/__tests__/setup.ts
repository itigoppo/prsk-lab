import "@testing-library/jest-dom/vitest"
import { vi } from "vitest"

// Fetch APIのモック
global.fetch = vi.fn()

// 環境変数のモック
process.env.BASE_URL = "http://localhost:30000/api"
