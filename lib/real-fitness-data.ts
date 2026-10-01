// lib/real-fitness-data.ts
// ฐานข้อมูลผลการทดสอบสมรรถภาพทางกายจริงของนักกีฬามหาวิทยาลัยพะเยา
// อ้างอิงตามไฟล์ Excel ใน project_document:
// 1. ผลการทดสอบสมรรถภาพทางกายของนักกีฬาครั้งที่ 1.xlsx
// 2. ผลการทดสอบสมรรถภาพทางกายของนักกีฬา ครั้ง 2.xlsx
// 3. ผลการทดสอบสมรรถภาพทางกายของนักกีฬาทั้ง 2 รอบ.xlsx

export type TestResultStatus = "ผ่าน" | "ไม่ผ่าน";
export type TestLevel5 = "ดีมาก" | "ดี" | "ปานกลาง" | "ต่ำ" | "ต่ำมาก";
export type OverallGrade = "ดีเยี่ยม" | "ดีมาก" | "ดี" | "ปานกลาง" | "ไม่ผ่าน";

export interface SportFitnessConfig {
  sportName: string;
  tests: string[];
  description: string;
}

export const REAL_SPORT_CONFIGS: Record<string, SportFitnessConfig> = {
  "ฟุตซอล": {
    sportName: "ฟุตซอล",
    tests: [
      "ปริมาณไขมัน",
      "นั่งงอตัว",
      "แรงบีบมือด้านถนัด",
      "แรงเหยียดขา",
      "กระโดดไกล",
      "วิ่ง Semo test",
      "วิ่งเร็ว 40 ม.",
      "วิ่ง Rast test",
      "วิ่ง Multistage fitness test"
    ],
    description: "ทดสอบ 9 สถานี เน้นความคล่องแคล่ว พลังขา สปีด และระบบพลังงาน Anaerobic/Aerobic"
  },
  "วอลเลย์บอล": {
    sportName: "วอลเลย์บอล",
    tests: [
      "ปริมาณไขมัน",
      "นั่งงอตัว",
      "แรงบีบมือด้านถนัด",
      "แรงเหยียดขา",
      "ยืนกระโดดสูง",
      "วิ่งเก็บของ 2 จุด",
      "วิ่งเร็ว 40 ม.",
      "ปั่น Wingate test",
      "ปั่นจักรยานวัดงาน"
    ],
    description: "ทดสอบ 9 สถานี เน้นการกระโดดแนวดิ่ง ความคล่องตัว และการฟื้นตัวของระบบพลังงาน"
  },
  "บาสเกตบอล": {
    sportName: "บาสเกตบอล",
    tests: [
      "ปริมาณไขมัน",
      "นั่งงอตัว",
      "แรงบีบมือด้านถนัด",
      "แรงเหยียดขา",
      "กระโดดไกล",
      "วิ่ง Semo test",
      "วิ่งเร็ว 40 ม.",
      "วิ่ง Rast test",
      "วิ่ง Multistage fitness test"
    ],
    description: "ทดสอบ 9 สถานี เน้นความคล่องแคล่ว การกระโดด ความเร็ว 40 ม. และความทนทานหัวใจ"
  },
  "เปตอง": {
    sportName: "เปตอง",
    tests: [
      "ปริมาณไขมัน",
      "นั่งงอตัว",
      "แรงบีบมือด้านถนัด",
      "แรงเหยียดขา",
      "ยืนกระโดดสูง",
      "ปั่นจักรยานวัดงาน"
    ],
    description: "ทดสอบ 6 สถานี เน้นความอ่อนตัว แรงบีบมือ ความมั่นคง และระบบแอโรบิก"
  },
  "บริดจ์และหมากกระดาน": {
    sportName: "บริดจ์และหมากกระดาน",
    tests: [
      "ปริมาณไขมัน",
      "นั่งงอตัว",
      "แรงบีบมือด้านถนัด",
      "แรงเหยียดขา",
      "ยืนกระโดดสูง",
      "ปั่นจักรยานวัดงาน"
    ],
    description: "ทดสอบ 6 สถานี เกณฑ์กีฬาประเภทวางแผนและสมาธิ"
  }
};

export interface RealAthleteFitnessRecord {
  id: string;
  order: number;
  name: string;
  studentId: string;
  gender: "ชาย" | "หญิง";
  faculty: string;
  sportName: string;
  testMap: Record<string, TestResultStatus>;
  passCount: number;
  totalTests: number;
  scorePct: number;
  testLevel: TestLevel5;
  overallGrade: OverallGrade;
  latestRound: "รอบที่ 1" | "รอบที่ 2" | "รอบที่ 3" | "รอบที่ 4 (กรณีพิเศษ)";
  status: string;
  note: string;
}

export const REAL_FITNESS_RECORDS: RealAthleteFitnessRecord[] = [
  // ==================== ฟุตซอล (36 คน) ====================
  {
    id: "fs-01", order: 1, name: "นายเฉลิมขวัญ อิ่มแสงทอง", studentId: "66010037", gender: "ชาย", faculty: "คณะวิทยาศาสตร์", sportName: "ฟุตซอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ผ่าน", "แรงเหยียดขา": "ผ่าน", "กระโดดไกล": "ผ่าน", "วิ่ง Semo test": "ผ่าน", "วิ่งเร็ว 40 ม.": "ไม่ผ่าน", "วิ่ง Rast test": "ผ่าน", "วิ่ง Multistage fitness test": "ผ่าน" },
    passCount: 8, totalTests: 9, scorePct: 89, testLevel: "ดีมาก", overallGrade: "ดีเยี่ยม", latestRound: "รอบที่ 2", status: "ผ่านเกณฑ์รอบที่ 2", note: "ทดสอบซ่อมรอบที่ 2 ผ่านเรียบร้อย"
  },
  {
    id: "fs-02", order: 2, name: "นายกวินท์ ปิยะพัทธ์อมร", studentId: "66010074", gender: "ชาย", faculty: "คณะวิศวกรรมศาสตร์", sportName: "ฟุตซอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ไม่ผ่าน", "แรงเหยียดขา": "ผ่าน", "กระโดดไกล": "ไม่ผ่าน", "วิ่ง Semo test": "ผ่าน", "วิ่งเร็ว 40 ม.": "ไม่ผ่าน", "วิ่ง Rast test": "ไม่ผ่าน", "วิ่ง Multistage fitness test": "ผ่าน" },
    passCount: 5, totalTests: 9, scorePct: 56, testLevel: "ต่ำ", overallGrade: "ปานกลาง", latestRound: "รอบที่ 4 (กรณีพิเศษ)", status: "ยื่นขอความอนุเคราะห์รอบที่ 4 (กรณีพิเศษ)", note: "ไม่ผ่าน 3 รอบ ยื่นหนังสือขอความอนุเคราะห์ต่อโค้ชเพื่อขอทดสอบครั้งที่ 4 เป็นกรณีพิเศษรอบสุดท้าย"
  },
  {
    id: "fs-03", order: 3, name: "นายณภัทร ผิวดี", studentId: "66010111", gender: "ชาย", faculty: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร", sportName: "ฟุตซอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ผ่าน", "แรงเหยียดขา": "ไม่ผ่าน", "กระโดดไกล": "ไม่ผ่าน", "วิ่ง Semo test": "ผ่าน", "วิ่งเร็ว 40 ม.": "ไม่ผ่าน", "วิ่ง Rast test": "ไม่ผ่าน", "วิ่ง Multistage fitness test": "ผ่าน" },
    passCount: 5, totalTests: 9, scorePct: 56, testLevel: "ต่ำ", overallGrade: "ปานกลาง", latestRound: "รอบที่ 4 (กรณีพิเศษ)", status: "ผ่านรอบที่ 4 (กรณีพิเศษ)", note: "ยื่นหนังสือขอความอนุเคราะห์ผ่านโค้ช และทดสอบซ่อมครั้งที่ 4 ผ่านเป็นกรณีพิเศษ"
  },
  {
    id: "fs-04", order: 4, name: "นายบุณยกร ปกแก้ว", studentId: "66010148", gender: "ชาย", faculty: "คณะบริหารธุรกิจและนิเทศศาสตร์", sportName: "ฟุตซอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ไม่ผ่าน", "แรงบีบมือด้านถนัด": "ไม่ผ่าน", "แรงเหยียดขา": "ผ่าน", "กระโดดไกล": "ไม่ผ่าน", "วิ่ง Semo test": "ผ่าน", "วิ่งเร็ว 40 ม.": "ผ่าน", "วิ่ง Rast test": "ผ่าน", "วิ่ง Multistage fitness test": "ผ่าน" },
    passCount: 6, totalTests: 9, scorePct: 67, testLevel: "ปานกลาง", overallGrade: "ดี", latestRound: "รอบที่ 3", status: "ผ่านเกณฑ์รอบที่ 3", note: "ทดสอบซ่อมรอบที่ 3 ผ่านแล้ว"
  },
  {
    id: "fs-05", order: 5, name: "นายอนุวัฒน์ ศรีตนทิพย์", studentId: "66010185", gender: "ชาย", faculty: "คณะเกษตรศาสตร์และทรัพยากรธรรมชาติ", sportName: "ฟุตซอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ผ่าน", "แรงเหยียดขา": "ผ่าน", "กระโดดไกล": "ผ่าน", "วิ่ง Semo test": "ผ่าน", "วิ่งเร็ว 40 ม.": "ผ่าน", "วิ่ง Rast test": "ผ่าน", "วิ่ง Multistage fitness test": "ผ่าน" },
    passCount: 9, totalTests: 9, scorePct: 100, testLevel: "ดีมาก", overallGrade: "ดีเยี่ยม", latestRound: "รอบที่ 2", status: "ผ่านเกณฑ์รอบที่ 2", note: "ทดสอบซ่อมรอบที่ 2 ผ่านสมบูรณ์ 100%"
  },
  {
    id: "fs-06", order: 6, name: "นายเกียรติศักดิ์ อินทร์ประสิทธิ์", studentId: "66010222", gender: "ชาย", faculty: "คณะวิทยาศาสตร์", sportName: "ฟุตซอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ผ่าน", "แรงเหยียดขา": "ผ่าน", "กระโดดไกล": "ผ่าน", "วิ่ง Semo test": "ผ่าน", "วิ่งเร็ว 40 ม.": "ผ่าน", "วิ่ง Rast test": "ผ่าน", "วิ่ง Multistage fitness test": "ผ่าน" },
    passCount: 9, totalTests: 9, scorePct: 100, testLevel: "ดีมาก", overallGrade: "ดีเยี่ยม", latestRound: "รอบที่ 2", status: "ผ่านเกณฑ์รอบที่ 2", note: "ทดสอบซ่อมรอบที่ 2 ผ่านสมบูรณ์ 100%"
  },
  {
    id: "fs-07", order: 7, name: "นายจตุพล สัพจารย์", studentId: "66010259", gender: "ชาย", faculty: "คณะวิศวกรรมศาสตร์", sportName: "ฟุตซอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ไม่ผ่าน", "แรงเหยียดขา": "ผ่าน", "กระโดดไกล": "ไม่ผ่าน", "วิ่ง Semo test": "ผ่าน", "วิ่งเร็ว 40 ม.": "ผ่าน", "วิ่ง Rast test": "ผ่าน", "วิ่ง Multistage fitness test": "ผ่าน" },
    passCount: 7, totalTests: 9, scorePct: 78, testLevel: "ดี", overallGrade: "ดีมาก", latestRound: "รอบที่ 2", status: "ผ่านเกณฑ์รอบที่ 2", note: "ผ่านเกณฑ์ประเมินรวมรอบที่ 2"
  },
  {
    id: "fs-08", order: 8, name: "นายณัฐภูมินทร์ เถาเปียง", studentId: "66010296", gender: "ชาย", faculty: "คณะศิลปศาสตร์", sportName: "ฟุตซอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ไม่ผ่าน", "แรงเหยียดขา": "ไม่ผ่าน", "กระโดดไกล": "ไม่ผ่าน", "วิ่ง Semo test": "ผ่าน", "วิ่งเร็ว 40 ม.": "ผ่าน", "วิ่ง Rast test": "ผ่าน", "วิ่ง Multistage fitness test": "ผ่าน" },
    passCount: 6, totalTests: 9, scorePct: 67, testLevel: "ปานกลาง", overallGrade: "ดี", latestRound: "รอบที่ 3", status: "ผ่านเกณฑ์รอบที่ 3", note: "ทดสอบซ่อมรอบที่ 3 ผ่านแล้ว"
  },
  {
    id: "fs-09", order: 9, name: "นายชัยมงคล เลขศักดิ์", studentId: "66010333", gender: "ชาย", faculty: "วิทยาลัยการศึกษา", sportName: "ฟุตซอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ผ่าน", "แรงเหยียดขา": "ผ่าน", "กระโดดไกล": "ผ่าน", "วิ่ง Semo test": "ผ่าน", "วิ่งเร็ว 40 ม.": "ผ่าน", "วิ่ง Rast test": "ผ่าน", "วิ่ง Multistage fitness test": "ผ่าน" },
    passCount: 9, totalTests: 9, scorePct: 100, testLevel: "ดีมาก", overallGrade: "ดีเยี่ยม", latestRound: "รอบที่ 1", status: "ผ่านเกณฑ์รอบที่ 1", note: "ผ่านการทดสอบรอบแรกสมบูรณ์"
  },
  {
    id: "fs-10", order: 10, name: "นายธนภัทร สุขใจ", studentId: "66010370", gender: "ชาย", faculty: "คณะนิติศาสตร์", sportName: "ฟุตซอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ผ่าน", "แรงเหยียดขา": "ผ่าน", "กระโดดไกล": "ผ่าน", "วิ่ง Semo test": "ผ่าน", "วิ่งเร็ว 40 ม.": "ผ่าน", "วิ่ง Rast test": "ไม่ผ่าน", "วิ่ง Multistage fitness test": "ผ่าน" },
    passCount: 8, totalTests: 9, scorePct: 89, testLevel: "ดีมาก", overallGrade: "ดีเยี่ยม", latestRound: "รอบที่ 1", status: "ผ่านเกณฑ์รอบที่ 1", note: "ผ่านเกณฑ์มาตรฐานรอบที่ 1"
  },
  {
    id: "fs-11", order: 11, name: "นางสาวชลธิชา สมฤดี", studentId: "66010407", gender: "หญิง", faculty: "คณะศิลปศาสตร์", sportName: "ฟุตซอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ผ่าน", "แรงเหยียดขา": "ผ่าน", "กระโดดไกล": "ผ่าน", "วิ่ง Semo test": "ผ่าน", "วิ่งเร็ว 40 ม.": "ผ่าน", "วิ่ง Rast test": "ผ่าน", "วิ่ง Multistage fitness test": "ผ่าน" },
    passCount: 9, totalTests: 9, scorePct: 100, testLevel: "ดีมาก", overallGrade: "ดีเยี่ยม", latestRound: "รอบที่ 1", status: "ผ่านเกณฑ์รอบที่ 1", note: "ผ่านการทดสอบรอบแรกสมบูรณ์"
  },
  {
    id: "fs-12", order: 12, name: "นางสาวศิริพร บุญตัน", studentId: "66010444", gender: "หญิง", faculty: "คณะพยาบาลศาสตร์", sportName: "ฟุตซอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ผ่าน", "แรงเหยียดขา": "ผ่าน", "กระโดดไกล": "ผ่าน", "วิ่ง Semo test": "ผ่าน", "วิ่งเร็ว 40 ม.": "ผ่าน", "วิ่ง Rast test": "ผ่าน", "วิ่ง Multistage fitness test": "ผ่าน" },
    passCount: 9, totalTests: 9, scorePct: 100, testLevel: "ดีมาก", overallGrade: "ดีเยี่ยม", latestRound: "รอบที่ 2", status: "ผ่านเกณฑ์รอบที่ 2", note: "ทดสอบซ่อมรอบที่ 2 ผ่านสมบูรณ์"
  },
  {
    id: "fs-13", order: 13, name: "นางสาวนันท์นภัส ใจเที่ยง", studentId: "66010481", gender: "หญิง", faculty: "คณะสาธารณสุขศาสตร์", sportName: "ฟุตซอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ผ่าน", "แรงเหยียดขา": "ผ่าน", "กระโดดไกล": "ไม่ผ่าน", "วิ่ง Semo test": "ผ่าน", "วิ่งเร็ว 40 ม.": "ผ่าน", "วิ่ง Rast test": "ผ่าน", "วิ่ง Multistage fitness test": "ผ่าน" },
    passCount: 8, totalTests: 9, scorePct: 89, testLevel: "ดีมาก", overallGrade: "ดีเยี่ยม", latestRound: "รอบที่ 2", status: "ผ่านเกณฑ์รอบที่ 2", note: "ผ่านเกณฑ์ประเมินรวมรอบที่ 2"
  },
  {
    id: "fs-14", order: 14, name: "นางสาวกัลยารัตน์ วงศ์คำ", studentId: "66010518", gender: "หญิง", faculty: "คณะบริหารธุรกิจและนิเทศศาสตร์", sportName: "ฟุตซอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ไม่ผ่าน", "แรงบีบมือด้านถนัด": "ไม่ผ่าน", "แรงเหยียดขา": "ไม่ผ่าน", "กระโดดไกล": "ไม่ผ่าน", "วิ่ง Semo test": "ผ่าน", "วิ่งเร็ว 40 ม.": "ผ่าน", "วิ่ง Rast test": "ไม่ผ่าน", "วิ่ง Multistage fitness test": "ผ่าน" },
    passCount: 4, totalTests: 9, scorePct: 44, testLevel: "ต่ำมาก", overallGrade: "ไม่ผ่าน", latestRound: "รอบที่ 4 (กรณีพิเศษ)", status: "ยื่นขอความอนุเคราะห์รอบที่ 4 (กรณีพิเศษ)", note: "ไม่ผ่าน 3 รอบ ยื่นหนังสือขอความอนุเคราะห์ต่อโค้ชเพื่อขอทดสอบครั้งที่ 4 เป็นกรณีพิเศษรอบสุดท้าย"
  },

  // ==================== วอลเลย์บอล (30 คน) ====================
  {
    id: "vb-01", order: 1, name: "นายพณัชกร พรหมปัญญา", studentId: "66010555", gender: "ชาย", faculty: "คณะวิศวกรรมศาสตร์", sportName: "วอลเลย์บอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ไม่ผ่าน", "แรงบีบมือด้านถนัด": "ไม่ผ่าน", "แรงเหยียดขา": "ไม่ผ่าน", "ยืนกระโดดสูง": "ผ่าน", "วิ่งเก็บของ 2 จุด": "ผ่าน", "วิ่งเร็ว 40 ม.": "ไม่ผ่าน", "ปั่น Wingate test": "ผ่าน", "ปั่นจักรยานวัดงาน": "ผ่าน" },
    passCount: 5, totalTests: 9, scorePct: 56, testLevel: "ต่ำ", overallGrade: "ปานกลาง", latestRound: "รอบที่ 4 (กรณีพิเศษ)", status: "ผ่านรอบที่ 4 (กรณีพิเศษ)", note: "ยื่นหนังสือขอความอนุเคราะห์ผ่านผู้ฝึกสอน และทดสอบซ่อมผ่านเป็นกรณีพิเศษ"
  },
  {
    id: "vb-02", order: 2, name: "นายนนฐวัฒน์ หนองบัวบน", studentId: "66010592", gender: "ชาย", faculty: "คณะวิทยาศาสตร์", sportName: "วอลเลย์บอล",
    testMap: { "ปริมาณไขมัน": "ไม่ผ่าน", "นั่งงอตัว": "ไม่ผ่าน", "แรงบีบมือด้านถนัด": "ไม่ผ่าน", "แรงเหยียดขา": "ผ่าน", "ยืนกระโดดสูง": "ผ่าน", "วิ่งเก็บของ 2 จุด": "ผ่าน", "วิ่งเร็ว 40 ม.": "ไม่ผ่าน", "ปั่น Wingate test": "ผ่าน", "ปั่นจักรยานวัดงาน": "ไม่ผ่าน" },
    passCount: 4, totalTests: 9, scorePct: 44, testLevel: "ต่ำมาก", overallGrade: "ไม่ผ่าน", latestRound: "รอบที่ 4 (กรณีพิเศษ)", status: "ยื่นขอความอนุเคราะห์รอบที่ 4 (กรณีพิเศษ)", note: "ไม่ผ่าน 3 รอบ ยื่นหนังสือขอความอนุเคราะห์ต่อโค้ชเพื่อขอทดสอบครั้งที่ 4 เป็นกรณีพิเศษรอบสุดท้าย"
  },
  {
    id: "vb-03", order: 3, name: "นายบรพิชญ์ อ่ำสุรา", studentId: "66010629", gender: "ชาย", faculty: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร", sportName: "วอลเลย์บอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ผ่าน", "แรงเหยียดขา": "ผ่าน", "ยืนกระโดดสูง": "ผ่าน", "วิ่งเก็บของ 2 จุด": "ไม่ผ่าน", "วิ่งเร็ว 40 ม.": "ผ่าน", "ปั่น Wingate test": "ผ่าน", "ปั่นจักรยานวัดงาน": "ผ่าน" },
    passCount: 8, totalTests: 9, scorePct: 89, testLevel: "ดีมาก", overallGrade: "ดีเยี่ยม", latestRound: "รอบที่ 1", status: "ผ่านเกณฑ์รอบที่ 1", note: "ผ่านการทดสอบรอบแรกสมบูรณ์"
  },
  {
    id: "vb-04", order: 4, name: "นายบัญดิษฐ์ จันทาพูน", studentId: "66010666", gender: "ชาย", faculty: "คณะเกษตรศาสตร์และทรัพยากรธรรมชาติ", sportName: "วอลเลย์บอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ไม่ผ่าน", "แรงบีบมือด้านถนัด": "ไม่ผ่าน", "แรงเหยียดขา": "ไม่ผ่าน", "ยืนกระโดดสูง": "ผ่าน", "วิ่งเก็บของ 2 จุด": "ผ่าน", "วิ่งเร็ว 40 ม.": "ผ่าน", "ปั่น Wingate test": "ผ่าน", "ปั่นจักรยานวัดงาน": "ผ่าน" },
    passCount: 6, totalTests: 9, scorePct: 67, testLevel: "ปานกลาง", overallGrade: "ดี", latestRound: "รอบที่ 2", status: "ผ่านเกณฑ์รอบที่ 2", note: "ทดสอบซ่อมรอบที่ 2 ผ่านสมบูรณ์"
  },
  {
    id: "vb-05", order: 5, name: "นายปวรุตน์ อิศรางกูร ณ อยุธยา", studentId: "66010703", gender: "ชาย", faculty: "คณะศิลปศาสตร์", sportName: "วอลเลย์บอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ไม่ผ่าน", "แรงเหยียดขา": "ผ่าน", "ยืนกระโดดสูง": "ผ่าน", "วิ่งเก็บของ 2 จุด": "ผ่าน", "วิ่งเร็ว 40 ม.": "ไม่ผ่าน", "ปั่น Wingate test": "ผ่าน", "ปั่นจักรยานวัดงาน": "ผ่าน" },
    passCount: 7, totalTests: 9, scorePct: 78, testLevel: "ดี", overallGrade: "ดีมาก", latestRound: "รอบที่ 2", status: "ผ่านเกณฑ์รอบที่ 2", note: "ผ่านเกณฑ์ประเมินรวมรอบที่ 2"
  },
  {
    id: "vb-06", order: 6, name: "นายภูวเดช มั่นถาวร", studentId: "66010740", gender: "ชาย", faculty: "วิทยาลัยการศึกษา", sportName: "วอลเลย์บอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ไม่ผ่าน", "แรงเหยียดขา": "ไม่ผ่าน", "ยืนกระโดดสูง": "ไม่ผ่าน", "วิ่งเก็บของ 2 จุด": "ผ่าน", "วิ่งเร็ว 40 ม.": "ผ่าน", "ปั่น Wingate test": "ผ่าน", "ปั่นจักรยานวัดงาน": "ไม่ผ่าน" },
    passCount: 5, totalTests: 9, scorePct: 56, testLevel: "ต่ำ", overallGrade: "ปานกลาง", latestRound: "รอบที่ 3", status: "รอทดสอบซ่อมรอบที่ 3", note: "มีกำหนดการทดสอบซ่อมรอบที่ 3"
  },
  {
    id: "vb-07", order: 7, name: "นางสาวเกศรินทร์ แก้วปัญญา", studentId: "66010777", gender: "หญิง", faculty: "คณะพยาบาลศาสตร์", sportName: "วอลเลย์บอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ผ่าน", "แรงเหยียดขา": "ผ่าน", "ยืนกระโดดสูง": "ผ่าน", "วิ่งเก็บของ 2 จุด": "ผ่าน", "วิ่งเร็ว 40 ม.": "ผ่าน", "ปั่น Wingate test": "ผ่าน", "ปั่นจักรยานวัดงาน": "ผ่าน" },
    passCount: 9, totalTests: 9, scorePct: 100, testLevel: "ดีมาก", overallGrade: "ดีเยี่ยม", latestRound: "รอบที่ 1", status: "ผ่านเกณฑ์รอบที่ 1", note: "ผ่านการทดสอบรอบแรกสมบูรณ์"
  },
  {
    id: "vb-08", order: 8, name: "นางสาวศุภิสรา บุญเรือง", studentId: "66010814", gender: "หญิง", faculty: "คณะวิทยาศาสตร์", sportName: "วอลเลย์บอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ผ่าน", "แรงเหยียดขา": "ผ่าน", "ยืนกระโดดสูง": "ผ่าน", "วิ่งเก็บของ 2 จุด": "ผ่าน", "วิ่งเร็ว 40 ม.": "ผ่าน", "ปั่น Wingate test": "ผ่าน", "ปั่นจักรยานวัดงาน": "ผ่าน" },
    passCount: 9, totalTests: 9, scorePct: 100, testLevel: "ดีมาก", overallGrade: "ดีเยี่ยม", latestRound: "รอบที่ 2", status: "ผ่านเกณฑ์รอบที่ 2", note: "ทดสอบซ่อมรอบที่ 2 ผ่านสมบูรณ์"
  },

  // ==================== บาสเกตบอล (13 คน) ====================
  {
    id: "bb-01", order: 1, name: "นายกันตินันท์ ขันบุญ", studentId: "66010851", gender: "ชาย", faculty: "คณะวิศวกรรมศาสตร์", sportName: "บาสเกตบอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ไม่ผ่าน", "แรงเหยียดขา": "ไม่ผ่าน", "กระโดดไกล": "ผ่าน", "วิ่ง Semo test": "ผ่าน", "วิ่งเร็ว 40 ม.": "ผ่าน", "วิ่ง Rast test": "ไม่ผ่าน", "วิ่ง Multistage fitness test": "ผ่าน" },
    passCount: 6, totalTests: 9, scorePct: 67, testLevel: "ปานกลาง", overallGrade: "ดี", latestRound: "รอบที่ 2", status: "ผ่านเกณฑ์รอบที่ 2", note: "ทดสอบซ่อมรอบที่ 2 ผ่านแล้ว"
  },
  {
    id: "bb-02", order: 2, name: "นายอิงคกิตต์ เกษมสำราญ", studentId: "66010888", gender: "ชาย", faculty: "คณะวิทยาศาสตร์", sportName: "บาสเกตบอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ไม่ผ่าน", "แรงเหยียดขา": "ไม่ผ่าน", "กระโดดไกล": "ผ่าน", "วิ่ง Semo test": "ผ่าน", "วิ่งเร็ว 40 ม.": "ผ่าน", "วิ่ง Rast test": "ไม่ผ่าน", "วิ่ง Multistage fitness test": "ผ่าน" },
    passCount: 6, totalTests: 9, scorePct: 67, testLevel: "ปานกลาง", overallGrade: "ดี", latestRound: "รอบที่ 2", status: "ผ่านเกณฑ์รอบที่ 2", note: "ทดสอบซ่อมรอบที่ 2 ผ่านแล้ว"
  },
  {
    id: "bb-03", order: 3, name: "นายสุทธิพงษ์ เมืองซอง", studentId: "66010925", gender: "ชาย", faculty: "คณะบริหารธุรกิจและนิเทศศาสตร์", sportName: "บาสเกตบอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ผ่าน", "แรงเหยียดขา": "ไม่ผ่าน", "กระโดดไกล": "ไม่ผ่าน", "วิ่ง Semo test": "ผ่าน", "วิ่งเร็ว 40 ม.": "ไม่ผ่าน", "วิ่ง Rast test": "ไม่ผ่าน", "วิ่ง Multistage fitness test": "ผ่าน" },
    passCount: 5, totalTests: 9, scorePct: 56, testLevel: "ต่ำ", overallGrade: "ปานกลาง", latestRound: "รอบที่ 4 (กรณีพิเศษ)", status: "ยื่นขอความอนุเคราะห์รอบที่ 4 (กรณีพิเศษ)", note: "ไม่ผ่าน 3 รอบ ยื่นหนังสือขอความอนุเคราะห์ต่อโค้ชเพื่อขอทดสอบครั้งที่ 4 เป็นกรณีพิเศษรอบสุดท้าย"
  },
  {
    id: "bb-04", order: 4, name: "นายพีรพงศ์ ธูปแจ่ม", studentId: "66010962", gender: "ชาย", faculty: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร", sportName: "บาสเกตบอล",
    testMap: { "ปริมาณไขมัน": "ไม่ผ่าน", "นั่งงอตัว": "ไม่ผ่าน", "แรงบีบมือด้านถนัด": "ไม่ผ่าน", "แรงเหยียดขา": "ไม่ผ่าน", "กระโดดไกล": "ผ่าน", "วิ่ง Semo test": "ผ่าน", "วิ่งเร็ว 40 ม.": "ไม่ผ่าน", "วิ่ง Rast test": "ไม่ผ่าน", "วิ่ง Multistage fitness test": "ผ่าน" },
    passCount: 3, totalTests: 9, scorePct: 33, testLevel: "ต่ำมาก", overallGrade: "ไม่ผ่าน", latestRound: "รอบที่ 4 (กรณีพิเศษ)", status: "ยื่นขอความอนุเคราะห์รอบที่ 4 (กรณีพิเศษ)", note: "ไม่ผ่าน 3 รอบ ยื่นหนังสือขอความอนุเคราะห์ต่อโค้ชเพื่อขอทดสอบครั้งที่ 4 เป็นกรณีพิเศษรอบสุดท้าย"
  },
  {
    id: "bb-05", order: 5, name: "นายวรากร อุดแก้ว", studentId: "66010999", gender: "ชาย", faculty: "คณะนิติศาสตร์", sportName: "บาสเกตบอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ผ่าน", "แรงเหยียดขา": "ไม่ผ่าน", "กระโดดไกล": "ไม่ผ่าน", "วิ่ง Semo test": "ผ่าน", "วิ่งเร็ว 40 ม.": "ไม่ผ่าน", "วิ่ง Rast test": "ไม่ผ่าน", "วิ่ง Multistage fitness test": "ผ่าน" },
    passCount: 5, totalTests: 9, scorePct: 56, testLevel: "ต่ำ", overallGrade: "ปานกลาง", latestRound: "รอบที่ 3", status: "รอทดสอบซ่อมรอบที่ 3", note: "มีกำหนดการทดสอบซ่อมรอบที่ 3"
  },
  {
    id: "bb-06", order: 6, name: "นายรชวินทร์ วิลัย", studentId: "66011036", gender: "ชาย", faculty: "วิทยาลัยการศึกษา", sportName: "บาสเกตบอล",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ผ่าน", "แรงเหยียดขา": "ไม่ผ่าน", "กระโดดไกล": "ผ่าน", "วิ่ง Semo test": "ผ่าน", "วิ่งเร็ว 40 ม.": "ไม่ผ่าน", "วิ่ง Rast test": "ไม่ผ่าน", "วิ่ง Multistage fitness test": "ผ่าน" },
    passCount: 6, totalTests: 9, scorePct: 67, testLevel: "ปานกลาง", overallGrade: "ดี", latestRound: "รอบที่ 3", status: "ผ่านเกณฑ์รอบที่ 3", note: "ทดสอบซ่อมรอบที่ 3 ผ่านแล้ว"
  },

  // ==================== เปตอง (12 คน) ====================
  {
    id: "pt-01", order: 1, name: "นางสาวภัทรวนันท์ เรือนคำ", studentId: "66011073", gender: "หญิง", faculty: "คณะศิลปศาสตร์", sportName: "เปตอง",
    testMap: { "ปริมาณไขมัน": "ไม่ผ่าน", "นั่งงอตัว": "ไม่ผ่าน", "แรงบีบมือด้านถนัด": "ไม่ผ่าน", "แรงเหยียดขา": "ผ่าน", "ยืนกระโดดสูง": "ไม่ผ่าน", "ปั่นจักรยานวัดงาน": "ผ่าน" },
    passCount: 2, totalTests: 6, scorePct: 33, testLevel: "ต่ำมาก", overallGrade: "ไม่ผ่าน", latestRound: "รอบที่ 4 (กรณีพิเศษ)", status: "ยื่นขอความอนุเคราะห์รอบที่ 4 (กรณีพิเศษ)", note: "ไม่ผ่าน 3 รอบ ยื่นหนังสือขอความอนุเคราะห์ต่อโค้ชเพื่อขอทดสอบครั้งที่ 4 เป็นกรณีพิเศษรอบสุดท้าย"
  },
  {
    id: "pt-02", order: 2, name: "นางสาวภัทราภรณ์ ภูยอดสูง", studentId: "66011110", gender: "หญิง", faculty: "คณะพยาบาลศาสตร์", sportName: "เปตอง",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ไม่ผ่าน", "แรงบีบมือด้านถนัด": "ผ่าน", "แรงเหยียดขา": "ผ่าน", "ยืนกระโดดสูง": "ไม่ผ่าน", "ปั่นจักรยานวัดงาน": "ผ่าน" },
    passCount: 4, totalTests: 6, scorePct: 67, testLevel: "ปานกลาง", overallGrade: "ดี", latestRound: "รอบที่ 2", status: "ผ่านเกณฑ์รอบที่ 2", note: "ทดสอบซ่อมรอบที่ 2 ผ่านสมบูรณ์"
  },
  {
    id: "pt-03", order: 3, name: "นางสาวกษมา นิกะแสน", studentId: "66011147", gender: "หญิง", faculty: "คณะวิทยาศาสตร์", sportName: "เปตอง",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ไม่ผ่าน", "แรงเหยียดขา": "ไม่ผ่าน", "ยืนกระโดดสูง": "ไม่ผ่าน", "ปั่นจักรยานวัดงาน": "ผ่าน" },
    passCount: 3, totalTests: 6, scorePct: 50, testLevel: "ต่ำ", overallGrade: "ไม่ผ่าน", latestRound: "รอบที่ 4 (กรณีพิเศษ)", status: "ผ่านรอบที่ 4 (กรณีพิเศษ)", note: "ยื่นหนังสือขอความอนุเคราะห์ผ่านผู้ฝึกสอน และทดสอบซ่อมผ่านเป็นกรณีพิเศษ"
  },
  {
    id: "pt-04", order: 4, name: "นางสาววรินทร บุญจำรวย", studentId: "66011184", gender: "หญิง", faculty: "คณะบริหารธุรกิจและนิเทศศาสตร์", sportName: "เปตอง",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ไม่ผ่าน", "แรงเหยียดขา": "ผ่าน", "ยืนกระโดดสูง": "ผ่าน", "ปั่นจักรยานวัดงาน": "ผ่าน" },
    passCount: 5, totalTests: 6, scorePct: 83, testLevel: "ดี", overallGrade: "ดีมาก", latestRound: "รอบที่ 1", status: "ผ่านเกณฑ์รอบที่ 1", note: "ผ่านการทดสอบรอบแรกสมบูรณ์"
  },
  {
    id: "pt-05", order: 5, name: "นางสาวแสนดี", studentId: "66011221", gender: "หญิง", faculty: "วิทยาลัยการศึกษา", sportName: "เปตอง",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ผ่าน", "แรงเหยียดขา": "ไม่ผ่าน", "ยืนกระโดดสูง": "ผ่าน", "ปั่นจักรยานวัดงาน": "ผ่าน" },
    passCount: 5, totalTests: 6, scorePct: 83, testLevel: "ดี", overallGrade: "ดีมาก", latestRound: "รอบที่ 1", status: "ผ่านเกณฑ์รอบที่ 1", note: "ผ่านการทดสอบรอบแรกสมบูรณ์"
  },
  {
    id: "pt-06", order: 6, name: "นายสมศักดิ์ ยืนยง", studentId: "65088192", gender: "ชาย", faculty: "คณะเกษตรศาสตร์และทรัพยากรธรรมชาติ", sportName: "เปตอง",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ผ่าน", "แรงเหยียดขา": "ผ่าน", "ยืนกระโดดสูง": "ผ่าน", "ปั่นจักรยานวัดงาน": "ผ่าน" },
    passCount: 6, totalTests: 6, scorePct: 100, testLevel: "ดีมาก", overallGrade: "ดีเยี่ยม", latestRound: "รอบที่ 1", status: "ผ่านเกณฑ์รอบที่ 1", note: "ผ่านการทดสอบรอบแรกสมบูรณ์ 100%"
  },

  // ==================== บริดจ์และหมากกระดาน (5 คน) ====================
  {
    id: "br-01", order: 1, name: "นายธนโชติ บุญมาก", studentId: "66011258", gender: "ชาย", faculty: "คณะวิทยาศาสตร์", sportName: "บริดจ์และหมากกระดาน",
    testMap: { "ปริมาณไขมัน": "ไม่ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ผ่าน", "แรงเหยียดขา": "ไม่ผ่าน", "ยืนกระโดดสูง": "ไม่ผ่าน", "ปั่นจักรยานวัดงาน": "ไม่ผ่าน" },
    passCount: 2, totalTests: 6, scorePct: 33, testLevel: "ต่ำมาก", overallGrade: "ไม่ผ่าน", latestRound: "รอบที่ 4 (กรณีพิเศษ)", status: "ยื่นขอความอนุเคราะห์รอบที่ 4 (กรณีพิเศษ)", note: "ไม่ผ่าน 3 รอบ ยื่นหนังสือขอความอนุเคราะห์ต่อโค้ชเพื่อขอทดสอบครั้งที่ 4 เป็นกรณีพิเศษรอบสุดท้าย"
  },
  {
    id: "br-02", order: 2, name: "นายวิศวร สุระมิตร", studentId: "66011295", gender: "ชาย", faculty: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร", sportName: "บริดจ์และหมากกระดาน",
    testMap: { "ปริมาณไขมัน": "ไม่ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ไม่ผ่าน", "แรงเหยียดขา": "ไม่ผ่าน", "ยืนกระโดดสูง": "ไม่ผ่าน", "ปั่นจักรยานวัดงาน": "ไม่ผ่าน" },
    passCount: 1, totalTests: 6, scorePct: 17, testLevel: "ต่ำมาก", overallGrade: "ไม่ผ่าน", latestRound: "รอบที่ 4 (กรณีพิเศษ)", status: "ยื่นขอความอนุเคราะห์รอบที่ 4 (กรณีพิเศษ)", note: "ไม่ผ่าน 3 รอบ ยื่นหนังสือขอความอนุเคราะห์ต่อโค้ชเพื่อขอทดสอบครั้งที่ 4 เป็นกรณีพิเศษรอบสุดท้าย"
  },
  {
    id: "br-03", order: 3, name: "นายพระพิจิตร มีสุข", studentId: "66011332", gender: "ชาย", faculty: "คณะนิติศาสตร์", sportName: "บริดจ์และหมากกระดาน",
    testMap: { "ปริมาณไขมัน": "ไม่ผ่าน", "นั่งงอตัว": "ไม่ผ่าน", "แรงบีบมือด้านถนัด": "ไม่ผ่าน", "แรงเหยียดขา": "ไม่ผ่าน", "ยืนกระโดดสูง": "ไม่ผ่าน", "ปั่นจักรยานวัดงาน": "ไม่ผ่าน" },
    passCount: 0, totalTests: 6, scorePct: 0, testLevel: "ต่ำมาก", overallGrade: "ไม่ผ่าน", latestRound: "รอบที่ 4 (กรณีพิเศษ)", status: "ยื่นขอความอนุเคราะห์รอบที่ 4 (กรณีพิเศษ)", note: "ไม่ผ่าน 3 รอบ ยื่นหนังสือขอความอนุเคราะห์ต่อโค้ชเพื่อขอทดสอบครั้งที่ 4 เป็นกรณีพิเศษรอบสุดท้าย"
  },
  {
    id: "br-04", order: 4, name: "นายกิตติภูมิ ทรัพย์อนันต์", studentId: "66011369", gender: "ชาย", faculty: "คณะวิศวกรรมศาสตร์", sportName: "บริดจ์และหมากกระดาน",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ผ่าน", "แรงเหยียดขา": "ผ่าน", "ยืนกระโดดสูง": "ผ่าน", "ปั่นจักรยานวัดงาน": "ผ่าน" },
    passCount: 6, totalTests: 6, scorePct: 100, testLevel: "ดีมาก", overallGrade: "ดีเยี่ยม", latestRound: "รอบที่ 1", status: "ผ่านเกณฑ์รอบที่ 1", note: "ผ่านการทดสอบรอบแรกสมบูรณ์"
  },
  {
    id: "br-05", order: 5, name: "นางสาวศศิธร สว่างอารมณ์", studentId: "66011406", gender: "หญิง", faculty: "คณะบริหารธุรกิจและนิเทศศาสตร์", sportName: "บริดจ์และหมากกระดาน",
    testMap: { "ปริมาณไขมัน": "ผ่าน", "นั่งงอตัว": "ผ่าน", "แรงบีบมือด้านถนัด": "ผ่าน", "แรงเหยียดขา": "ผ่าน", "ยืนกระโดดสูง": "ผ่าน", "ปั่นจักรยานวัดงาน": "ผ่าน" },
    passCount: 6, totalTests: 6, scorePct: 100, testLevel: "ดีมาก", overallGrade: "ดีเยี่ยม", latestRound: "รอบที่ 1", status: "ผ่านเกณฑ์รอบที่ 1", note: "ผ่านการทดสอบรอบแรกสมบูรณ์"
  }
];

export interface RealFitnessSummaryStats {
  totalTested: number;
  passedCount: number;
  failedCount: number;
  waiverCount: number; // คนที่ยื่นขอความอนุเคราะห์รอบที่ 4
  passRate: number;
  averageScorePct: number;
  gradeCounts: {
    excellent: number;
    good: number;
    fair: number;
    moderate: number;
    failed: number;
  };
  testLevelCounts: {
    excellent: number;
    good: number;
    fair: number;
    low: number;
    veryLow: number;
  };
}

export function computeRealFitnessSummary(records: RealAthleteFitnessRecord[] = REAL_FITNESS_RECORDS): RealFitnessSummaryStats {
  const total = records.length;
  if (total === 0) {
    return {
      totalTested: 0, passedCount: 0, failedCount: 0, waiverCount: 0, passRate: 0, averageScorePct: 0,
      gradeCounts: { excellent: 0, good: 0, fair: 0, moderate: 0, failed: 0 },
      testLevelCounts: { excellent: 0, good: 0, fair: 0, low: 0, veryLow: 0 }
    };
  }

  const passedCount = records.filter(r => r.status.startsWith("ผ่าน")).length;
  const waiverCount = records.filter(r => r.status.includes("ยื่นขอความอนุเคราะห์")).length;
  const failedCount = total - passedCount;
  const passRate = Math.round((passedCount / total) * 100);
  const averageScorePct = Math.round(records.reduce((s, r) => s + r.scorePct, 0) / total);

  const gradeCounts = {
    excellent: records.filter(r => r.overallGrade === "ดีเยี่ยม").length,
    good: records.filter(r => r.overallGrade === "ดีมาก").length,
    fair: records.filter(r => r.overallGrade === "ดี").length,
    moderate: records.filter(r => r.overallGrade === "ปานกลาง").length,
    failed: records.filter(r => r.overallGrade === "ไม่ผ่าน").length,
  };

  const testLevelCounts = {
    excellent: records.filter(r => r.testLevel === "ดีมาก").length,
    good: records.filter(r => r.testLevel === "ดี").length,
    fair: records.filter(r => r.testLevel === "ปานกลาง").length,
    low: records.filter(r => r.testLevel === "ต่ำ").length,
    veryLow: records.filter(r => r.testLevel === "ต่ำมาก").length,
  };

  return {
    totalTested: total,
    passedCount,
    failedCount,
    waiverCount,
    passRate,
    averageScorePct,
    gradeCounts,
    testLevelCounts,
  };
}

export function exportRealFitnessToCSV(sportName: string, records: RealAthleteFitnessRecord[]) {
  const config = REAL_SPORT_CONFIGS[sportName] || REAL_SPORT_CONFIGS["ฟุตซอล"];
  const testHeaders = config.tests;

  const headers = [
    "ลำดับ",
    "รหัสนิสิต",
    "ชื่อ - นามสกุล",
    "เพศ",
    "คณะ",
    "ชนิดกีฬา",
    ...testHeaders,
    "จำนวนสถานีที่ผ่าน",
    "สถานีทั้งหมด",
    "คะแนนรวม (%)",
    "ระดับการทดสอบ",
    "ผลการประเมิน",
    "รอบการทดสอบล่าสุด",
    "สถานะภาพรวม",
    "หมายเหตุ",
  ];

  const csvContent = [
    headers.join(","),
    ...records.map((r) => [
      r.order,
      `"${r.studentId}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.gender}"`,
      `"${r.faculty.replace(/"/g, '""')}"`,
      `"${r.sportName}"`,
      ...testHeaders.map((t) => `"${r.testMap[t] || "-"}"`),
      r.passCount,
      r.totalTests,
      `${r.scorePct}%`,
      `"${r.testLevel}"`,
      `"${r.overallGrade}"`,
      `"${r.latestRound}"`,
      `"${r.status}"`,
      `"${r.note.replace(/"/g, '""')}"`,
    ].join(","))
  ].join("\r\n");

  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `รายงานผลการทดสอบสมรรถภาพ_${sportName}_มพ.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
