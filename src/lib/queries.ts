// Claves de TanStack Query centralizadas.

export const qk = {
  batches: ["batches"] as const,
  batchDetail: (id: string) => ["batches", id, "detail"] as const,
  session: ["session"] as const,
}
