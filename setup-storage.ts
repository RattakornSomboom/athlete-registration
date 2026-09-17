import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  const bucketName = "athlete-docs";

  // เช็คว่ามี Bucket อยู่แล้วหรือไม่
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("Error listing buckets:", listError);
    return;
  }

  const exists = buckets.find((b) => b.name === bucketName);

  if (!exists) {
    console.log(`Creating bucket: ${bucketName}...`);
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ["image/jpeg", "image/png", "application/pdf"],
      fileSizeLimit: 5242880, // 5MB
    });

    if (error) {
      console.error("Error creating bucket:", error);
      return;
    }
    console.log("✅ Bucket created successfully!");
  } else {
    console.log("✅ Bucket already exists. Making sure it's public...");
    await supabase.storage.updateBucket(bucketName, {
      public: true,
      allowedMimeTypes: ["image/jpeg", "image/png", "application/pdf"],
      fileSizeLimit: 5242880,
    });
  }
}

setupStorage()
  .then(() => console.log("Storage setup complete."))
  .catch(console.error);
