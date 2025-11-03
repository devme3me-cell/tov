import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function migrate() {
  console.log("🚀 Starting migration to Supabase...");

  // Read local data
  const dataFile = path.join(process.cwd(), "data", "submissions.json");
  const raw = await fs.readFile(dataFile, "utf-8");
  const submissions = JSON.parse(raw);

  console.log(`📦 Found ${submissions.length} submissions in local storage`);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ Missing Supabase credentials");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  for (const sub of submissions) {
    console.log(`\n📝 Migrating submission: ${sub.id} (${sub.username})`);

    // Insert submission
    const { error: subError } = await supabase.from("submissions").insert({
      id: sub.id,
      date: sub.date,
      username: sub.username,
      plan: sub.plan,
      total: sub.total,
      created_at: sub.createdAt,
      status: sub.status || "pending",
      note: sub.note || null,
    });

    if (subError) {
      console.error(`❌ Failed to insert submission ${sub.id}:`, subError);
      continue;
    }

    // Insert photos
    if (sub.photos && sub.photos.length > 0) {
      const photoInserts = sub.photos.map((url: string) => ({
        submission_id: sub.id,
        url,
      }));

      const { error: photoError } = await supabase
        .from("photos")
        .insert(photoInserts);

      if (photoError) {
        console.error(`❌ Failed to insert photos for ${sub.id}:`, photoError);
      } else {
        console.log(`✅ Inserted ${sub.photos.length} photos`);
      }
    }

    console.log(`✅ Migrated submission ${sub.id}`);
  }

  console.log("\n🎉 Migration complete!");
}

migrate().catch(console.error);
