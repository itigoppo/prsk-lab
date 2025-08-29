export const BASE_URL =
  process.env.NEXTAUTH_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://prsk-lab.vercel.app")
