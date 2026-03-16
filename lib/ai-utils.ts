/**
 * Safely extract a name from a Supabase join that may return
 * a single object OR an array (depending on FK relationships).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getJoinedName(joined: any, fallback = "Unknown"): string {
  if (!joined) return fallback;
  if (Array.isArray(joined)) return joined[0]?.name ?? fallback;
  return joined.name ?? fallback;
}
