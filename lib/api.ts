export const apiLogin = async (email: string, password: string) => {
  // จำลองการรอ API
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // จำลอง Login ไม่สำเร็จ
  if (password !== "123456") {
    throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  }

  // Staff
  if (email === "staff@up.ac.th") {
    return {
      token: "mock-staff-token",
      role: "staff",
      user: {
        email,
        name: "เจ้าหน้าที่ระบบ",
      },
    };
  }

  // Club
  if (email === "club@up.ac.th") {
    return {
      token: "mock-club-token",
      role: "club",
      user: {
        email,
        name: "ผู้จัดการชมรมกีฬา",
      },
    };
  }

  // Athlete (Default)
  return {
    token: "mock-athlete-token",
    role: "athlete",
    user: {
      email,
      name: "นักกีฬา",
    },
  };
};