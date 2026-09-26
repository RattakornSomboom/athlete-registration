// lib/thailand-addresses.ts
// ฐานข้อมูลลำดับชั้น จังหวัด -> อำเภอ -> ตำบล -> รหัสไปรษณีย์
// ครอบคลุม 77 จังหวัดทั่วประเทศไทย โดยมีรายละเอียดลึกระดับอำเภอ/ตำบลสำหรับจังหวัดหลักและภาคเหนือ (ม.พะเยา)

export type TambonData = {
  name: string;
  postalCode: string;
};

export type AmphureData = {
  name: string;
  tambons: TambonData[];
};

export type ProvinceData = {
  name: string;
  amphures: AmphureData[];
};

export const THAILAND_PROVINCES: ProvinceData[] = [
  {
    name: "พะเยา",
    amphures: [
      {
        name: "เมืองพะเยา",
        tambons: [
          { name: "แม่กา", postalCode: "56000" },
          { name: "เวียง", postalCode: "56000" },
          { name: "แม่ต๋ำ", postalCode: "56000" },
          { name: "ท่าจำปี", postalCode: "56000" },
          { name: "แม่ใส", postalCode: "56000" },
          { name: "บ้านต๋อม", postalCode: "56000" },
          { name: "แม่ปืม", postalCode: "56000" },
          { name: "จำป่าหวาย", postalCode: "56000" },
          { name: "แม่นาเรือ", postalCode: "56000" },
          { name: "บ้านสาง", postalCode: "56000" },
          { name: "บ้านตุ่น", postalCode: "56000" },
          { name: "บ้านใหม่", postalCode: "56000" },
          { name: "ท่าสะแล", postalCode: "56000" },
        ],
      },
      {
        name: "จุน",
        tambons: [
          { name: "จุน", postalCode: "56150" },
          { name: "ลอ", postalCode: "56150" },
          { name: "ห้วยข้าวก่ำ", postalCode: "56150" },
          { name: "หงส์หิน", postalCode: "56150" },
          { name: "ทุ่งรวงทอง", postalCode: "56150" },
          { name: "พระธาตุขิงแกง", postalCode: "56150" },
          { name: "ห้วยยางขาม", postalCode: "56150" },
        ],
      },
      {
        name: "เชียงคำ",
        tambons: [
          { name: "หย่วน", postalCode: "56110" },
          { name: "น้ำแวน", postalCode: "56110" },
          { name: "เวียง", postalCode: "56110" },
          { name: "ฝายกวาง", postalCode: "56110" },
          { name: "เจดีย์คำ", postalCode: "56110" },
          { name: "ร่มเย็น", postalCode: "56110" },
          { name: "เชียงบาน", postalCode: "56110" },
          { name: "แม่ลาว", postalCode: "56110" },
          { name: "อ่างทอง", postalCode: "56110" },
          { name: "ทุ่งผาสุข", postalCode: "56110" },
        ],
      },
      {
        name: "เชียงม่วน",
        tambons: [
          { name: "เชียงม่วน", postalCode: "56160" },
          { name: "บ้านมาง", postalCode: "56160" },
          { name: "สระ", postalCode: "56160" },
        ],
      },
      {
        name: "ดอกคำใต้",
        tambons: [
          { name: "ดอกคำใต้", postalCode: "56120" },
          { name: "ดอนศรีชุม", postalCode: "56120" },
          { name: "บ้านถ้ำ", postalCode: "56120" },
          { name: "บ้านปิน", postalCode: "56120" },
          { name: "ห้วยลาน", postalCode: "56120" },
          { name: "สันโค้ง", postalCode: "56120" },
          { name: "ป่าซาง", postalCode: "56120" },
          { name: "หนองหล่ม", postalCode: "56120" },
          { name: "ดงสุวรรณ", postalCode: "56120" },
          { name: "บุญเกิด", postalCode: "56120" },
          { name: "สว่างอารมณ์", postalCode: "56120" },
          { name: "คือเวียง", postalCode: "56120" },
        ],
      },
      {
        name: "ปง",
        tambons: [
          { name: "ปง", postalCode: "56140" },
          { name: "ควร", postalCode: "56140" },
          { name: "ออย", postalCode: "56140" },
          { name: "งิม", postalCode: "56140" },
          { name: "นาปรัง", postalCode: "56140" },
          { name: "ขุนควร", postalCode: "56140" },
          { name: "ผาช้างน้อย", postalCode: "56140" },
        ],
      },
      {
        name: "แม่ใจ",
        tambons: [
          { name: "แม่ใจ", postalCode: "56130" },
          { name: "ศรีถ้อย", postalCode: "56130" },
          { name: "แม่สุก", postalCode: "56130" },
          { name: "ป่าแฝก", postalCode: "56130" },
          { name: "บ้านเหล่า", postalCode: "56130" },
          { name: "เจริญราษฎร์", postalCode: "56130" },
        ],
      },
      {
        name: "ภูซาง",
        tambons: [
          { name: "สบบง", postalCode: "56110" },
          { name: "ภูซาง", postalCode: "56110" },
          { name: "ป่าสัก", postalCode: "56110" },
          { name: "ทุ่งกล้วย", postalCode: "56110" },
          { name: "เชียงแรง", postalCode: "56110" },
        ],
      },
      {
        name: "ภูกามยาว",
        tambons: [
          { name: "ห้วยแก้ว", postalCode: "56000" },
          { name: "ดงเจน", postalCode: "56000" },
          { name: "แม่อิง", postalCode: "56000" },
        ],
      },
    ],
  },
  {
    name: "เชียงใหม่",
    amphures: [
      {
        name: "เมืองเชียงใหม่",
        tambons: [
          { name: "ศรีภูมิ", postalCode: "50200" },
          { name: "พระสิงห์", postalCode: "50200" },
          { name: "หายยา", postalCode: "50100" },
          { name: "ช้างม่อย", postalCode: "50300" },
          { name: "ช้างคลาน", postalCode: "50100" },
          { name: "วัดเกต", postalCode: "50000" },
          { name: "ช้างเผือก", postalCode: "50300" },
          { name: "สุเทพ", postalCode: "50200" },
          { name: "แม่เหียะ", postalCode: "50100" },
          { name: "ป่าแดด", postalCode: "50100" },
          { name: "หนองหอย", postalCode: "50000" },
          { name: "ท่าศาลา", postalCode: "50000" },
          { name: "หนองป่าครั่ง", postalCode: "50000" },
          { name: "ฟ้าฮ่าม", postalCode: "50000" },
          { name: "ป่าตัน", postalCode: "50300" },
          { name: "สันผีเสื้อ", postalCode: "50300" },
        ],
      },
      {
        name: "สันทราย",
        tambons: [
          { name: "สันทรายหลวง", postalCode: "50210" },
          { name: "สันทรายน้อย", postalCode: "50210" },
          { name: "หนองจ๊อม", postalCode: "50210" },
          { name: "หนองหาร", postalCode: "50290" },
          { name: "แม่แฝก", postalCode: "50290" },
          { name: "ป่าไผ่", postalCode: "50210" },
          { name: "เมืองเล็น", postalCode: "50210" },
        ],
      },
      {
        name: "หางดง",
        tambons: [
          { name: "หางดง", postalCode: "50230" },
          { name: "หนองแก๋ว", postalCode: "50230" },
          { name: "หารแก้ว", postalCode: "50230" },
          { name: "น้ำแพร่", postalCode: "50230" },
          { name: "สันผักหวาน", postalCode: "50230" },
        ],
      },
      {
        name: "แม่ริม",
        tambons: [
          { name: "ริมใต้", postalCode: "50180" },
          { name: "ริมเหนือ", postalCode: "50180" },
          { name: "สันโป่ง", postalCode: "50180" },
          { name: "ขี้เหล็ก", postalCode: "50180" },
          { name: "แม่แรม", postalCode: "50180" },
          { name: "ดอนแก้ว", postalCode: "50180" },
        ],
      },
      {
        name: "สารภี",
        tambons: [
          { name: "ยางเนิ้ง", postalCode: "50140" },
          { name: "สารภี", postalCode: "50140" },
          { name: "ชมภู", postalCode: "50140" },
          { name: "ช้างผล้ำ", postalCode: "50140" },
          { name: "ท่าวังตาล", postalCode: "50140" },
        ],
      },
      {
        name: "สันกำแพง",
        tambons: [
          { name: "สันกำแพง", postalCode: "50130" },
          { name: "ทรายมูล", postalCode: "50130" },
          { name: "ร้องวัวแดง", postalCode: "50130" },
          { name: "บวกค้าง", postalCode: "50130" },
          { name: "ต้นเปา", postalCode: "50130" },
        ],
      },
      {
        name: "ดอยสะเก็ด",
        tambons: [
          { name: "เชิงดอย", postalCode: "50220" },
          { name: "ป่าป้อง", postalCode: "50220" },
          { name: "สง่าบ้าน", postalCode: "50220" },
          { name: "สำราญราษฎร์", postalCode: "50220" },
        ],
      },
      {
        name: "จอมทอง",
        tambons: [
          { name: "บ้านหลวง", postalCode: "50160" },
          { name: "ข่วงเปา", postalCode: "50160" },
          { name: "สบเตี๊ยะ", postalCode: "50160" },
          { name: "บ้านแปะ", postalCode: "50160" },
          { name: "ดอยแก้ว", postalCode: "50160" },
        ],
      },
      {
        name: "ฝาง",
        tambons: [
          { name: "เวียง", postalCode: "50110" },
          { name: "ม่อนปิ่น", postalCode: "50110" },
          { name: "แม่งอน", postalCode: "50320" },
          { name: "โป่งน้ำร้อน", postalCode: "50110" },
        ],
      },
    ],
  },
  {
    name: "เชียงราย",
    amphures: [
      {
        name: "เมืองเชียงราย",
        tambons: [
          { name: "เวียง", postalCode: "57000" },
          { name: "รอบเวียง", postalCode: "57000" },
          { name: "บ้านดู่", postalCode: "57100" },
          { name: "นางแล", postalCode: "57100" },
          { name: "แม่กรณ์", postalCode: "57000" },
          { name: "ท่าสาย", postalCode: "57000" },
          { name: "ริมกก", postalCode: "57100" },
          { name: "ดอยฮาง", postalCode: "57000" },
        ],
      },
      {
        name: "แม่สาย",
        tambons: [
          { name: "แม่สาย", postalCode: "57130" },
          { name: "เวียงพางคำ", postalCode: "57130" },
          { name: "เกาะช้าง", postalCode: "57130" },
          { name: "โป่งผา", postalCode: "57130" },
          { name: "โป่งงาม", postalCode: "57130" },
        ],
      },
      {
        name: "แม่จัน",
        tambons: [
          { name: "แม่จัน", postalCode: "57110" },
          { name: "ป่าซาง", postalCode: "57110" },
          { name: "สันทราย", postalCode: "57110" },
          { name: "แม่คำ", postalCode: "57240" },
        ],
      },
      {
        name: "พาน",
        tambons: [
          { name: "เมืองพาน", postalCode: "57120" },
          { name: "ม่วงคำ", postalCode: "57120" },
          { name: "สันกลาง", postalCode: "57120" },
          { name: "ธารทอง", postalCode: "57120" },
        ],
      },
      {
        name: "เทิง",
        tambons: [
          { name: "เวียง", postalCode: "57160" },
          { name: "งิ้ว", postalCode: "57160" },
          { name: "ปล้อง", postalCode: "57160" },
          { name: "แม่ลอย", postalCode: "57230" },
        ],
      },
      {
        name: "เชียงของ",
        tambons: [
          { name: "เวียง", postalCode: "57140" },
          { name: "สถาน", postalCode: "57140" },
          { name: "ครึ่ง", postalCode: "57140" },
          { name: "บุญเรือง", postalCode: "57140" },
        ],
      },
    ],
  },
  {
    name: "ลำปาง",
    amphures: [
      {
        name: "เมืองลำปาง",
        tambons: [
          { name: "เวียงเหนือ", postalCode: "52000" },
          { name: "หัวเวียง", postalCode: "52000" },
          { name: "สวนดอก", postalCode: "52100" },
          { name: "สบตุ๋ย", postalCode: "52100" },
          { name: "พระบาท", postalCode: "52000" },
          { name: "ชมพู", postalCode: "52100" },
          { name: "พิชัย", postalCode: "52000" },
        ],
      },
      {
        name: "เกาะคา",
        tambons: [
          { name: "ศาลา", postalCode: "52130" },
          { name: "เกาะคา", postalCode: "52130" },
          { name: "ลำปางหลวง", postalCode: "52130" },
          { name: "นาแก้ว", postalCode: "52130" },
        ],
      },
      {
        name: "แม่เมาะ",
        tambons: [
          { name: "บ้านดง", postalCode: "52220" },
          { name: "แม่เมาะ", postalCode: "52220" },
          { name: "สบป้าด", postalCode: "52220" },
        ],
      },
      {
        name: "เถิน",
        tambons: [
          { name: "ล้อมแรด", postalCode: "52160" },
          { name: "แม่ถอด", postalCode: "52160" },
          { name: "เถินบุรี", postalCode: "52230" },
        ],
      },
    ],
  },
  {
    name: "น่าน",
    amphures: [
      {
        name: "เมืองน่าน",
        tambons: [
          { name: "ในเวียง", postalCode: "55000" },
          { name: "บ่อสวก", postalCode: "55000" },
          { name: "ผาสิงห์", postalCode: "55000" },
          { name: "ถืมตอง", postalCode: "55000" },
          { name: "ดู่ใต้", postalCode: "55000" },
          { name: "กองควาย", postalCode: "55000" },
        ],
      },
      {
        name: "ปัว",
        tambons: [
          { name: "ปัว", postalCode: "55120" },
          { name: "วรนคร", postalCode: "55120" },
          { name: "ศิลาแลง", postalCode: "55120" },
          { name: "สถาน", postalCode: "55120" },
        ],
      },
      {
        name: "ท่าวังผา",
        tambons: [
          { name: "ริม", postalCode: "55140" },
          { name: "ป่าคา", postalCode: "55140" },
          { name: "ท่าวังผา", postalCode: "55140" },
        ],
      },
      {
        name: "เวียงสา",
        tambons: [
          { name: "กลางเวียง", postalCode: "55110" },
          { name: "ขึ่ง", postalCode: "55110" },
          { name: "ไหล่น่าน", postalCode: "55110" },
        ],
      },
    ],
  },
  {
    name: "แพร่",
    amphures: [
      {
        name: "เมืองแพร่",
        tambons: [
          { name: "ในเวียง", postalCode: "54000" },
          { name: "นาจักร", postalCode: "54000" },
          { name: "ทุ่งกวาว", postalCode: "54000" },
          { name: "ร่องฟอง", postalCode: "54000" },
          { name: "เหมืองหม้อ", postalCode: "54000" },
          { name: "แม่หล่าย", postalCode: "54000" },
        ],
      },
      {
        name: "เด่นชัย",
        tambons: [
          { name: "เด่นชัย", postalCode: "54110" },
          { name: "แม่จั๊วะ", postalCode: "54110" },
          { name: "ไทรย้อย", postalCode: "54110" },
        ],
      },
      {
        name: "สูงเม่น",
        tambons: [
          { name: "สูงเม่น", postalCode: "54130" },
          { name: "น้ำชำ", postalCode: "54130" },
          { name: "หัวฝาย", postalCode: "54130" },
          { name: "ดอนมูล", postalCode: "54130" },
        ],
      },
    ],
  },
  {
    name: "ลำพูน",
    amphures: [
      {
        name: "เมืองลำพูน",
        tambons: [
          { name: "ในเมือง", postalCode: "51000" },
          { name: "เหมืองง่า", postalCode: "51000" },
          { name: "อุโมงค์", postalCode: "51150" },
          { name: "หนองช้างคืน", postalCode: "51150" },
          { name: "บ้านกลาง", postalCode: "51000" },
          { name: "เวียงยอง", postalCode: "51000" },
          { name: "ริมปิง", postalCode: "51000" },
        ],
      },
      {
        name: "ป่าซาง",
        tambons: [
          { name: "ป่าซาง", postalCode: "51120" },
          { name: "ปากบ่อง", postalCode: "51120" },
          { name: "ม่วงน้อย", postalCode: "51120" },
        ],
      },
    ],
  },
  {
    name: "แม่ฮ่องสอน",
    amphures: [
      {
        name: "เมืองแม่ฮ่องสอน",
        tambons: [
          { name: "จองคำ", postalCode: "58000" },
          { name: "ปางหมู", postalCode: "58000" },
          { name: "ผาบ่อง", postalCode: "58000" },
          { name: "หมอกจำแป่", postalCode: "58000" },
        ],
      },
      {
        name: "ปาย",
        tambons: [
          { name: "เวียงใต้", postalCode: "58130" },
          { name: "เวียงเหนือ", postalCode: "58130" },
          { name: "แม่นาเติง", postalCode: "58130" },
        ],
      },
    ],
  },
  {
    name: "พิษณุโลก",
    amphures: [
      {
        name: "เมืองพิษณุโลก",
        tambons: [
          { name: "ในเมือง", postalCode: "65000" },
          { name: "วังน้ำคู้", postalCode: "65000" },
          { name: "บึงพระ", postalCode: "65000" },
          { name: "อรัญญิก", postalCode: "65000" },
          { name: "หัวรอ", postalCode: "65000" },
          { name: "สมอแข", postalCode: "65000" },
          { name: "ท่าทอง", postalCode: "65000" },
        ],
      },
      {
        name: "วังทอง",
        tambons: [
          { name: "วังทอง", postalCode: "65130" },
          { name: "พันชาลี", postalCode: "65130" },
          { name: "แก่งโสภา", postalCode: "65220" },
        ],
      },
    ],
  },
  {
    name: "กรุงเทพมหานคร",
    amphures: [
      {
        name: "พระนคร",
        tambons: [
          { name: "พระบรมมหาราชวัง", postalCode: "10200" },
          { name: "วังบูรพาภิรมย์", postalCode: "10200" },
          { name: "วัดราชบพิธ", postalCode: "10200" },
          { name: "ศาลเจ้าพ่อเสือ", postalCode: "10200" },
          { name: "เสาชิงช้า", postalCode: "10200" },
          { name: "บวรนิเวศ", postalCode: "10200" },
          { name: "ตลาดยอด", postalCode: "10200" },
          { name: "ชนะสงคราม", postalCode: "10200" },
        ],
      },
      {
        name: "ดุสิต",
        tambons: [
          { name: "ดุสิต", postalCode: "10300" },
          { name: "วชิรพยาบาล", postalCode: "10300" },
          { name: "สวนจิตรลดา", postalCode: "10300" },
          { name: "สี่แยกมหานาค", postalCode: "10300" },
          { name: "ถนนนครไชยศรี", postalCode: "10300" },
        ],
      },
      {
        name: "ปทุมวัน",
        tambons: [
          { name: "รองเมือง", postalCode: "10330" },
          { name: "วังใหม่", postalCode: "10330" },
          { name: "ปทุมวัน", postalCode: "10330" },
          { name: "ลุมพินี", postalCode: "10330" },
        ],
      },
      {
        name: "จตุจักร",
        tambons: [
          { name: "ลาดยาว", postalCode: "10900" },
          { name: "เสนานิคม", postalCode: "10900" },
          { name: "จันทรเกษม", postalCode: "10900" },
          { name: "จอมพล", postalCode: "10900" },
          { name: "จตุจักร", postalCode: "10900" },
        ],
      },
      {
        name: "บางซื่อ",
        tambons: [
          { name: "บางซื่อ", postalCode: "10800" },
          { name: "วงศ์สว่าง", postalCode: "10800" },
        ],
      },
      {
        name: "บางเขน",
        tambons: [
          { name: "อนุสาวรีย์", postalCode: "10220" },
          { name: "ท่าแร้ง", postalCode: "10220" },
        ],
      },
    ],
  },
  {
    name: "อุตรดิตถ์",
    amphures: [
      {
        name: "เมืองอุตรดิตถ์",
        tambons: [
          { name: "ท่าอิฐ", postalCode: "53000" },
          { name: "ท่าเสา", postalCode: "53000" },
          { name: "บ้านเกาะ", postalCode: "53000" },
          { name: "ป่าเซ่า", postalCode: "53000" },
        ],
      },
      {
        name: "ลับแล",
        tambons: [
          { name: "ศรีพนมมาศ", postalCode: "53130" },
          { name: "แม่พูล", postalCode: "53130" },
          { name: "ทุ่งยั้ง", postalCode: "53210" },
        ],
      },
    ],
  },
  {
    name: "สุโขทัย",
    amphures: [
      {
        name: "เมืองสุโขทัย",
        tambons: [
          { name: "ธานี", postalCode: "64000" },
          { name: "บ้านสวน", postalCode: "64220" },
          { name: "เมืองเก่า", postalCode: "64210" },
          { name: "ปากแคว", postalCode: "64000" },
        ],
      },
      {
        name: "สวรรคโลก",
        tambons: [
          { name: "เมืองสวรรคโลก", postalCode: "64110" },
          { name: "ในเมือง", postalCode: "64110" },
          { name: "คลองยาง", postalCode: "64110" },
        ],
      },
    ],
  },
  {
    name: "ตาก",
    amphures: [
      {
        name: "เมืองตาก",
        tambons: [
          { name: "ระแหง", postalCode: "63000" },
          { name: "หนองหลวง", postalCode: "63000" },
          { name: "เชียงเงิน", postalCode: "63000" },
          { name: "น้ำรึม", postalCode: "63000" },
        ],
      },
      {
        name: "แม่สอด",
        tambons: [
          { name: "แม่สอด", postalCode: "63110" },
          { name: "แม่ปะ", postalCode: "63110" },
          { name: "ท่าสายลวด", postalCode: "63110" },
        ],
      },
    ],
  },
  {
    name: "นครสวรรค์",
    amphures: [
      {
        name: "เมืองนครสวรรค์",
        tambons: [
          { name: "ปากน้ำโพ", postalCode: "60000" },
          { name: "นครสวรรค์ตก", postalCode: "60000" },
          { name: "นครสวรรค์ออก", postalCode: "60000" },
          { name: "วัดไทร", postalCode: "60000" },
        ],
      },
    ],
  },
  {
    name: "กำแพงเพชร",
    amphures: [
      {
        name: "เมืองกำแพงเพชร",
        tambons: [
          { name: "ในเมือง", postalCode: "62000" },
          { name: "ไตรตรึงษ์", postalCode: "62160" },
          { name: "อ่างทอง", postalCode: "62000" },
          { name: "นครชุม", postalCode: "62000" },
        ],
      },
    ],
  },
  {
    name: "พิจิตร",
    amphures: [
      {
        name: "เมืองพิจิตร",
        tambons: [
          { name: "ในเมือง", postalCode: "66000" },
          { name: "ไผ่ขวาง", postalCode: "66000" },
          { name: "คลองคะเชนทร์", postalCode: "66000" },
        ],
      },
    ],
  },
  {
    name: "เพชรบูรณ์",
    amphures: [
      {
        name: "เมืองเพชรบูรณ์",
        tambons: [
          { name: "ในเมือง", postalCode: "67000" },
          { name: "สะเดียง", postalCode: "67000" },
          { name: "นางั่ว", postalCode: "67000" },
        ],
      },
      {
        name: "หล่มสัก",
        tambons: [
          { name: "หล่มสัก", postalCode: "67110" },
          { name: "วัดป่า", postalCode: "67110" },
        ],
      },
    ],
  },
  {
    name: "อุทัยธานี",
    amphures: [
      {
        name: "เมืองอุทัยธานี",
        tambons: [
          { name: "อุทัยใหม่", postalCode: "61000" },
          { name: "น้ำซึม", postalCode: "61000" },
          { name: "สะแกกรัง", postalCode: "61000" },
        ],
      },
    ],
  },
  {
    name: "ขอนแก่น",
    amphures: [
      {
        name: "เมืองขอนแก่น",
        tambons: [
          { name: "ในเมือง", postalCode: "40000" },
          { name: "ศิลา", postalCode: "40000" },
          { name: "บ้านเป็ด", postalCode: "40000" },
          { name: "พระลับ", postalCode: "40000" },
        ],
      },
    ],
  },
  {
    name: "นครราชสีมา",
    amphures: [
      {
        name: "เมืองนครราชสีมา",
        tambons: [
          { name: "ในเมือง", postalCode: "30000" },
          { name: "โพธิ์กลาง", postalCode: "30000" },
          { name: "หนองบัวศาลา", postalCode: "30000" },
          { name: "หัวทะเล", postalCode: "30000" },
        ],
      },
    ],
  },
  {
    name: "อุบลราชธานี",
    amphures: [
      {
        name: "เมืองอุบลราชธานี",
        tambons: [
          { name: "ในเมือง", postalCode: "34000" },
          { name: "อุบล", postalCode: "34000" },
          { name: "ขามใหญ่", postalCode: "34000" },
          { name: "แจระแม", postalCode: "34000" },
        ],
      },
    ],
  },
  {
    name: "อุดรธานี",
    amphures: [
      {
        name: "เมืองอุดรธานี",
        tambons: [
          { name: "หมากแข้ง", postalCode: "41000" },
          { name: "หนองบัว", postalCode: "41000" },
          { name: "บ้านเลื่อม", postalCode: "41000" },
        ],
      },
    ],
  },
  {
    name: "ชลบุรี",
    amphures: [
      {
        name: "เมืองชลบุรี",
        tambons: [
          { name: "บางปลาสร้อย", postalCode: "20000" },
          { name: "แสนสุข", postalCode: "20130" },
          { name: "บ้านสวน", postalCode: "20000" },
          { name: "เสม็ด", postalCode: "20000" },
        ],
      },
      {
        name: "บางละมุง (พัทยา)",
        tambons: [
          { name: "หนองปรือ", postalCode: "20150" },
          { name: "นาเกลือ", postalCode: "20150" },
          { name: "บางละมุง", postalCode: "20150" },
        ],
      },
    ],
  },
  {
    name: "นนทบุรี",
    amphures: [
      {
        name: "เมืองนนทบุรี",
        tambons: [
          { name: "สวนใหญ่", postalCode: "11000" },
          { name: "ตลาดขวัญ", postalCode: "11000" },
          { name: "บางเขน", postalCode: "11000" },
          { name: "ท่าทราย", postalCode: "11000" },
        ],
      },
      {
        name: "ปากเกร็ด",
        tambons: [
          { name: "ปากเกร็ด", postalCode: "11120" },
          { name: "บางพูด", postalCode: "11120" },
          { name: "คลองเกลือ", postalCode: "11120" },
        ],
      },
    ],
  },
  {
    name: "ปทุมธานี",
    amphures: [
      {
        name: "เมืองปทุมธานี",
        tambons: [
          { name: "บางปรอก", postalCode: "12000" },
          { name: "บ้านกลาง", postalCode: "12000" },
          { name: "บ้านกระแชง", postalCode: "12000" },
        ],
      },
      {
        name: "คลองหลวง",
        tambons: [
          { name: "คลองหนึ่ง", postalCode: "12120" },
          { name: "คลองสอง", postalCode: "12120" },
        ],
      },
    ],
  },
  {
    name: "สงขลา",
    amphures: [
      {
        name: "เมืองสงขลา",
        tambons: [
          { name: "บ่อยาง", postalCode: "90000" },
          { name: "เขารูปช้าง", postalCode: "90000" },
        ],
      },
      {
        name: "หาดใหญ่",
        tambons: [
          { name: "หาดใหญ่", postalCode: "90110" },
          { name: "คอหงส์", postalCode: "90110" },
          { name: "ควนลัง", postalCode: "90110" },
        ],
      },
    ],
  },
  {
    name: "ภูเก็ต",
    amphures: [
      {
        name: "เมืองภูเก็ต",
        tambons: [
          { name: "ตลาดใหญ่", postalCode: "83000" },
          { name: "ตลาดเหนือ", postalCode: "83000" },
          { name: "วิชิต", postalCode: "83000" },
          { name: "ฉลอง", postalCode: "83130" },
          { name: "ราไวย์", postalCode: "83130" },
        ],
      },
      {
        name: "กะทู้",
        tambons: [
          { name: "กะทู้", postalCode: "83120" },
          { name: "ป่าตอง", postalCode: "83150" },
          { name: "กมลา", postalCode: "83150" },
        ],
      },
    ],
  },
];

// รายชื่อจังหวัดอื่นๆ ทั่วประเทศ เพื่อให้มีครบทั้ง 77 จังหวัด
export const ALL_THAI_PROVINCES: string[] = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร",
  "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท",
  "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง",
  "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม",
  "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส",
  "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์",
  "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา",
  "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์",
  "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน",
  "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง",
  "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย",
  "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ",
  "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี",
  "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย",
  "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์",
  "อุทัยธานี", "อุบลราชธานี"
].sort((a, b) => a.localeCompare(b, "th"));

// ฟังก์ชันดึงรายชื่ออำเภอของจังหวัด
export function getAmphuresByProvince(provinceName: string): AmphureData[] {
  const found = THAILAND_PROVINCES.find((p) => p.name === provinceName);
  if (found && found.amphures.length > 0) {
    return found.amphures;
  }
  // ถ้าเป็นจังหวัดนอกเหนือจากลิสต์ละเอียด ให้มี อำเภอเมือง เป็นค่าเริ่มต้น
  return [
    {
      name: `เมือง${provinceName}`,
      tambons: [
        { name: "ในเมือง", postalCode: "" },
        { name: "รอบเมือง", postalCode: "" },
      ],
    },
  ];
}

// ฟังก์ชันดึงรายชื่อตำบลของอำเภอในจังหวัด
export function getTambonsByAmphure(provinceName: string, amphureName: string): TambonData[] {
  const amphures = getAmphuresByProvince(provinceName);
  const found = amphures.find((a) => a.name === amphureName);
  if (found && found.tambons.length > 0) {
    return found.tambons;
  }
  return [
    { name: "ในเมือง", postalCode: "" },
    { name: "ตำบล 1", postalCode: "" },
  ];
}
