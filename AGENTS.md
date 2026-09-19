# Repository Guidelines

## ภาพรวมและผู้ใช้งาน

เว็บไซต์ลงทะเบียนและคัดเลือกนักกีฬาของมหาวิทยาลัยพะเยา ให้นักศึกษากรอกประวัติ แนบเอกสาร และติดตามผล ชมรมจัดการรายชื่อและพิจารณาใบสมัคร เจ้าหน้าที่ตรวจคุณสมบัติและคัดเลือก มีหน้าสำหรับผู้ดูแลระบบและเจ้าหน้าที่ทีมด้วย

## Tech Stack และโครงสร้างโปรเจกต์

ใช้ Next.js 16.2.6 App Router, React 19.2.4, TypeScript 5, Tailwind CSS 4, Prisma 7 ร่วมกับ PostgreSQL ผ่าน `@prisma/adapter-pg`, Supabase Storage, JWT (`jsonwebtoken`) และ `bcryptjs`

- `app/` เก็บหน้าตามบทบาทใน `athlete/`, `club/`, `staff/`, `admin/`, `team-official/` ส่วน `app/api/**/route.ts` เป็น HTTP endpoints; `dev/` และ `superadmin/` เป็นหน้าช่วยทดสอบ
- `components/shared/` เก็บคอมโพเนนต์ UI ที่ใช้ร่วมกัน ส่วน `lib/` เก็บระบบยืนยันตัวตน ตัวเชื่อมต่อฐานข้อมูลและ Supabase ฟังก์ชันช่วยงาน และเครื่องมือส่งออกข้อมูล
- `prisma/schema.prisma` กำหนดโมเดลและ enum ส่วน `prisma.config.ts` ตั้งค่าการเชื่อมต่อฐานข้อมูลสำหรับ CLI
- `public/` เก็บไฟล์สื่อแบบคงที่ และ `app/globals.css` กำหนดสไตล์ส่วนกลาง สคริปต์ระดับรากประกอบด้วย `seed.ts` และ `setup-storage.ts`

## คำสั่งสำหรับพัฒนา ตรวจสอบ และบิลด์

- `npm ci`: ติดตั้งแพ็กเกจตาม `package-lock.json`
- `npm run dev`: เปิดเซิร์ฟเวอร์พัฒนาที่ `http://localhost:3000`
- `npm run build`: สร้างบิลด์สำหรับใช้งานจริง จากนั้นใช้ `npm start` เพื่อเปิดเซิร์ฟเวอร์
- `npm run lint`: ตรวจโค้ดด้วย ESLint ตามกฎ Next.js Core Web Vitals และ TypeScript
- `npx tsc --noEmit`: ตรวจสอบชนิดข้อมูล TypeScript
- `npm run db:generate`: สร้าง Prisma Client ใหม่หลังแก้ไข schema
- `npm run db:push`: ปรับฐานข้อมูลให้ตรงกับ schema โดยตรวจสอบฐานข้อมูลปลายทางก่อนรัน
- ยังไม่มีคำสั่ง `npm run test` ใน `package.json`; ใช้การตรวจและทดสอบตามหัวข้อด้านล่าง

## รูปแบบโค้ดและการตั้งชื่อ

ใช้ TypeScript แบบ strict เยื้องด้วยช่องว่าง 2 ตัว ใช้เครื่องหมายคำพูดคู่และอัฒภาคให้สอดคล้องกับโค้ดรอบข้าง ตั้งชื่อคอมโพเนนต์แบบ PascalCase ฟังก์ชันช่วยงานแบบ camelCase และไฟล์ยูทิลิตีแบบ kebab-case ใช้ชื่อไฟล์ตาม App Router (`page.tsx`, `layout.tsx`, `route.ts`) และพาธแบบไดนามิก เช่น `[id]` ใช้ `@/` เมื่อนำเข้าโมดูลจากรากโปรเจกต์ และใช้ Tailwind สำหรับจัดสไตล์ ปัจจุบันยังไม่มีการตั้งค่า Prettier

## แนวทางการทดสอบ

ยังไม่มีสคริปต์ `test` ใน `package.json` เฟรมเวิร์กทดสอบ หรือเกณฑ์ coverage จึงยังใช้ `npm test` ไม่ได้ โดย `lib/fitness-test.ts` เป็นตรรกะของระบบ ก่อนส่งงานให้รัน lint ตรวจชนิดข้อมูล และบิลด์ ทดสอบขั้นตอนลงทะเบียน การพิจารณาใบสมัคร และสิทธิ์ตามบทบาทที่ได้รับผลกระทบด้วยตนเอง บันทึกขั้นตอนและผลตรวจสอบใน PR

## ส่วนช่วยทดสอบและขอบเขต Production

- `app/dev/`, `app/superadmin/` และ `app/api/auth/dev-login/` รวมถึงคอมโพเนนต์และทางลัดที่ใช้เฉพาะส่วนนี้ เป็นเครื่องมือทดสอบชั่วคราว เจ้าของโปรเจกต์ตั้งใจนำออกเมื่อเตรียม production build
- การสลับบทบาทหรือออก token ผ่าน dev-login เป็นพฤติกรรมที่ตั้งใจใช้ทดสอบใน development อย่านับเป็นข้อผิดพลาดของ flow production โดยไม่ตรวจว่าส่วนนี้ยังอยู่ในบิลด์จริงหรือไม่ และอย่าลบเครื่องมือเหล่านี้ระหว่างงานพัฒนาทั่วไป
- ปัจจุบัน `build` เรียกเพียง `next build` ไม่มี `prebuild`/`postbuild` หรือ config ที่นำส่วนทดสอบออกอัตโนมัติ จึงต้องดำเนินการนำออกและตรวจยืนยันก่อนเผยแพร่ การตั้งชื่อโฟลเดอร์ว่า `dev` หรือ `superadmin` ไม่ทำให้ถูกตัดออกเอง
- เมื่อเตรียม production ให้ตรวจ route, ลิงก์, import และเงื่อนไข bypass ที่เกี่ยวข้อง แล้วทดสอบว่า `/dev`, `/superadmin` และ `/api/auth/dev-login` เข้าใช้งานไม่ได้และออก token ไม่ได้ อย่าเหมารวมว่า API งานจริง เช่น `/api/staff/settings` เป็นส่วนทดสอบ

## แนวทาง Commit และ Pull Request

ประวัติ Git ใช้คำนำหน้า `feat:` และ `fix:` ให้เขียนข้อความ commit สั้นและระบุสิ่งที่เปลี่ยนชัดเจน PR ควรอธิบายพฤติกรรมที่เปลี่ยน เชื่อมโยง issue ที่เกี่ยวข้อง ระบุผลตรวจสอบ และแนบภาพหน้าจอเมื่อแก้ไข UI หากแก้ schema หรือตัวแปรสภาพแวดล้อม ให้อธิบายรายละเอียดอย่างชัดเจน

## การตั้งค่าและข้อควรระวัง

- ห้าม commit `.env` หรือข้อมูลลับ เก็บ `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` และ `SUPABASE_SERVICE_ROLE_KEY` ไว้ฝั่งเซิร์ฟเวอร์ ห้ามนำ `lib/supabase-admin.ts` เข้า client component
- Runtime ใช้ `DATABASE_URL` ส่วน Prisma CLI ใช้ `DIRECT_URL` ฝั่ง Supabase server ใช้ `SUPABASE_URL` และ service-role key; browser ใช้ `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY` ห้ามใส่ secret ในตัวแปร `NEXT_PUBLIC_*`
- แก้ `prisma/schema.prisma`, `prisma.config.ts`, `middleware.ts`, `next.config.ts`, `tsconfig.json` และ `eslint.config.mjs` เฉพาะเมื่อจำเป็นต่องาน พร้อมอธิบายผลกระทบ ห้ามปิด strict/lint เพื่อหลบข้อผิดพลาด หรือเปลี่ยนฐานข้อมูลปลายทางโดยไม่ตรวจสอบ
- ตรวจ session และสิทธิ์ใน API งานจริงด้วย อย่าเชื่อเฉพาะ cookie `role` ที่ middleware อ่าน สำหรับ dev-login ให้ปฏิบัติตามหัวข้อส่วนช่วยทดสอบและขอบเขต Production
- บางส่วนยังเป็น mock/stub เช่น `lib/athlete-profile.ts` ใช้ localStorage และ `lib/snapshot-store.ts` ยังไม่บันทึกข้อมูลถาวร ตรวจ implementation ก่อนอ้างว่าฟีเจอร์เชื่อมฐานข้อมูลแล้ว

## CI และ Deployment

ยังไม่พบ workflow CI, Dockerfile หรือไฟล์ตั้งค่า deployment ใน repository ส่วน README เป็นคำแนะนำ Vercel จาก starter จึงยังยืนยันโฮสต์จริงไม่ได้ สำหรับรัน production ด้วย Node.js ให้ตั้ง environment variables จากนั้นรัน `npm ci`, `npm run db:generate`, `npm run build` และ `npm start` การปรับ schema เป็นขั้นตอนแยก ไม่ควรรัน `db:push` กับ production โดยไม่ตรวจผลกระทบ

## คำแนะนำสำหรับเอเจนต์

ก่อนแก้โค้ด Next.js ให้อ่านคู่มือที่เกี่ยวข้องใน `node_modules/next/dist/docs/` และตรวจคำเตือนเกี่ยวกับ API ที่เลิกแนะนำให้ใช้ เพราะเวอร์ชันนี้อาจมีแนวทางต่างจากที่คุ้นเคย
