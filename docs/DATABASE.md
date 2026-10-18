# Database Entity Map

แหล่งจริง: `prisma/schema.prisma` (PostgreSQL, Prisma 7, migrations 12 ชุดใน `prisma/migrations/`)

## Enums
Role (ATHLETE, CLUB, STAFF, ADMIN, TEAM_OFFICIAL) · ApplicationStatus (SUBMITTED, CLUB_APPROVED, CLUB_REJECTED, STAFF_APPROVED, STAFF_REJECTED, FINAL_SELECTED) · CompetitionStatus (OPEN, CLOSED, COMPLETED) · ClubStatus · RequestStatus · RosterStatus (DRAFT, SUBMITTED, RETURNED) · OfficialStatus · FitnessTestStatus · SportType (TEAM, INDIVIDUAL) · StudentLevel · CompetitionEventType

## กลุ่ม Model
| กลุ่ม | Model | หมายเหตุ |
|---|---|---|
| บัญชี | `User`, `AthleteProfile`, `Club` | `User` 1:1 `AthleteProfile` (cascade). `Club` มี email/password ของตัวเอง (บัญชีรุ่นเก่า) และ `User` role CLUB ผูก `clubId` ได้. มี `mustChangePassword` ทั้งสองตาราง |
| การแข่งขัน | `Competition`, `SportQuota`, `CompetitionMatch`, `CompetitionMatchEntry` | `SportQuota` unique (competitionId, sport). `Competition.sport` deprecated |
| ใบสมัครนักกีฬา | `Application`, `SportEntry`, `CompetitionResult`, `StatusHistory`, `FitnessTestResult` | `Application` unique (userId, competitionId, sport). คอลัมน์ไฟล์ 6 ตัวเป็น non-null |
| Roster | `ClubRoster`, `RosterItem`, `RosterEvent` | unique (clubId, competitionId); `version` สำหรับ optimistic lock; `RosterItem.applicationId` unique |
| เจ้าหน้าที่ทีม | `OfficialApplication`, `OfficialEvent` | `profile`/`documents` เป็น JSON; unique (userId, competitionId); `version` |
| ชมรม | `Activity`, `ClubRequest`, `Coach`, `TrainingProgram`, `TrainingReport` | cascade จาก `Club` |
| เอกสาร | `PrivateDocument` | `ownerId` + `ownerRole` เป็น string ไม่มี FK; `retained`, `state` |
| ตั้งค่า | `SportConfig`, `SystemSetting` | `SystemSetting` key/value JSON (เช่น `ATHLETICS_TRACK_BENCHMARKS`, `custom_sport_categories`; `SPORT_BENCHMARKS` เป็นของ Excellence รุ่นเดิมที่เลิกใช้แล้ว) |
| วิเคราะห์ | `AnalyticsSnapshot` | filters/data เป็น JSON |

## จุดที่ต้องระวัง
- `StatusHistory.status` เป็น String; ค่า `ATHLETE_CONFIRMED` / `ATHLETE_DECLINED` ไม่อยู่ใน enum `ApplicationStatus` (ดู `lib/athlete-decision-service.ts`)
- ข้อมูล Excellence อยู่ใน JSON `FitnessTestResult.scores._excellence.v2` (`revision`, `plans`, `retests` โดย retest เก็บผลที่ `mark`; รุ่นแรกใช้ `timeSeconds` อ่านต่อได้) ไม่มี schema บังคับ คีย์อื่นใน `_excellence` เป็นข้อมูลรุ่นเดิม ห้ามลบ
- ไม่พบ model audit log เฉพาะ; `lib/audit-service.ts` เป็นผู้บันทึก (ยังไม่ได้ยืนยันปลายทางการเก็บ)
- ความสัมพันธ์ `Club` ↔ `Application` ไม่มี cascade (`ClubRoster`, `OfficialApplication` ไม่ระบุ onDelete)
