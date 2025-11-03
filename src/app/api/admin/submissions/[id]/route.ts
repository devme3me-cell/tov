import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import { getSupabaseClient } from "@/lib/supabase";
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dataFile = path.join(process.cwd(), "data", "submissions.json");

async function checkAuth() {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get("admin-auth");
  return adminAuth?.value === "true";
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Check authentication
  const isAuthed = await checkAuth();
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { status, note } = body;

  if (!status) {
    return NextResponse.json({ error: "Status is required" }, { status: 400 });
  }

  // Prefer service role client for admin operations, fallback to anon
  const supabase = getSupabaseServiceClient() || getSupabaseClient();

  // Try Supabase first
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("submissions")
        .update({
          status,
          note: note || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json(data);
    } catch (err) {
      console.error("Supabase PATCH error:", err);
      // Fall through to local storage
    }
  }

  // Fallback to local storage
  try {
    const raw = await fs.readFile(dataFile, "utf-8");
    const submissions = JSON.parse(raw) as { id: string; status?: string; note?: string | null }[];
    const index = submissions.findIndex((s) => s.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    submissions[index] = {
      ...submissions[index],
      status,
      note: note || null,
    };

    await fs.writeFile(dataFile, JSON.stringify(submissions, null, 2), "utf-8");
    return NextResponse.json(submissions[index]);
  } catch (err) {
    console.error("Local storage PATCH error:", err);
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
  }
}
