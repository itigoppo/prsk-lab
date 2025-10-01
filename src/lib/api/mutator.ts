import type { AxiosRequestConfig } from "axios"
import axios from "axios"

export const AXIOS_INSTANCE = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
})

// リクエストインターセプター（認証トークンなどを追加）
AXIOS_INSTANCE.interceptors.request.use((config) => {
  // NextAuthのセッションを使う場合はここで追加
  return config
})

// カスタムインスタンス関数（Orvalが使用）
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const source = axios.CancelToken.source()
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data) as Promise<T>

  // @ts-expect-error cancel token
  promise.cancel = () => {
    source.cancel("Query was cancelled")
  }

  return promise
}

export default customInstance
