import test from "node:test";
import assert from "node:assert/strict";
import { ValidationError, parseJsonObject, loginInput, normalizeEmail, validateProfile, REQUIRED_PROFILE_FIELDS } from "../../lib/validation.ts";
import { HttpError, readResponse, requestMessage } from "../../lib/http-client.ts";

test("JSON rejects malformed, null, arrays and primitive payloads", async () => {
  for (const value of ["{", "null", "[]", "42", '"text"']) await assert.rejects(parseJsonObject(new Request("http://localhost", { method: "POST", body: value })), ValidationError);
  assert.deepEqual(await parseJsonObject(new Request("http://localhost", { method: "POST", body: "{}" })), {});
});
test("Login validates types and normalizes identifier without trimming password", () => {
  for (const data of [{}, {username: 123,password: "x"}, {username:"a",password:[]}, {username:" ",password:"x"}, {username:"a",password:""}]) assert.throws(() => loginInput(data), ValidationError);
  assert.deepEqual(loginInput({username:" A@B.TEST ",password:" secret "}), {username:"a@b.test",password:" secret "});
});
test("Email normalization rejects non-email values", () => {
  assert.equal(normalizeEmail(" CLUB@EXAMPLE.TEST "), "club@example.test");
  for (const value of [null, [], 4, "club", "a b@c.test"]) assert.throws(() => normalizeEmail(value), ValidationError);
});
test("Profile create requires complete fields; partial update preserves unspecified values", () => {
  assert.throws(() => validateProfile({firstName:"New"}, true), ValidationError);
  const fields = Object.fromEntries(REQUIRED_PROFILE_FIELDS.map(k => [k, k === "birthDate" ? "2005-01-01" : "Fixture"]));
  const original = validateProfile(fields, true);
  const partial = validateProfile({phone:" 0800000000 ", gpaSemester:null}, false);
  assert.deepEqual(Object.keys(partial).sort(), ["gpaSemester","phone"]);
  assert.equal({...original,...partial}.firstName, "Fixture");
  assert.equal(partial.phone,"0800000000");
  assert.equal(partial.gpaSemester,null);
});
test("Profile rejects forbidden fields, invalid dates, enums and types", () => {
  for (const input of [{id:"x"},{userId:"x"},{createdAt:"x"},{user:{}},{birthDate:"2005-02-30"},{birthDate:"invalid"},{birthDate:"2999-01-01"},{studentLevel:"unknown"},{phone:1},{hasParticipated:"false"},{participateCountBachelor:-1},{}]) assert.throws(() => validateProfile(input,false), ValidationError);
  for (const level of ["bachelor","BACHELOR","graduate","GRADUATE"]) assert.equal(validateProfile({studentLevel:level},false).studentLevel,level.toUpperCase());
});
test("HTTP mapping distinguishes auth, permission, conflict, server and invalid responses", async () => {
  for (const status of [400,401,403,404,409,500]) {
    await assert.rejects(readResponse(new Response(JSON.stringify({error:"fixture",fieldErrors:{phone:"เบอร์โทรไม่ถูกต้อง"}}),{status})), e => {
      assert.ok(e instanceof HttpError); assert.equal(e.status,status);
      if(status===409) assert.match(e.message,/โหลดข้อมูลล่าสุด/);
      if(status===500) assert.ok(!e.message.includes("fixture"));
      assert.match(requestMessage(e),/เบอร์โทร/); return true;
    });
  }
  await assert.rejects(readResponse(new Response("<html>oops</html>")),e=>e.status===502);
  assert.deepEqual(await readResponse(new Response('{"items":[]}')), {items:[]});
});
