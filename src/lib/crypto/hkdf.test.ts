import { beforeEach, describe, expect, it, vi } from "vitest"
import { deriveKey } from "./hkdf"

// crypto.subtleのモック
const mockImportKey = vi.fn()
const mockDeriveBits = vi.fn()

Object.defineProperty(global, "crypto", {
  configurable: true,
  value: {
    subtle: {
      deriveBits: mockDeriveBits,
      importKey: mockImportKey,
    },
  },
  writable: true,
})

describe("deriveKey", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("正常系", () => {
    it("鍵を正しく導出できる", async () => {
      const ikm = new Uint8Array([1, 2, 3, 4, 5])
      const salt = new Uint8Array([6, 7, 8, 9, 10])
      const info = new Uint8Array([11, 12, 13])
      const keyLen = 32

      const mockCryptoKey = { type: "secret" }
      const mockDerivedBits = new ArrayBuffer(32)

      mockImportKey.mockResolvedValueOnce(mockCryptoKey)
      mockDeriveBits.mockResolvedValueOnce(mockDerivedBits)

      const result = await deriveKey(ikm, salt, info, keyLen)

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(keyLen)

      // importKeyが正しいパラメータで呼ばれたことを確認
      expect(mockImportKey).toHaveBeenCalledWith("raw", ikm, "HKDF", false, ["deriveBits"])

      // deriveBitsが正しいパラメータで呼ばれたことを確認
      expect(mockDeriveBits).toHaveBeenCalledWith(
        {
          hash: "SHA-256",
          info: info.buffer,
          name: "HKDF",
          salt: salt.buffer,
        },
        mockCryptoKey,
        keyLen * 8
      )
    })

    it("異なる鍵長で動作する - 16バイト", async () => {
      const ikm = new Uint8Array(32)
      const salt = new Uint8Array(16)
      const info = new Uint8Array(8)
      const keyLen = 16

      const mockCryptoKey = { type: "secret" }
      const mockDerivedBits = new ArrayBuffer(16)

      mockImportKey.mockResolvedValueOnce(mockCryptoKey)
      mockDeriveBits.mockResolvedValueOnce(mockDerivedBits)

      const result = await deriveKey(ikm, salt, info, keyLen)

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(16)
      expect(mockDeriveBits).toHaveBeenCalledWith(
        expect.objectContaining({
          hash: "SHA-256",
          name: "HKDF",
        }),
        mockCryptoKey,
        128 // 16 * 8
      )
    })

    it("異なる鍵長で動作する - 64バイト", async () => {
      const ikm = new Uint8Array(32)
      const salt = new Uint8Array(16)
      const info = new Uint8Array(8)
      const keyLen = 64

      const mockCryptoKey = { type: "secret" }
      const mockDerivedBits = new ArrayBuffer(64)

      mockImportKey.mockResolvedValueOnce(mockCryptoKey)
      mockDeriveBits.mockResolvedValueOnce(mockDerivedBits)

      const result = await deriveKey(ikm, salt, info, keyLen)

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)
      expect(mockDeriveBits).toHaveBeenCalledWith(
        expect.objectContaining({
          hash: "SHA-256",
          name: "HKDF",
        }),
        mockCryptoKey,
        512 // 64 * 8
      )
    })

    it("空のinfoで動作する", async () => {
      const ikm = new Uint8Array([1, 2, 3])
      const salt = new Uint8Array([4, 5, 6])
      const info = new Uint8Array([])
      const keyLen = 32

      const mockCryptoKey = { type: "secret" }
      const mockDerivedBits = new ArrayBuffer(32)

      mockImportKey.mockResolvedValueOnce(mockCryptoKey)
      mockDeriveBits.mockResolvedValueOnce(mockDerivedBits)

      const result = await deriveKey(ikm, salt, info, keyLen)

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })
  })

  describe("入力バリデーション", () => {
    it("様々なikmサイズで動作する", async () => {
      const salt = new Uint8Array(16)
      const info = new Uint8Array(8)
      const keyLen = 32

      const mockCryptoKey = { type: "secret" }
      const mockDerivedBits = new ArrayBuffer(32)

      // 小さいikm
      mockImportKey.mockResolvedValueOnce(mockCryptoKey)
      mockDeriveBits.mockResolvedValueOnce(mockDerivedBits)

      const result1 = await deriveKey(new Uint8Array(1), salt, info, keyLen)
      expect(result1.length).toBe(32)

      // 大きいikm
      mockImportKey.mockResolvedValueOnce(mockCryptoKey)
      mockDeriveBits.mockResolvedValueOnce(mockDerivedBits)

      const result2 = await deriveKey(new Uint8Array(256), salt, info, keyLen)
      expect(result2.length).toBe(32)
    })

    it("様々なsaltサイズで動作する", async () => {
      const ikm = new Uint8Array(32)
      const info = new Uint8Array(8)
      const keyLen = 32

      const mockCryptoKey = { type: "secret" }
      const mockDerivedBits = new ArrayBuffer(32)

      // 空のsalt
      mockImportKey.mockResolvedValueOnce(mockCryptoKey)
      mockDeriveBits.mockResolvedValueOnce(mockDerivedBits)

      const result1 = await deriveKey(ikm, new Uint8Array(0), info, keyLen)
      expect(result1.length).toBe(32)

      // 大きいsalt
      mockImportKey.mockResolvedValueOnce(mockCryptoKey)
      mockDeriveBits.mockResolvedValueOnce(mockDerivedBits)

      const result2 = await deriveKey(ikm, new Uint8Array(128), info, keyLen)
      expect(result2.length).toBe(32)
    })
  })

  describe("エラーハンドリング", () => {
    it("importKeyが失敗した場合はエラーを投げる", async () => {
      const ikm = new Uint8Array([1, 2, 3])
      const salt = new Uint8Array([4, 5, 6])
      const info = new Uint8Array([7, 8, 9])
      const keyLen = 32

      mockImportKey.mockRejectedValueOnce(new Error("Import key failed"))

      await expect(deriveKey(ikm, salt, info, keyLen)).rejects.toThrow("Import key failed")

      expect(mockDeriveBits).not.toHaveBeenCalled()
    })

    it("deriveBitsが失敗した場合はエラーを投げる", async () => {
      const ikm = new Uint8Array([1, 2, 3])
      const salt = new Uint8Array([4, 5, 6])
      const info = new Uint8Array([7, 8, 9])
      const keyLen = 32

      const mockCryptoKey = { type: "secret" }
      mockImportKey.mockResolvedValueOnce(mockCryptoKey)
      mockDeriveBits.mockRejectedValueOnce(new Error("Derive bits failed"))

      await expect(deriveKey(ikm, salt, info, keyLen)).rejects.toThrow("Derive bits failed")
    })
  })

  describe("実際のユースケース", () => {
    it("NextAuthの暗号化キー導出をシミュレートできる", async () => {
      const secret = "NEXTAUTH_SECRET"
      const ikm = new TextEncoder().encode(secret)
      const salt = new Uint8Array(16)
      const info = new TextEncoder().encode("NextAuth.js Generated Encryption Key")
      const keyLen = 32

      const mockCryptoKey = { type: "secret" }
      const mockDerivedBits = new ArrayBuffer(32)

      mockImportKey.mockResolvedValueOnce(mockCryptoKey)
      mockDeriveBits.mockResolvedValueOnce(mockDerivedBits)

      const result = await deriveKey(ikm, salt, info, keyLen)

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)

      // 正しいアルゴリズムで呼ばれたことを確認
      expect(mockImportKey).toHaveBeenCalledWith("raw", ikm, "HKDF", false, ["deriveBits"])

      expect(mockDeriveBits).toHaveBeenCalledWith(
        {
          hash: "SHA-256",
          info: info.buffer,
          name: "HKDF",
          salt: salt.buffer,
        },
        mockCryptoKey,
        256
      )
    })

    it("複数回呼び出しても動作する", async () => {
      const ikm = new Uint8Array([1, 2, 3])
      const salt = new Uint8Array([4, 5, 6])
      const info = new Uint8Array([7, 8, 9])
      const keyLen = 32

      const mockCryptoKey = { type: "secret" }
      const mockDerivedBits = new ArrayBuffer(32)

      mockImportKey.mockResolvedValue(mockCryptoKey)
      mockDeriveBits.mockResolvedValue(mockDerivedBits)

      // 1回目
      const result1 = await deriveKey(ikm, salt, info, keyLen)
      expect(result1.length).toBe(32)

      // 2回目
      const result2 = await deriveKey(ikm, salt, info, keyLen)
      expect(result2.length).toBe(32)

      expect(mockImportKey).toHaveBeenCalledTimes(2)
      expect(mockDeriveBits).toHaveBeenCalledTimes(2)
    })

    it("異なる入力で異なる鍵を生成する（モックの動作確認）", async () => {
      const ikm1 = new Uint8Array([1, 2, 3])
      const ikm2 = new Uint8Array([4, 5, 6])
      const salt = new Uint8Array([7, 8, 9])
      const info = new Uint8Array([10, 11, 12])
      const keyLen = 32

      const mockCryptoKey = { type: "secret" }
      const mockDerivedBits1 = new ArrayBuffer(32)
      const mockDerivedBits2 = new ArrayBuffer(32)

      mockImportKey.mockResolvedValueOnce(mockCryptoKey)
      mockDeriveBits.mockResolvedValueOnce(mockDerivedBits1)

      await deriveKey(ikm1, salt, info, keyLen)

      mockImportKey.mockResolvedValueOnce(mockCryptoKey)
      mockDeriveBits.mockResolvedValueOnce(mockDerivedBits2)

      await deriveKey(ikm2, salt, info, keyLen)

      // 異なるikmでimportKeyが呼ばれたことを確認
      expect(mockImportKey).toHaveBeenNthCalledWith(1, "raw", ikm1, "HKDF", false, ["deriveBits"])
      expect(mockImportKey).toHaveBeenNthCalledWith(2, "raw", ikm2, "HKDF", false, ["deriveBits"])
    })
  })

  describe("特殊ケース", () => {
    it("鍵長1バイトでも動作する", async () => {
      const ikm = new Uint8Array([1])
      const salt = new Uint8Array([2])
      const info = new Uint8Array([3])
      const keyLen = 1

      const mockCryptoKey = { type: "secret" }
      const mockDerivedBits = new ArrayBuffer(1)

      mockImportKey.mockResolvedValueOnce(mockCryptoKey)
      mockDeriveBits.mockResolvedValueOnce(mockDerivedBits)

      const result = await deriveKey(ikm, salt, info, keyLen)

      expect(result.length).toBe(1)
      expect(mockDeriveBits).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        8 // 1 * 8
      )
    })

    it("大きな鍵長でも動作する", async () => {
      const ikm = new Uint8Array([1])
      const salt = new Uint8Array([2])
      const info = new Uint8Array([3])
      const keyLen = 256

      const mockCryptoKey = { type: "secret" }
      const mockDerivedBits = new ArrayBuffer(256)

      mockImportKey.mockResolvedValueOnce(mockCryptoKey)
      mockDeriveBits.mockResolvedValueOnce(mockDerivedBits)

      const result = await deriveKey(ikm, salt, info, keyLen)

      expect(result.length).toBe(256)
      expect(mockDeriveBits).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        2048 // 256 * 8
      )
    })
  })
})
