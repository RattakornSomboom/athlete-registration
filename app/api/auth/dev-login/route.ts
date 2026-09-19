import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role } = body;
    
    // Convert dev roles to JWT roles
    let jwtRole = "ATHLETE";
    if (role === "club") jwtRole = "CLUB";
    if (role === "staff") jwtRole = "STAFF";
    if (role === "admin") jwtRole = "ADMIN";
    if (role === "superadmin") jwtRole = "SUPERADMIN";

    const token = signToken({
      id: "dev-user-id",
      role: jwtRole as any,
      studentId: "66000000", // fake student id
      clubId: role === "club" ? "clm2xt6j50000aabc12345678" : undefined,
    });

    const response = NextResponse.json({ message: "Dev Login Success" });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 24 * 60 * 60,
    });
    
    response.cookies.set("role", role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Failed to dev login" }, { status: 500 });
  }
}
