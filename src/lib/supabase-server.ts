import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase";

let serviceClient: SupabaseClient<Database> | null = null;

/**
 * Get Supabase client with service role key for server-side operations.
 * This client has elevated permissions and should only be used in server contexts.
 * Never expose the service role key to the client.
 */
export function getSupabaseServiceClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  if (!serviceClient) {
    serviceClient = createClient<Database>(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return serviceClient;
}
