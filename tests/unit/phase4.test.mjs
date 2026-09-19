import test from "node:test";
import assert from "node:assert/strict";
import { summarize } from "../../lib/analytics.ts";
import { canReviewOfficial,withinQuota,officialProfileValid,REQUIRED_PROFILE } from "../../lib/phase4-policy.ts";
test("analytics distinguishes applications and unique athletes across sports/statuses",()=>{
 const rows=["SUBMITTED","CLUB_APPROVED","STAFF_APPROVED","FINAL_SELECTED","CLUB_REJECTED","STAFF_REJECTED"].map((status,i)=>({id:String(i),userId:String(i%3),studentId:null,firstName:"",lastName:"",faculty:i%2?"Science":"",sport:i%2?"B":"A",status,squadType:i===2?"main":"reserve"}));
 const s=summarize(rows,[{sport:"A",maxStarters:2,maxSubstitutes:1},{sport:"B",maxStarters:1,maxSubstitutes:0}]);
 assert.equal(s.metrics.totalApplications,6);assert.equal(s.metrics.uniqueAthletes,3);assert.equal(s.metrics.approved,2);assert.equal(s.metrics.pending,2);assert.equal(s.metrics.rejected,2);assert.equal(s.metrics.fillRate,50);assert.equal(s.metrics.main,1);assert.equal(s.metrics.reserve,1);
 assert.equal(s.sports.reduce((n,r)=>n+r.applications,0),6);assert.deepEqual(s.unavailable,["gender","budget","compliance"]);
});
test("empty analytics and zero quotas never produce NaN",()=>{
 const s=summarize([],[]);assert.equal(s.metrics.fillRate,0);assert.equal(s.metrics.acceptanceRate,0);assert.deepEqual(s.sports,[]);assert.ok(!JSON.stringify(s).includes("null"));
});
test("quota accepts boundary and rejects overflow/negative",()=>{
 assert.ok(withinQuota(2,1,2,1));assert.ok(withinQuota(0,0,0,0));assert.equal(withinQuota(3,0,2,1),false);assert.equal(withinQuota(1,2,2,1),false);assert.equal(withinQuota(-1,0,2,1),false);
});
test("official approval cannot skip club, or repeat review",()=>{
 assert.ok(canReviewOfficial("CLUB","SUBMITTED"));assert.ok(canReviewOfficial("STAFF","CLUB_APPROVED"));assert.ok(canReviewOfficial("ADMIN","CLUB_APPROVED"));
 for(const [role,status] of [["STAFF","SUBMITTED"],["CLUB","CLUB_APPROVED"],["TEAM_OFFICIAL","SUBMITTED"],["ADMIN","STAFF_APPROVED"]])assert.equal(canReviewOfficial(role,status),false);
});
test("official profile requires actual required fields and other position detail",()=>{
 const p=Object.fromEntries(REQUIRED_PROFILE.map(k=>[k,"test"]));Object.assign(p,{nationalId:"1234567890123",email:"test@example.test",birthDate:"2000-01-01",appliedPosition:"manager"});
 assert.ok(officialProfileValid(p));assert.equal(officialProfileValid({...p,firstName:" "}),false);assert.equal(officialProfileValid({...p,nationalId:"1"}),false);assert.equal(officialProfileValid({...p,email:"bad"}),false);assert.equal(officialProfileValid({...p,birthDate:"2999-01-01"}),false);assert.equal(officialProfileValid({...p,appliedPosition:"other"}),false);assert.ok(officialProfileValid({...p,appliedPosition:"other",appliedPositionOther:"นักกายภาพ"}));
});


import { isDatabaseConflict } from "../../lib/db-errors.ts";
test("Prisma and PostgreSQL commit conflicts map to 409 without masking other errors",()=>{
 for(const e of [{code:"P2034"},{code:"P2002"},{name:"DriverAdapterError",cause:{originalCode:"40001",kind:"TransactionWriteConflict"}},{cause:{originalCode:"40P01"}},{meta:{driverAdapterError:{cause:{originalCode:"40001"}}}}])assert.ok(isDatabaseConflict(e));
 for(const e of [null,new Error("network"),{code:"P2025"},{cause:{originalCode:"08006"}}])assert.equal(isDatabaseConflict(e),false);
});
