import { defineConfig } from "orval"

export default defineConfig({
  prsklab: {
    input: {
      target: "./openapi.json",
    },
    output: {
      client: "react-query",
      mode: "tags-split",
      target: "./src/lib/api/generated",
      schemas: "./src/lib/api/generated/models",
      override: {
        mutator: {
          path: "./src/lib/api/mutator.ts",
          name: "customInstance",
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
      },
      clean: true,
      prettier: true,
    },
  },
})
