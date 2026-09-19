import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

if (!process.env.TEST_BASE_URL || !process.env.TEST_DATABASE_URL || process.env.TEST_ALLOW_WRITE !== "yes") throw new Error("Explicit TEST_BASE_URL, TEST_DATABASE_URL and TEST_ALLOW_WRITE=yes required; test database only");
const base = new URL(process.env.TEST_BASE_URL);
if (!["localhost","127.0.0.1","[::1]"].includes(base.hostname)) throw new Error("Use a local test server");
const db = new PrismaClient({adapter:new PrismaPg({connectionString:process.env.TEST_DATABASE_URL})});
const tag = "p5-"+randomUUID(), password = " Test!"+randomUUID()+" ";
const users=[], clubs=[], competitions=[], log=[];
const manifest="test-results/phase5-fixtures.json";
function state(){fs.mkdirSync("test-results",{recursive:true});fs.writeFileSync(manifest,JSON.stringify({tag,users,clubs,competitions},null,2));}
async function call(path,cookie="",data,method=data===undefined?"GET":"POST",status=200,raw=false){
  const r=await fetch(base.origin+path,{method,headers:{Cookie:cookie,"Content-Type":"application/json"},body:data===undefined?undefined:raw?data:JSON.stringify(data),redirect:"manual"});
  const text=await r.text();let json;try{json=JSON.parse(text);}catch{json={};}
  assert.equal(r.status,status,method+" "+path+": "+(json.error||text.slice(0,100)));
  assert.ok(!text.includes('"password"'),"No password hash in responses");
  return {json,r};
}
async function login(username){const {r}=await call("/api/auth/login","",{username,password});return r.headers.getSetCookie().find(c=>c.startsWith("token=")).split(";")[0];}
async function user(role,i){const u=await db.user.create({data:{role,email:tag+i+"@example.test",studentId:role==="ATHLETE"?"7"+String(Date.now()+i).slice(-7):null,password:await bcrypt.hash(password,4)}});users.push(u.id);state();return u;}
async function club(sport,i){const c=await db.club.create({data:{name:tag+" club "+i,sport,email:tag+"club"+i+"@example.test",password:await bcrypt.hash(password,4),status:"ACTIVE"}});clubs.push(c.id);state();return c;}
async function competition(i,sports){const c=await db.competition.create({data:{name:tag+" competition "+i,round:"qualifier",year:2026,status:"OPEN",deadline:new Date(Date.now()+86400000),quotas:{create:sports.map(sport=>({sport,maxStarters:10,maxSubstitutes:10}))}}});competitions.push(c.id);state();return c;}
const profile={firstName:"Fixture",lastName:"Phase5",faculty:"Science",major:"Test",year:"1",nationalId:"1234567890123",birthDate:"2005-01-01",addressNo:"1",subDistrict:"Test",district:"Test",province:"Test",postalCode:"56000",phone:"0800000000",studentLevel:"bachelor",gpaCumulative:"3.50"};

test("Phase 5 validation, ownership and UI data contracts",{timeout:900000},async t=>{
  let failed=false;
  async function step(name,fn){let pass=false;await t.test(name,async()=>{await fn();pass=true;});log.push({name,status:pass?"PASS":"FAIL"});if(!pass)throw new Error("Stopped at "+name);}
  try{
    const admin=await user("ADMIN",1),staff=await user("STAFF",2),athlete=await user("ATHLETE",3),other=await user("ATHLETE",4);
    const sport=tag+" sport",sport2=tag+" other";
    const c=await club(sport,1),c2=await club(sport2,2),same=await club(sport,3);
    const ca=await login(admin.email),cs=await login(staff.email),cu=await login(athlete.studentId),co=await login(other.studentId),cc=await login(c.email);
    await step("Login rejects malformed JSON, null, arrays, missing and wrong types with 400",async()=>{
      for(const input of ["{","null","[]",'"x"',"0","{}",'{"username":4,"password":"x"}','{"username":"a","password":{}}','{"username":"a"}'])await call("/api/auth/login","",input,"POST",400,true);
    });
    await step("Login preserves password spaces, wrong credentials 401 and disabled account 403",async()=>{
      await call("/api/auth/login","",{username:athlete.studentId,password:password.trim()},"POST",401);
      await call("/api/auth/login","",{username:" "+admin.email.toUpperCase()+" ",password});
      await db.user.update({where:{id:other.id},data:{isActive:false}});
      await call("/api/auth/login","",{username:other.studentId,password},"POST",403);
      await call("/api/athletes/profile",co,{studentId:other.studentId,...profile},"PUT",401);
      await db.user.update({where:{id:other.id},data:{isActive:true}});
    });
    await step("Profile create is complete, partial update preserves existing fields, nullable fields clear",async()=>{
      await call("/api/athletes/profile",cu,{studentId:athlete.studentId,firstName:"Incomplete"},"PUT",400);
      assert.equal(await db.athleteProfile.count({where:{userId:athlete.id}}),0);
      const {json}=await call("/api/athletes/profile",cu,{studentId:athlete.studentId,...profile},"PUT");
      assert.equal(json.profile.studentLevel,"BACHELOR");
      const update=await call("/api/athletes/profile",cu,{studentId:athlete.studentId,phone:"0812345678",gpaSemester:null,studentLevel:"graduate"},"PUT");
      assert.equal(update.json.profile.firstName,profile.firstName);assert.equal(update.json.profile.gpaCumulative,"3.50");assert.equal(update.json.profile.studentLevel,"GRADUATE");assert.equal(update.json.profile.phone,"0812345678");
      const read=await call("/api/athletes/profile?studentId="+athlete.studentId,cu);assert.equal(read.json.profile.phone,"0812345678");
    });
    await step("Profile rejects cross-account access, forbidden fields, dates, enums and wrong types",async()=>{
      await call("/api/athletes/profile",cu,{studentId:other.studentId,...profile},"PUT",403);
      await call("/api/athletes/profile?studentId="+athlete.studentId,co,undefined,"GET",403);
      for(const bad of [{id:"x"},{userId:other.id},{createdAt:"2020-01-01"},{updatedAt:"x"},{user:{connect:{id:other.id}}},{studentLevel:"invalid"},{birthDate:"2005-02-30"},{phone:9},{hasParticipated:"true"}])await call("/api/athletes/profile",cu,{studentId:athlete.studentId,...bad},"PUT",400);
      await call("/api/athletes/profile","",{studentId:athlete.studentId,phone:"x"},"PUT",401);
      await call("/api/athletes/profile",cc,{studentId:athlete.studentId,phone:"x"},"PUT",403);
      assert.equal(await db.athleteProfile.count({where:{userId:other.id}}),0);
    });
    await step("Club creation normalizes email and rejects collisions with both account tables",async()=>{
      for(const email of [admin.email,c.email])await call("/api/clubs",ca,{name:tag,sport,email:" "+email.toUpperCase()+" ",password},"POST",409);
      await call("/api/clubs",ca,{name:tag,sport,email:"invalid",password},"POST",400);
      const email=tag+"created@example.test";
      const {json}=await call("/api/clubs",ca,{name:tag,sport,email:" "+email.toUpperCase()+" ",password,presidentName:"Fixture president",presidentPhone:"0800000000"});
      clubs.push(json.club.id);state();assert.equal(json.club.email,email);
    });
    await step("Club edit allows own normalized email and rejects user/club collisions",async()=>{
      await call("/api/clubs/"+c.id,ca,{email:" "+c.email.toUpperCase()+" "},"PUT");
      for(const email of [admin.email,c2.email])await call("/api/clubs/"+c.id,ca,{email:" "+email.toUpperCase()+" "},"PUT",409);
      await call("/api/clubs/"+c.id,ca,{email:[]},"PUT",400);
    });
    await step("President change validates duplicate emails, allows own email and returns only safe fields",async()=>{
      const path="/api/admin/clubs/"+c.id+"/president";
      for(const email of [admin.email,c2.email])await call(path,ca,{presidentName:"Replacement",email:" "+email.toUpperCase()+" "},"PUT",409);
      await call(path,ca,{presidentName:"Replacement",email:7},"PUT",400);
      const {json}=await call(path,ca,{presidentName:"Replacement",email:" "+c.email.toUpperCase()+" "},"PUT");
      assert.equal(json.club.email,c.email);assert.equal(json.club.presidentName,"Replacement");assert.ok(!("password" in json.club));
      await call(path,cc,{presidentName:"Self",email:c.email},"PUT",403);
      const listing=await call("/api/clubs",ca);assert.equal(listing.json.clubs.find(row=>row.id===c.id).presidentName,"Replacement");
      const publicListing=await call("/api/clubs");assert.ok(!("presidentName" in publicListing.json.clubs.find(row=>row.id===c.id)));
    });
    await step("Club and competition filters intersect; roster club is real and nullable",async()=>{
      const comp=await competition(1,[sport,sport2]),comp2=await competition(2,[sport]);
      const apps=[];
      for(const [u,competitionId,sp] of [[athlete,comp.id,sport],[other,comp.id,sport2],[athlete,comp2.id,sport],[other,comp.id,sport]]) apps.push(await db.application.create({data:{userId:u.id,competitionId,sport:sp,category:"general"}}));
      await db.clubRoster.create({data:{clubId:c.id,competitionId:comp.id,items:{create:{applicationId:apps[0].id,squadType:"main"}}}});
      await db.clubRoster.create({data:{clubId:same.id,competitionId:comp.id,items:{create:{applicationId:apps[3].id,squadType:"main"}}}});
      const query=new URLSearchParams({competitionId:comp.id,clubId:c.id});
      const result=await call("/api/staff/applications?"+query,cs);assert.deepEqual(result.json.applications.map(a=>a.id),[apps[0].id]);
      query.set("sport",sport2);assert.equal((await call("/api/staff/applications?"+query,cs)).json.applications.length,0);
      await call("/api/staff/applications?clubId=missing-"+tag+"&competitionId="+comp.id,cs,undefined,"GET",404);
      const list=await call("/api/applications",cu);assert.equal(list.json.applications.find(a=>a.id===apps[0].id).rosterClub.name,c.name);assert.equal(list.json.applications.find(a=>a.id===apps[2].id).rosterClub,null);
      const detail=await call("/api/applications/"+apps[0].id,cu);assert.equal(detail.json.application.rosterClub.id,c.id);assert.ok(!("club" in detail.json.application.competition));
      const clubComps=await call("/api/clubs/"+c.id+"/competitions",cs);assert.equal(clubComps.json.club.name,c.name);assert.ok(clubComps.json.competitions.some(row=>row.id===comp.id));
      await call("/api/clubs/missing-"+tag+"/competitions",cs,undefined,"GET",404);
    });
  }catch(e){failed=true;throw e;}finally{
    try{
      await db.$transaction(async tx=>{
        await tx.clubRoster.deleteMany({where:{competitionId:{in:competitions}}});
        await tx.application.deleteMany({where:{competitionId:{in:competitions}}});
        await tx.competition.deleteMany({where:{id:{in:competitions}}});
        await tx.club.deleteMany({where:{id:{in:clubs}}});
        await tx.user.deleteMany({where:{id:{in:users}}});
      },{timeout:30000});
      log.push({name:"Exact fixture cleanup",status:"PASS"});fs.unlinkSync(manifest);
    }catch(e){failed=true;throw e;}finally{fs.writeFileSync("test-results/phase5-integration.json",JSON.stringify({date:new Date().toISOString(),status:failed?"FAIL":"PASS",checks:log},null,2));await db.$disconnect();}
  }
});
