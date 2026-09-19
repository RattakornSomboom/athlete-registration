import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const url = process.env.TEST_BASE_URL;
const db = process.env.TEST_DATABASE_URL;
if (!url || !db || process.env.TEST_ALLOW_WRITE !== "yes") throw new Error("Set TEST_BASE_URL, TEST_DATABASE_URL and TEST_ALLOW_WRITE=yes explicitly; test database only.");
const base = new URL(url);
if (!["localhost","127.0.0.1","[::1]"].includes(base.hostname)) throw new Error("Integration runner requires a local test server.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: db }) });
const storage = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const bucket = process.env.PRIVATE_DOCUMENT_BUCKET || "athlete-private";
const tag = "p4-" + randomUUID();
const password = "Test!" + randomUUID();
const userIds = []; const clubIds = []; const competitionIds = []; const emails = [];
const docIds = [];
const log = [];
const statePath = "test-results/phase4-fixtures.json";
function state() { fs.mkdirSync("test-results",{recursive:true});fs.writeFileSync(statePath,JSON.stringify({tag,userIds,clubIds,competitionIds,emails,docIds},null,2)); }
async function call(path, cookie="", data, method = data===undefined?"GET":"POST", expected=200) {
  const response = await fetch(base.origin+path, { method, headers:{...(cookie?{Cookie:cookie}:{}),...(data!==undefined&&!(data instanceof FormData)?{"Content-Type":"application/json"}:{})}, body:data===undefined?undefined:data instanceof FormData?data:JSON.stringify(data), redirect:"manual" });
  const text = await response.text(); let json; try{json=JSON.parse(text);}catch{json={};}
  if(expected!==null) assert.equal(response.status,expected,method+" "+path+" status; "+(json.error||""));
  assert.ok(!text.includes('"password"'),"Response must not expose password fields");
  return {response,json};
}
async function login(username) { const {response}=await call("/api/auth/login","",{username,password}); const token=response.headers.getSetCookie().find(s=>s.startsWith("token=")); assert.ok(token,"login returns token");return token.split(";")[0];}
async function upload(cookie, content="%PDF-1.4\nphase4 test\n%%EOF", type="application/pdf", expected=200){
 const form=new FormData();form.set("file",new Blob([content],{type}),"fixture.pdf");
 const {json}=await call("/api/documents",cookie,form,"POST",expected);
 if(json.document){docIds.push(json.document.id);state();}
 return json.document?.id;
}
async function makeUser(role,index){
 const email=tag+"-"+index+"@example.test";emails.push(email);
 const studentId=role==="ATHLETE"?"9"+String(Date.now()+index).slice(-7):null;
 const u=await prisma.user.create({data:{role,email,studentId,password:await bcrypt.hash(password,4),...(role==="ATHLETE"?{profile:{create:{firstName:"Fixture",lastName:String(index),faculty:index%2?"Science":"Arts",major:"Test",year:"1",nationalId:"1234567890123",birthDate:new Date("2005-01-01"),addressNo:"1",subDistrict:"Test",district:"Test",province:"Test",postalCode:"56000",phone:"0800000000"}}}:{})}});
 userIds.push(u.id);state();return u;
}
async function makeClub(sport,index) {
 const c=await prisma.club.create({data:{name:tag+" club "+index,sport,email:tag+"-club"+index+"@example.test",password:await bcrypt.hash(password,4),status:"ACTIVE",isActive:true}});
 clubIds.push(c.id);state();return c;
}
async function makeCompetition(name,sports,maxStarters=2,maxSubstitutes=1) {
 const c=await prisma.competition.create({data:{name:tag+name,round:"Test",year:2026,status:"OPEN",deadline:new Date(Date.now()+86400000),quotas:{create:sports.map(sport=>({sport,maxStarters,maxSubstitutes}))}}});
 competitionIds.push(c.id);state();return c;
}
const athleteDocs=Object.fromEntries(["photoFileUrl","idCardFileUrl","studentCardFileUrl","studentCertFileUrl","upAcademyFileUrl","fitnessTestFileUrl"].map(k=>[k,"https://example.test/fixture.pdf"]));
async function seedApplication(user,competition,sport,status="SUBMITTED"){
 return prisma.application.create({data:{userId:user.id,competitionId:competition.id,sport,category:"ทั่วไป",status,...athleteDocs}});
}
test("Phase 4 real HTTP + PostgreSQL + private Storage", {timeout:1800000}, async t=>{
 let failed=false;
 async function step(name,fn){let ok=false;await t.test(name,async()=>{await fn();ok=true;log.push({name,status:"PASS"});});if(!ok){failed=true;log.push({name,status:"FAIL"});throw new Error("Stopped after failed step: "+name);}}
 try{
  const staff=await makeUser("STAFF",1),staff2=await makeUser("STAFF",2),admin=await makeUser("ADMIN",3);
  const a1=await makeUser("ATHLETE",11),a2=await makeUser("ATHLETE",12),a3=await makeUser("ATHLETE",13);
  const sport=tag+" sport",otherSport=tag+" other";
  const club=await makeClub(sport,1),club2=await makeClub(sport,2),otherClub=await makeClub(otherSport,3);
  const comp=await makeCompetition(" competition",[sport,otherSport]);
  const race=await makeCompetition(" race",[sport],1,0);
  const cs=await login(staff.email),cs2=await login(staff2.email),ca=await login(admin.email),cc=await login(club.email),cc2=await login(club2.email),co=await login(otherClub.email),c1=await login(a1.studentId);
  let app1,app2,app3,wrongApp,doc,roster,official,officialCookie,officialId,officialDoc,officialCard,snapId;
  await step("Existing athlete/club login and athlete submission regression",async()=>{
   await call("/api/auth/me",cc);await call("/api/auth/me",c1);
   const result=await call("/api/applications",c1,{studentId:a1.studentId,competitionId:comp.id,sport,category:"ทั่วไป",...athleteDocs},"POST",201);app1=result.json.application;
   app2=await seedApplication(a2,comp,sport);app3=await seedApplication(a3,comp,sport);
   wrongApp=await seedApplication(a1,comp,otherSport,"STAFF_REJECTED");
   await call("/api/applications",c1);await call("/api/staff/applications?competitionId="+comp.id,cs);
   await call("/api/applications/"+wrongApp.id,cc,undefined,"GET",403);
  });
  await step("Analytics matches filtered SQL counts, unique athletes, statuses, empty and quotas",async()=>{
   const {json}=await call("/api/staff/analytics?competitionId="+comp.id,cs);
   assert.equal(json.summary.metrics.totalApplications,4);assert.equal(json.summary.metrics.uniqueAthletes,3);assert.equal(json.summary.metrics.pending,3);assert.equal(json.summary.metrics.rejected,1);assert.equal(json.summary.metrics.totalQuota,6);
   const count=await prisma.application.count({where:{competitionId:comp.id,sport}});
   const filtered=await call("/api/staff/analytics?"+new URLSearchParams({competitionId:comp.id,sport}),cs);assert.equal(filtered.json.rows.length,count);assert.equal(filtered.json.summary.metrics.totalQuota,3);
   const empty=await call("/api/staff/analytics?competitionId=missing-"+tag,cs);assert.equal(empty.json.summary.metrics.fillRate,0);assert.equal(empty.json.summary.metrics.acceptanceRate,0);
   await call("/api/staff/analytics",c1,undefined,"GET",403);await call("/api/staff/analytics","",undefined,"GET",401);
  });
  await step("Snapshot is recalculated server-side, readable cross-account, immutable, and access-controlled",async()=>{
   const {json}=await call("/api/staff/snapshots",cs,{title:tag,notes:"fixture",competitionId:comp.id,data:{metrics:{totalApplications:9999}}});snapId=json.snapshot.id;
   assert.equal(json.snapshot.data.metrics.totalApplications,4);
   const before=await call("/api/staff/snapshots/"+snapId,cs2);
   await prisma.application.update({where:{id:app3.id},data:{status:"CLUB_REJECTED"}});
   const after=await call("/api/staff/snapshots/"+snapId,cs2);assert.deepEqual(after.json.snapshot.data,before.json.snapshot.data);
   assert.ok(!JSON.stringify(after.json.snapshot.data).includes(a1.id));
   await call("/api/staff/snapshots/"+snapId,cs2,{},"DELETE",403);
   await call("/api/staff/snapshots/"+snapId,cc,undefined,"GET",403);
   await call("/api/staff/snapshots/"+snapId,ca,{},"DELETE");snapId=null;
   const own=await call("/api/staff/snapshots",cs,{title:tag,competitionId:comp.id});await call("/api/staff/snapshots/"+own.json.snapshot.id,cs,{},"DELETE");
   await prisma.application.update({where:{id:app3.id},data:{status:"SUBMITTED"}});
  });
  await step("Private documents validate content, size and owner; draft deletion and legacy bypass denied",async()=>{
   doc=await upload(cc);
   await upload(cc,"not a pdf","application/pdf",400);
   await upload(cc,new Uint8Array(5*1024*1024+1),"application/pdf",400);
   const {json}=await call("/api/documents/"+doc,cc);assert.equal((await fetch(json.url)).status,200);
   await call("/api/documents/"+doc,cc2,undefined,"GET",403);
   await call("/api/documents/"+doc,cs,undefined,"GET",403);
   await call("/api/documents/"+doc,cc2,{},"DELETE",403);
   const temp=await upload(cc);await call("/api/documents/"+temp,cc,{},"DELETE");await call("/api/documents/"+temp,cc,undefined,"GET",404);
   await call("/api/upload",cc,{path:"anything",bucket},"DELETE",403);
   const stored=await prisma.privateDocument.findUnique({where:{id:doc}});
   const anon=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);assert.ok((await anon.storage.from(bucket).download(stored.path)).error,"Anonymous storage download must be denied");
   const publicResponse=await fetch(process.env.SUPABASE_URL+"/storage/v1/object/public/"+bucket+"/"+stored.path);assert.notEqual(publicResponse.status,200);
  });
  await step("Roster rejects cross-sport, missing documents and unconfirmed submissions",async()=>{
   const input={competitionId:comp.id,version:0,action:"submit",items:[{applicationId:app1.id,squadType:"main"}]};
   await call("/api/club/rosters",cc,input,"POST",400);
   await call("/api/club/rosters",cc,{...input,documentId:doc},"POST",400);
   await call("/api/club/rosters",cc,{...input,advisorApproved:true,documentId:doc,items:[{applicationId:wrongApp.id,squadType:"main"}]},"POST",403);
   await call("/api/club/rosters",cc,{...input,advisorApproved:true,documentId:doc,items:[app1,app2,app3].map(a=>({applicationId:a.id,squadType:"main"}))},"POST",409);
   await call("/api/applications/"+app1.id,cc,{status:"CLUB_APPROVED",label:"skip signed roster"},"PATCH",409);
   await call("/api/applications/"+app1.id,cs,{status:"STAFF_APPROVED",label:"skip"},"PATCH",409);
  });
  await step("Roster draft persists main/reserve, checks version and submits once with approval histories",async()=>{
   const items=[{applicationId:app1.id,squadType:"main"},{applicationId:app2.id,squadType:"reserve"}];
   let result=await call("/api/club/rosters",cc,{competitionId:comp.id,version:0,action:"save",items,documentId:doc});roster=result.json.roster;
   const view=await call("/api/club/rosters?competitionId="+comp.id,cc);assert.deepEqual(view.json.roster.items.map(i=>({applicationId:i.applicationId,squadType:i.squadType})).sort((a,b)=>a.applicationId.localeCompare(b.applicationId)),items.sort((a,b)=>a.applicationId.localeCompare(b.applicationId)));
   await call("/api/club/rosters",cc,{competitionId:comp.id,version:0,action:"save",items,documentId:doc},"POST",409);
   const input={competitionId:comp.id,version:roster.version,action:"submit",items,documentId:doc,advisorApproved:true};
   const responses=await Promise.all([call("/api/club/rosters",cc,input,"POST",null),call("/api/club/rosters",cc,input,"POST",null)]);
   assert.deepEqual(responses.map(r=>r.response.status).sort(),[200,409]);roster=responses.find(r=>r.response.status===200).json.roster;
   const dbApp=await prisma.application.findUnique({where:{id:app1.id},include:{statusHistory:true}});assert.equal(dbApp.status,"CLUB_APPROVED");assert.ok(dbApp.statusHistory.some(h=>h.status==="CLUB_APPROVED"));
   assert.equal((await prisma.application.findUnique({where:{id:app3.id}})).status,"SUBMITTED");
  });
  await step("Submitted roster locks new and legacy APIs; retained documents cannot be deleted",async()=>{
   const items=[{applicationId:app1.id,squadType:"main"}];
   await call("/api/club/rosters",cc,{competitionId:comp.id,version:roster.version,action:"save",items,documentId:doc},"POST",409);
   for(const a of [app1,app3])await call("/api/applications/"+a.id,cc,{status:"CLUB_REJECTED",label:"bypass"},"PATCH",409);
   await call("/api/applications/"+app1.id,c1,{note:"bypass"},"PUT",400);
   await call("/api/applications/"+app1.id,ca,{},"DELETE",409);
   await call("/api/documents/"+doc,cc,{},"DELETE",403);
   await call("/api/documents/"+doc,cs);
   await call("/api/staff/rosters",cc,undefined,"GET",403);
  });
  await step("Staff return resets application states, preserves histories and permits resubmit",async()=>{
   await call("/api/applications/"+app1.id,cs,{status:"STAFF_APPROVED",label:"approved"},"PATCH");
   await call("/api/staff/rosters",cs,{id:roster.id,version:roster.version,reason:""},"POST",400);
   const result=await call("/api/staff/rosters",cs,{id:roster.id,version:roster.version,reason:"แก้เอกสาร"});roster=result.json.roster;
   assert.equal((await prisma.application.findUnique({where:{id:app1.id}})).status,"SUBMITTED");
   const history=await prisma.statusHistory.findMany({where:{applicationId:app1.id}});assert.ok(history.some(h=>h.status==="STAFF_APPROVED"));
   const result2=await call("/api/club/rosters",cc,{competitionId:comp.id,version:roster.version,action:"submit",items:[{applicationId:app1.id,squadType:"main"},{applicationId:app2.id,squadType:"reserve"}],documentId:doc,advisorApproved:true});roster=result2.json.roster;
   await call("/api/applications/"+app1.id,cs,{status:"STAFF_APPROVED",label:"approved again"},"PATCH");
   await call("/api/staff/applications/announce",cs,{applicationIds:[app1.id]});
   await call("/api/staff/rosters",cs,{id:roster.id,version:roster.version,reason:"must not return"},"POST",409);
  });
  await step("Concurrent rosters from different clubs cannot exceed shared sport quota",async()=>{
   const r1=await seedApplication(a1,race,sport),r2=await seedApplication(a2,race,sport),doc2=await upload(cc2);
   const inputs=[{cookie:cc,app:r1,documentId:doc},{cookie:cc2,app:r2,documentId:doc2}];
   const results=await Promise.all(inputs.map(i=>call("/api/club/rosters",i.cookie,{competitionId:race.id,version:0,action:"submit",items:[{applicationId:i.app.id,squadType:"main"}],documentId:i.documentId,advisorApproved:true},"POST",null)));
   assert.deepEqual(results.map(r=>r.response.status).sort(),[200,409]);
   assert.equal(await prisma.rosterItem.count({where:{roster:{competitionId:race.id,status:"SUBMITTED"}}}),1);
  });
  await step("Official signup normalizes email, prevents namespace collisions and ignores caller role",async()=>{
   const email=tag+"-official@example.test";emails.push(email);state();
   await call("/api/auth/register-official","",{email:"  "+email.toUpperCase()+" ",password,role:"ADMIN"},"POST",201);
   officialId=(await prisma.user.findUnique({where:{email}})).id;userIds.push(officialId);state();
   officialCookie=await login(email.toUpperCase());
   const me=await call("/api/auth/me",officialCookie);assert.equal(me.json.role,"team_official");assert.equal(me.json.user.studentId,null);
   for(const existingEmail of [email.toUpperCase(),club.email,a1.email])await call("/api/auth/register-official","",{email:existingEmail,password},"POST",409);
   await call("/api/admin/users/"+officialId,ca,{role:"ATHLETE"},"PATCH",409);
   await call("/api/staff/analytics",officialCookie,undefined,"GET",403);
  });
  const profile={firstName:"Fixture",lastName:"Official",nationalId:"1234567890123",nationality:"ไทย",birthDate:"1990-01-01",addressNo:"1",subDistrict:"Test",district:"Test",province:"Test",postalCode:"56000",phone:"0800000000",email:tag+"-official@example.test",workplace:"Test",workPosition:"Trainer",previousCount:"0",appliedPosition:"other",appliedPositionOther:"นักกายภาพ"};
  await step("Official drafts persist, require plan/id-card/other detail and ownership",async()=>{
   officialDoc=await upload(officialCookie);officialCard=await upload(officialCookie);
   const input={competitionId:comp.id,clubId:club.id,version:0,action:"submit",profile,documents:{},acceptedRules:true};
   await call("/api/team-official/applications",officialCookie,input,"POST",400);
   await call("/api/team-official/applications",officialCookie,{...input,documents:{plan:doc,idCard:doc}},"POST",403);
   await call("/api/team-official/applications",officialCookie,{...input,profile:{...profile,appliedPositionOther:""},documents:{plan:officialDoc,idCard:officialCard}},"POST",400);
   const result=await call("/api/team-official/applications",officialCookie,{...input,action:"save",documents:{plan:officialDoc,idCard:officialCard}});official=result.json.application;
   const loaded=await call("/api/team-official/applications",officialCookie);assert.equal(loaded.json.applications[0].profile.firstName,"Fixture");
   await call("/api/documents/"+officialDoc,cc,undefined,"GET",403);
  });
  async function sendOfficial(){
   const result=await call("/api/team-official/applications",officialCookie,{competitionId:comp.id,clubId:club.id,version:official.version,action:"submit",profile,documents:{plan:officialDoc,idCard:officialCard},acceptedRules:true});
   official=result.json.application;
  }
  await step("Official submit routes through club before staff; cross-club review/read denied",async()=>{
   await sendOfficial();
   await call("/api/team-official/applications",officialCookie,{competitionId:comp.id,clubId:club2.id,version:official.version,action:"save",profile,documents:{}},"POST",409);
   await call("/api/staff/officials",cs,{id:official.id,version:official.version,action:"approve"},"POST",409);
   await call("/api/club/officials",cc2,{id:official.id,version:official.version,action:"approve"},"POST",403);
   await call("/api/documents/"+officialDoc,cc);
   await call("/api/documents/"+officialDoc,co,undefined,"GET",403);
   await call("/api/documents/"+officialDoc,officialCookie,{},"DELETE",403);
   const result=await call("/api/club/officials",cc,{id:official.id,version:official.version,action:"reject",reason:"แก้ข้อมูล"});official=result.json.application;
  });
  await step("Club rejection and staff rejection both allow resubmit from SUBMITTED preserving audit",async()=>{
   await sendOfficial();assert.equal(official.status,"SUBMITTED");
   let result=await call("/api/club/officials",cc,{id:official.id,version:official.version,action:"approve"});official=result.json.application;
   result=await call("/api/staff/officials",cs,{id:official.id,version:official.version,action:"reject",reason:"เพิ่มเติมเอกสาร"});official=result.json.application;
   await sendOfficial();assert.equal(official.status,"SUBMITTED");
   await call("/api/staff/officials",cs,{id:official.id,version:official.version,action:"approve"},"POST",409);
   result=await call("/api/club/officials",cc,{id:official.id,version:official.version,action:"approve"});official=result.json.application;
   const input={id:official.id,version:official.version,action:"approve"};
   const results=await Promise.all([call("/api/staff/officials",cs,input,"POST",null),call("/api/staff/officials",cs2,input,"POST",null)]);
   assert.deepEqual(results.map(r=>r.response.status).sort(),[200,409]);
   const loaded=await call("/api/team-official/applications",officialCookie);const current=loaded.json.applications[0];assert.equal(current.status,"STAFF_APPROVED");assert.ok(current.events.some(e=>e.action==="CLUB_REJECTED"));assert.ok(current.events.some(e=>e.action==="STAFF_REJECTED"));
   assert.equal(await prisma.officialApplication.count({where:{userId:officialId,competitionId:comp.id}}),1);
  });
  await step("Disabled accounts, changed roles, expired sessions and direct APIs are rejected",async()=>{
   await call("/api/admin/users/"+officialId,ca,{isActive:false},"PATCH");
   await call("/api/team-official/applications",officialCookie,undefined,"GET",401);
   await call("/api/auth/login","",{username:profile.email,password},"POST",403);
   await call("/api/admin/users/"+officialId,ca,{isActive:true},"PATCH");
   await prisma.club.update({where:{id:club.id},data:{isActive:false}});
   await call("/api/club/rosters?competitionId="+comp.id,cc,undefined,"GET",401);
   await prisma.club.update({where:{id:club.id},data:{isActive:true}});
   const expired="token="+jwt.sign({id:staff.id,role:"STAFF"},process.env.JWT_SECRET,{expiresIn:-1});
   await call("/api/staff/analytics",expired,undefined,"GET",401);
   await prisma.user.update({where:{id:staff2.id},data:{role:"ATHLETE",studentId:"8"+String(Date.now()).slice(-7)}});
   await call("/api/staff/snapshots",cs2,undefined,"GET",401);
   await call("/api/team-official/applications",c1,undefined,"GET",403);
  });
  await step("All new pages render with role cookies, public signup is accessible and routes guard roles",async()=>{
   for(const [cookie,paths] of [[cc,["/club/review","/club/officials"]],[cs,["/staff/analytics","/staff/rosters","/staff/officials"]],[officialCookie,["/team-official/register","/team-official/status"]],["",["/team-official/signup"]]]){
    for(const path of paths){const r=await fetch(base.origin+path,{headers:{Cookie:cookie},redirect:"manual"});assert.equal(r.status,200,path);}
   }
   const r=await fetch(base.origin+"/team-official/status",{redirect:"manual"});assert.ok([307,308].includes(r.status));
  });
 }catch(e){failed=true;throw e;}finally{
  try {
   const createdUsers=await prisma.user.findMany({where:{email:{in:emails}},select:{id:true}});
   const owners=[...new Set([...userIds,...createdUsers.map(u=>u.id),...clubIds])];
   const documents=await prisma.privateDocument.findMany({where:{ownerId:{in:owners}}});
   if(documents.length){const {error}=await storage.storage.from(bucket).remove(documents.map(d=>d.path));if(error)throw new Error("Fixture storage cleanup failed");}
   await prisma.$transaction(async tx=>{
    await tx.clubRoster.deleteMany({where:{competitionId:{in:competitionIds}}});
    await tx.officialApplication.deleteMany({where:{competitionId:{in:competitionIds}}});
    await tx.analyticsSnapshot.deleteMany({where:{authorId:{in:owners}}});
    await tx.application.deleteMany({where:{competitionId:{in:competitionIds}}});
    await tx.competition.deleteMany({where:{id:{in:competitionIds}}});
    await tx.privateDocument.deleteMany({where:{ownerId:{in:owners}}});
    await tx.club.deleteMany({where:{id:{in:clubIds}}});
    await tx.user.deleteMany({where:{id:{in:owners}}});
   },{timeout:30000});
   log.push({name:"Exact fixture cleanup (database and private storage)",status:"PASS"});
   fs.unlinkSync(statePath);
  }catch(e){failed=true;log.push({name:"Fixture cleanup",status:"FAIL"});throw e;}
  finally{fs.writeFileSync("test-results/phase4-integration.json",JSON.stringify({date:new Date().toISOString(),status:failed?"FAIL":"PASS",checks:log},null,2));await prisma.$disconnect();}
 }
});

