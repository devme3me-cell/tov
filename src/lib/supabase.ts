import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      submissions: {
        Row: {
          id: string;
          date: string;
          username: string;
          plan: number;
          total: number;
          created_at: string;
          status: string;
          note: string | null;
        };
        Insert: {
          id: string;
          date: string;
          username: string;
          plan: number;
          total: number;
          created_at?: string;
          status?: string;
          note?: string | null;
        };
        Update: {
          id?: string;
          date?: string;
          username?: string;
          plan?: number;
          total?: number;
          created_at?: string;
          status?: string;
          note?: string | null;
        };
        Relationships: [];
      };
      photos: {
        Row: {
          id: number;
          submission_id: string;
          url: string;
        };
        Insert: {
          id?: number;
          submission_id: string;
          url: string;
        };
        Update: {
          id?: number;
          submission_id?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "photos_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let supabaseClient: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient<Database>(url, key);
  }

  return supabaseClient;
}
