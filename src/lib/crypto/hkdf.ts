export async function deriveKey(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  keyLen: number
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    ikm as unknown as ArrayBuffer,
    "HKDF",
    false,
    ["deriveBits"]
  )

  const derivedBits = await crypto.subtle.deriveBits(
    {
      hash: "SHA-256",
      info: info.buffer as ArrayBuffer,
      name: "HKDF",
      salt: salt.buffer as ArrayBuffer,
    },
    cryptoKey,
    keyLen * 8
  )

  return new Uint8Array(derivedBits)
}
