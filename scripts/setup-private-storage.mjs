import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
const name = process.env.PRIVATE_DOCUMENT_BUCKET || "athlete-private";
if (name === "athlete-docs") throw new Error("Private bucket must differ from legacy athlete-docs");
const client = createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await client.storage.listBuckets();
if(error) throw new Error("Unable to inspect storage buckets");
const existing = data.find(b=>b.name===name);
if(existing?.public) throw new Error("Configured bucket is public; choose a private bucket");
if(!existing){
 const {error} = await client.storage.createBucket(name,{ public:false,fileSizeLimit:5*1024*1024,allowedMimeTypes:["application/pdf","image/jpeg","image/png"] });
 if(error) throw new Error("Unable to create private bucket");
}
console.log("Private document bucket verified.");
if (process.argv.includes("--privatize-legacy")) {
  const legacy = data.find(b => b.name === "athlete-docs");
  if (legacy?.public) {
    const { error } = await client.storage.updateBucket("athlete-docs", { public: false });
    if (error) throw new Error("Unable to make legacy document bucket private");
  }
  console.log("Legacy bucket privacy updated; verify direct-access policies and anonymous URLs before release.");
}
