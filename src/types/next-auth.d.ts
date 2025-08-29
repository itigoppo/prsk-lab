import "next-auth"

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string
  }
}
