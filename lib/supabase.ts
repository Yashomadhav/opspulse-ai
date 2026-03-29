// =============================================================
// OpsPulse AI — Supabase Client
// Handles both server-side and client-side Supabase connections
// =============================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// ─── Feature flag: use mock data ──────────────────────────────
// Returns true when Supabase env vars are missing or mock mode is forced
export function useMockData(): boolean {
  return (
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true" ||
    !supabaseUrl ||
    !supabaseAnonKey
  );
}

// ─── Lazy Supabase client singleton ──────────────────────────
// Only instantiated when valid credentials are present
let _supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (useMockData()) return null;
  if (!_supabaseClient) {
    _supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabaseClient;
}

// ─── Backwards-compatible named export ───────────────────────
// Returns null when credentials are missing (callers must check)
export const supabase = {
  from: (table: string) => {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase not configured — using mock data");
    return client.from(table);
  },
};

// ─── Server-side Supabase instance ───────────────────────────
// Uses service role key for elevated permissions (server only)
export function createServerClient(): SupabaseClient | null {
  if (useMockData()) return null;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnonKey;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ─── Connection health check ──────────────────────────────────
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  try {
    const client = getSupabaseClient();
    if (!client) return false;
    const { error } = await client.from("sites").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}
