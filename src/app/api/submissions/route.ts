import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getSupabaseClient } from "@/lib/supabase";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Submission = {
  id: string;
  date: string;
  username: string;
  plan: number;
  total: number;
  photos: string[];
  createdAt: string;
  status?: string;
  note?: string | null;
};

type SubmissionRow = {
  id: string;
  date: string;
  username: string;
  plan: number;
  total: number;
  created_at: string;
  status: string;
  note: string | null;
  photos: Array<{ url: string }>;
};

const root = process.cwd();
const dataDir = path.join(root, "data");
const uploadsDir = path.join(root, "public", "uploads");
const dataFile = path.join(dataDir, "submissions.json");

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(uploadsDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, "[]", "utf-8");
  }
}

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET() {
  // Try Supabase first (works with anon or service role)
  const supabase = getSupabaseClient() || getSupabaseServiceClient();

  if (supabase) {
    try {
      const { data: submissions, error } = await supabase
        .from("submissions")
        .select(
          `id,
          date,
          username,
          plan,
          total,
          created_at,
          status,
          note,
          photos (
            url
          )`
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform to expected format
      const entries: Submission[] = (submissions as SubmissionRow[] || []).map((sub) => ({
        id: sub.id,
        date: sub.date,
        username: sub.username,
        plan: sub.plan,
        total: sub.total,
        photos: (sub.photos || []).map((p) => p.url),
        createdAt: sub.created_at,
        status: sub.status,
        note: sub.note,
      }));

      return NextResponse.json(entries);
    } catch (err) {
      console.error("Supabase GET error:", err);
      // Fall through to local storage
    }
  }

  // Fallback to local storage
  await ensureStore();
  const raw = await fs.readFile(dataFile, "utf-8");
  const entries: Submission[] = JSON.parse(raw);
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const username = String(form.get("username") || "").trim();
  const plan = Number(form.get("plan") || 0);
  const total = Number(form.get("total") || 0);
  const files = form.getAll("files");

  if (!username || !plan || !total || files.length === 0) {
    return NextResponse.json({ error: "缺少必要欄位或未上傳照片" }, { status: 400 });
  }

  // Prefer service role client for secure uploads, fallback to anon
  const supabase = getSupabaseServiceClient() || getSupabaseClient();
  const id = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const savedUrls: string[] = [];

  // Try Supabase first
  if (supabase) {
    try {
      // Upload files to Supabase Storage
      for (const f of files) {
        const file = f as File;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const original = (file.name || "upload").replace(/[^a-zA-Z0-9._-]/g, "_");
        const base = original.replace(/\.[^.]+$/, "");
        const extMatch = /\.[a-zA-Z0-9]+$/.exec(original);
        const ext = extMatch ? extMatch[0] : ".jpg";
        const fname = `${Date.now()}_${Math.floor(Math.random() * 1e6)}_${base}${ext}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("turnover-uploads")
          .upload(fname, buffer, {
            contentType: file.type || "image/jpeg",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("turnover-uploads")
          .getPublicUrl(uploadData.path);

        savedUrls.push(urlData.publicUrl);
      }

      // Insert submission
      const { error: insertError } = await supabase
        .from("submissions")
        .insert({
          id,
          date: todayKey(),
          username,
          plan,
          total,
        });

      if (insertError) throw insertError;

      // Insert photos
      const photoInserts = savedUrls.map((url) => ({
        submission_id: id,
        url,
      }));

      const { error: photosError } = await supabase
        .from("photos")
        .insert(photoInserts);

      if (photosError) throw photosError;

      const entry: Submission = {
        id,
        date: todayKey(),
        username,
        plan,
        total,
        photos: savedUrls,
        createdAt: new Date().toISOString(),
        status: "pending",
      };

      return NextResponse.json(entry, { status: 201 });
    } catch (err) {
      console.error("Supabase POST error:", err);
      // Fall through to local storage
      savedUrls.length = 0; // Clear URLs from failed Supabase attempt
    }
  }

  // Fallback to local storage
  await ensureStore();

  // Save images to uploads directory
  for (const f of files) {
    const file = f as File;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const original = (file.name || "upload").replace(/[^a-zA-Z0-9._-]/g, "_");
    const base = original.replace(/\.[^.]+$/, "");
    const extMatch = /\.[a-zA-Z0-9]+$/.exec(original);
    const ext = extMatch ? extMatch[0] : ".jpg";
    const fname = `${Date.now()}_${Math.floor(Math.random() * 1e6)}_${base}${ext}`;
    const filePath = path.join(uploadsDir, fname);
    await fs.writeFile(filePath, buffer);
    savedUrls.push(`/uploads/${fname}`);
  }

  const entry: Submission = {
    id,
    date: todayKey(),
    username,
    plan,
    total,
    photos: savedUrls,
    createdAt: new Date().toISOString(),
  };

  const raw = await fs.readFile(dataFile, "utf-8");
  const list: Submission[] = JSON.parse(raw);
  list.push(entry);
  await fs.writeFile(dataFile, JSON.stringify(list, null, 2), "utf-8");

  return NextResponse.json(entry, { status: 201 });
}
