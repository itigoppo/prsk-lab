export async function deriveKey(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  keyLen: number
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"])

  const derivedBits = await crypto.subtle.deriveBits(
    {
      hash: "SHA-256",
      info,
      name: "HKDF",
      salt,
    },
    cryptoKey,
    keyLen * 8
  )

  return new Uint8Array(derivedBits)
}
