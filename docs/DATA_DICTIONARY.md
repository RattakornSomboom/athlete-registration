# Data Dictionary — 8 ตารางหลัก

แหล่งอ้างอิง: `prisma/schema.prisma` (PostgreSQL ผ่าน Prisma 7) ใช้คู่กับ ER-Diagram 8 ตารางหลัก

## หลักการอ่านตาราง
- ชื่อตาราง/คอลัมน์ใช้ตามจริงในฐานข้อมูล (Prisma ไม่ได้ใช้ `@@map` ชื่อตารางจึงเป็น PascalCase และคอลัมน์เป็น camelCase)
- ชนิดข้อมูลเป็นชนิดใน PostgreSQL ที่ Prisma สร้าง: `String` = TEXT, `Int` = INTEGER, `Boolean` = BOOLEAN, `DateTime` = TIMESTAMP(3), `Json` = JSONB, enum = ชนิด enum ชื่อเดียวกัน
- `id` ทุกตารางเป็น cuid (ข้อความ 25 ตัวอักษร) สร้างอัตโนมัติ ไม่ใช่ UUID
- Key: PK = Primary Key, FK = Foreign Key, UQ = Unique
- Null: N = ห้ามว่าง, Y = ว่างได้

## ค่า Enum ที่ใช้
| Enum | ค่า |
|---|---|
| Role | ATHLETE, CLUB, STAFF, ADMIN, TEAM_OFFICIAL |
| StudentLevel | BACHELOR, GRADUATE |
| ClubStatus | ACTIVE, PENDING, INACTIVE |
| CompetitionStatus | OPEN, CLOSED, COMPLETED |
| ApplicationStatus | SUBMITTED, CLUB_APPROVED, CLUB_REJECTED, STAFF_APPROVED, STAFF_REJECTED, FINAL_SELECTED |
| RosterStatus | DRAFT, SUBMITTED, RETURNED |

## ความสัมพันธ์
| ความสัมพันธ์ | FK | Cardinality | เมื่อลบแม่ |
|---|---|---|---|
| Club → User | User.clubId | 1 : 0..M (ว่างได้) | ห้ามลบถ้ายังมีผู้ใช้ (Restrict) |
| User → AthleteProfile | AthleteProfile.userId (UQ) | 1 : 0..1 | ลบตาม (Cascade) |
| User → Application | Application.userId | 1 : 0..M | ลบตาม (Cascade) |
| Competition → Application | Application.competitionId | 1 : 0..M | ลบตาม (Cascade) |
| Club → Application | Application.clubId | 1 : 0..M (ว่างได้) | ไม่ระบุ (ค่าเริ่มต้น) |
| Competition → SportQuota | SportQuota.competitionId | 1 : 0..M | ลบตาม (Cascade) |
| Club → ClubRoster | ClubRoster.clubId | 1 : 0..M | ไม่ระบุ |
| Competition → ClubRoster | ClubRoster.competitionId | 1 : 0..M | ไม่ระบุ |
| ClubRoster → RosterItem | RosterItem.rosterId | 1 : 0..M | ลบตาม (Cascade) |
| Application → RosterItem | RosterItem.applicationId (UQ) | 1 : 0..1 | ไม่ระบุ |
| SportQuota ↔ Application | ไม่มี FK จับคู่ด้วย competitionId + sport | เชิงตรรกะ | – |

---

## 1. User (ผู้ใช้)
เก็บบัญชีผู้ใช้ทุกบทบาท ใช้เข้าสู่ระบบและกำหนดสิทธิ์

| คอลัมน์ | ชนิดข้อมูล | Key | Null | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|---|---|---|
| id | TEXT | PK | N | cuid() | รหัสผู้ใช้ |
| studentId | TEXT | UQ | Y | – | รหัสนิสิต (เฉพาะนักกีฬา) |
| email | TEXT | UQ | N | – | อีเมลสำหรับเข้าสู่ระบบ |
| password | TEXT | | N | – | รหัสผ่านที่เข้ารหัสด้วย bcrypt |
| mustChangePassword | BOOLEAN | | N | false | ต้องเปลี่ยนรหัสผ่านเมื่อเข้าระบบครั้งถัดไป (หลัง ADMIN ออกรหัสชั่วคราว) |
| role | Role | | N | ATHLETE | บทบาทผู้ใช้ |
| clubId | TEXT | FK → Club.id | Y | – | ชมรมที่สังกัด (บัญชีบทบาท CLUB) |
| isActive | BOOLEAN | | N | true | สถานะเปิดใช้งานบัญชี (false = ระงับ) |
| createdAt | TIMESTAMP(3) | | N | now() | วันเวลาที่สร้าง |
| updatedAt | TIMESTAMP(3) | | N | อัปเดตอัตโนมัติ | วันเวลาที่แก้ไขล่าสุด |

## 2. AthleteProfile (โปรไฟล์นักกีฬา)
ข้อมูลส่วนตัวและประวัติการแข่งขันของนักกีฬา ผูกกับผู้ใช้แบบ 1 ต่อ 1

| คอลัมน์ | ชนิดข้อมูล | Key | Null | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|---|---|---|
| id | TEXT | PK | N | cuid() | รหัสโปรไฟล์ |
| userId | TEXT | FK → User.id, UQ | N | – | ผู้ใช้เจ้าของโปรไฟล์ |
| firstName | TEXT | | N | – | ชื่อ |
| lastName | TEXT | | N | – | นามสกุล |
| faculty | TEXT | | N | – | คณะ |
| major | TEXT | | N | – | สาขาวิชา |
| studentLevel | StudentLevel | | N | BACHELOR | ระดับการศึกษา |
| year | TEXT | | N | – | ชั้นปี |
| semester | TEXT | | Y | – | ภาคการศึกษา |
| nationalId | TEXT | | N | – | เลขประจำตัวประชาชน |
| nationality | TEXT | | N | 'ไทย' | สัญชาติ |
| birthDate | TIMESTAMP(3) | | N | – | วันเกิด (ใช้ตรวจอายุไม่เกิน 28 ปี) |
| gpaSemester | TEXT | | Y | – | เกรดเฉลี่ยภาคการศึกษาล่าสุด |
| gpaCumulative | TEXT | | Y | – | เกรดเฉลี่ยสะสม (ใช้ตรวจ GPAX ≥ 2.00) |
| addressNo | TEXT | | N | – | บ้านเลขที่ |
| subDistrict | TEXT | | N | – | ตำบล/แขวง |
| district | TEXT | | N | – | อำเภอ/เขต |
| province | TEXT | | N | – | จังหวัด |
| postalCode | TEXT | | N | – | รหัสไปรษณีย์ |
| phone | TEXT | | N | – | เบอร์โทรศัพท์ |
| photoUrl | TEXT | | Y | – | รูปโปรไฟล์ |
| hasParticipated | BOOLEAN | | N | false | เคยเข้าร่วมการแข่งขันหรือไม่ |
| firstSport | TEXT | | Y | – | ชนิดกีฬาที่เข้าร่วมครั้งแรก |
| participateCountBachelor | INTEGER | | Y | – | จำนวนครั้งที่เข้าร่วมระดับปริญญาตรี |
| participateCountMaster | INTEGER | | Y | – | จำนวนครั้งที่เข้าร่วมระดับปริญญาโท |
| participateCountPhd | INTEGER | | Y | – | จำนวนครั้งที่เข้าร่วมระดับปริญญาเอก |
| lastParticipateYear | TEXT | | Y | – | ปีที่เข้าร่วมครั้งล่าสุด |
| isNationalTeam | BOOLEAN | | N | false | เป็นนักกีฬาทีมชาติหรือไม่ |
| pastCompetitions | JSONB | | Y | – | รายการผลงานการแข่งขันย้อนหลัง |
| createdAt | TIMESTAMP(3) | | N | now() | วันเวลาที่สร้าง |
| updatedAt | TIMESTAMP(3) | | N | อัปเดตอัตโนมัติ | วันเวลาที่แก้ไขล่าสุด |

## 3. Club (ชมรม)
ข้อมูลชมรมกีฬา มีอีเมลและรหัสผ่านของตัวเอง (บัญชีชมรมรุ่นเดิม)

| คอลัมน์ | ชนิดข้อมูล | Key | Null | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|---|---|---|
| id | TEXT | PK | N | cuid() | รหัสชมรม |
| name | TEXT | UQ | N | – | ชื่อชมรม |
| sport | TEXT | | N | – | ชนิดกีฬาของชมรม |
| email | TEXT | UQ | N | – | อีเมลชมรม |
| password | TEXT | | N | – | รหัสผ่านที่เข้ารหัสแล้ว |
| mustChangePassword | BOOLEAN | | N | false | ต้องเปลี่ยนรหัสผ่านครั้งถัดไป |
| isActive | BOOLEAN | | N | true | สถานะเปิดใช้งานบัญชี |
| presidentName | TEXT | | Y | – | ชื่อประธานชมรม |
| presidentPhone | TEXT | | Y | – | เบอร์โทรประธานชมรม |
| advisors | JSONB | | Y | – | รายชื่ออาจารย์ที่ปรึกษา (ชื่อ, เบอร์โทร) มีได้หลายคน |
| status | ClubStatus | | N | INACTIVE | สถานะการอนุมัติชมรม |
| createdAt | TIMESTAMP(3) | | N | now() | วันเวลาที่สร้าง |

## 4. Competition (การแข่งขัน)
รายการแข่งขันที่เปิดรับสมัคร

| คอลัมน์ | ชนิดข้อมูล | Key | Null | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|---|---|---|
| id | TEXT | PK | N | cuid() | รหัสการแข่งขัน |
| name | TEXT | | N | – | ชื่อการแข่งขัน |
| sport | TEXT | | Y | – | เลิกใช้แล้ว ใช้ SportQuota แทน |
| round | TEXT | | N | – | รอบการแข่งขัน |
| year | INTEGER | | N | – | ปีการแข่งขัน (ใช้คำนวณอายุนักกีฬา) |
| deadline | TIMESTAMP(3) | | Y | – | วันปิดรับสมัคร |
| status | CompetitionStatus | | N | OPEN | สถานะการแข่งขัน |
| createdAt | TIMESTAMP(3) | | N | now() | วันเวลาที่สร้าง |

## 5. SportQuota (โควตาชนิดกีฬา)
โควตาจำนวนนักกีฬาต่อชนิดกีฬาในแต่ละการแข่งขัน Unique ร่วม (competitionId, sport)

| คอลัมน์ | ชนิดข้อมูล | Key | Null | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|---|---|---|
| id | TEXT | PK | N | cuid() | รหัสโควตา |
| competitionId | TEXT | FK → Competition.id | N | – | การแข่งขัน |
| sport | TEXT | | N | – | ชนิดกีฬา |
| maxStarters | INTEGER | | N | – | จำนวนตัวจริงสูงสุด |
| maxSubstitutes | INTEGER | | N | – | จำนวนตัวสำรองสูงสุด |
| maxEntriesPerAthlete | INTEGER | | Y | – | จำนวนรายการสูงสุดต่อนักกีฬา 1 คน |
| maxEntriesPerEvent | INTEGER | | Y | – | จำนวนนักกีฬาสูงสุดต่อรายการ |
| ageLimit | INTEGER | | Y | – | อายุสูงสุดที่รับ |

## 6. Application (ใบสมัครนักกีฬา)
ใบสมัครของนักกีฬาต่อการแข่งขันและชนิดกีฬา Unique ร่วม (userId, competitionId, sport)

| คอลัมน์ | ชนิดข้อมูล | Key | Null | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|---|---|---|
| id | TEXT | PK | N | cuid() | รหัสใบสมัคร |
| userId | TEXT | FK → User.id | N | – | นักกีฬาผู้สมัคร |
| competitionId | TEXT | FK → Competition.id | N | – | การแข่งขันที่สมัคร |
| sport | TEXT | | N | – | ชนิดกีฬา |
| category | TEXT | | N | – | ประเภท เช่น "ลู่ (ชาย)" |
| division | TEXT | | Y | – | รุ่นหรือรหัสรายการ |
| squadType | TEXT | | Y | – | ประเภทที่สมัคร (main = ตัวจริง, reserve = ตัวสำรอง, selected = กีฬาเดี่ยว) |
| status | ApplicationStatus | | N | SUBMITTED | สถานะใบสมัคร |
| note | TEXT | | Y | – | หมายเหตุ |
| photoFileUrl | TEXT | | N | – | อ้างอิงไฟล์รูปถ่าย |
| idCardFileUrl | TEXT | | N | – | อ้างอิงไฟล์บัตรประชาชน |
| studentCardFileUrl | TEXT | | N | – | อ้างอิงไฟล์บัตรนิสิต |
| studentCertFileUrl | TEXT | | N | – | อ้างอิงไฟล์หนังสือรับรองสภาพนิสิต |
| upAcademyFileUrl | TEXT | | N | – | อ้างอิงไฟล์ UP Academy (ซ่อนใน UI) |
| fitnessTestFileUrl | TEXT | | N | – | อ้างอิงไฟล์ผลทดสอบสมรรถภาพ (ซ่อนใน UI) |
| noClubFileUrl | TEXT | | Y | – | อ้างอิงไฟล์หนังสือกรณีไม่มีชมรม (ซ่อนใน UI) |
| supervisorName | TEXT | | Y | – | ชื่อผู้รับรองกรณีไม่มีชมรม |
| supervisorPosition | TEXT | | Y | – | ตำแหน่งผู้รับรองกรณีไม่มีชมรม |
| clubId | TEXT | FK → Club.id | Y | – | ชมรมที่สังกัด |
| createdAt | TIMESTAMP(3) | | N | now() | วันเวลาที่สมัคร |
| updatedAt | TIMESTAMP(3) | | N | อัปเดตอัตโนมัติ | วันเวลาที่แก้ไขล่าสุด |

หมายเหตุ: คอลัมน์ไฟล์แนบเก็บค่าอ้างอิง `/api/documents/{id}/download` ของตาราง PrivateDocument ไม่ใช่ URL ตรง ส่วนการยืนยันหรือสละสิทธิ์ของนักกีฬาเก็บในตาราง StatusHistory (ค่า ATHLETE_CONFIRMED / ATHLETE_DECLINED)

## 7. ClubRoster (บัญชีรายชื่อของชมรม)
บัญชีรายชื่อนักกีฬาที่ชมรมส่งต่อการแข่งขัน Unique ร่วม (clubId, competitionId)

| คอลัมน์ | ชนิดข้อมูล | Key | Null | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|---|---|---|
| id | TEXT | PK | N | cuid() | รหัส Roster |
| clubId | TEXT | FK → Club.id | N | – | ชมรมเจ้าของ Roster |
| competitionId | TEXT | FK → Competition.id | N | – | การแข่งขัน |
| status | RosterStatus | | N | DRAFT | สถานะ Roster (ส่งแล้วจะล็อก, RETURNED = ถูกส่งคืนให้แก้) |
| version | INTEGER | | N | 0 | เลขเวอร์ชันสำหรับกันการแก้ไขชนกัน (optimistic lock) |
| documentId | TEXT | | Y | – | รหัสเอกสารบัญชีรายชื่อที่อาจารย์ที่ปรึกษาลงนาม (PrivateDocument) |
| submittedBy | TEXT | | Y | – | ผู้ส่ง Roster |
| submittedAt | TIMESTAMP(3) | | Y | – | วันเวลาที่ส่ง |
| updatedAt | TIMESTAMP(3) | | N | อัปเดตอัตโนมัติ | วันเวลาที่แก้ไขล่าสุด |

## 8. RosterItem (รายชื่อใน Roster)
นักกีฬาแต่ละคนใน Roster ใบสมัคร 1 ใบอยู่ได้ใน Roster เดียว

| คอลัมน์ | ชนิดข้อมูล | Key | Null | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|---|---|---|
| id | TEXT | PK | N | cuid() | รหัสรายการ |
| rosterId | TEXT | FK → ClubRoster.id | N | – | Roster ที่สังกัด |
| applicationId | TEXT | FK → Application.id, UQ | N | – | ใบสมัครของนักกีฬา |
| squadType | TEXT | | N | – | main = ตัวจริง, reserve = ตัวสำรอง (กีฬาทีม), selected = ผ่านการคัดเลือก (กีฬาเดี่ยว) |

---

## ตารางอื่นที่ไม่อยู่ใน 8 ตารางหลัก
มีอยู่จริงใน schema ถ้าต้องการรายละเอียดคอลัมน์ ให้เพิ่มในภาคผนวก
- **StatusHistory:** ประวัติสถานะใบสมัคร รวมการยืนยันหรือสละสิทธิ์ (FK applicationId)
- **FitnessTestResult:** ผลสมรรถภาพและข้อมูล Excellence (FK applicationId, UQ)
- **OfficialApplication, OfficialEvent:** ใบสมัครเจ้าหน้าที่ทีมและประวัติการเปลี่ยนสถานะ
- **PrivateDocument:** ไฟล์เอกสาร ไม่มี FK ใช้ ownerId + ownerRole
- **AnalyticsSnapshot:** รายงานที่บันทึกไว้ (FK authorId → User)
- **SportEntry, CompetitionResult, Activity, ClubRequest, Coach, TrainingProgram, TrainingReport, SportConfig, SystemSetting, RosterEvent, CompetitionMatch, CompetitionMatchEntry**
