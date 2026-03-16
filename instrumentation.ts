export async function register() {
  // Node 25+ has built-in localStorage that requires --localstorage-file.
  // Override it with an in-memory polyfill for SSR (Supabase auth needs it).
  if (typeof window === "undefined") {
    const store = new Map<string, string>();
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
      get length() { return store.size; },
      key: (index: number) => [...store.keys()][index] ?? null,
    };
  }
}
