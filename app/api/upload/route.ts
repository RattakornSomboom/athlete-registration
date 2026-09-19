import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * POST /api/upload
 * อัปโหลดไฟล์ไปยัง Supabase Storage
 *
 * Request: FormData
 *   - file: File (required)
 *   - bucket: string (default: "documents")
 *   - folder: string (optional, e.g. "photo", "idcard", "studentcard")
 *
 * Response: { url: string, path: string }
 */

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  try {
    const session = await getSession(request as NextRequest);
    if (!session) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "athlete-docs";
    const folder = (formData.get("folder") as string) || "uploads";
    if (bucket !== "athlete-docs" || session.role === "TEAM_OFFICIAL") {
      return NextResponse.json({ error: "กรุณาใช้ช่องทางเอกสารส่วนตัว" }, { status: 403 });
    }

    // ─── Validation ───
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "กรุณาแนบไฟล์ (field name: 'file')" },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `ไม่รองรับไฟล์ประเภท ${file.type} — รองรับเฉพาะ JPEG, PNG, WebP, GIF, PDF`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `ไฟล์มีขนาดเกิน ${MAX_FILE_SIZE / 1024 / 1024} MB`,
        },
        { status: 400 }
      );
    }

    // ─── Generate unique filename ───
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop() || "bin";
    const sanitizedName = file.name
      .replace(/\.[^/.]+$/, "") // remove extension
      .replace(/[^a-zA-Z0-9ก-๙_-]/g, "_") // sanitize
      .substring(0, 50); // limit length

    const filePath = `${folder}/${timestamp}_${sanitizedName}_${randomSuffix}.${extension}`;

    // ─── Upload to Supabase Storage ───
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[Upload Error]", uploadError);
      return NextResponse.json(
        { error: `อัปโหลดไฟล์ไม่สำเร็จ: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // ─── Get public URL ───
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);

    return NextResponse.json(
      {
        message: "อัปโหลดไฟล์สำเร็จ",
        url: publicUrl,
        path: filePath,
        bucket,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/upload]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload
 * ลบไฟล์จาก Supabase Storage
 *
 * Body: { path: string, bucket?: string }
 */
export async function DELETE(request: Request) {
  try {
    const session = await getSession(request as NextRequest);
    if (!session) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { path, bucket = "athlete-docs" } = body;
    if (bucket !== "athlete-docs" || session.role === "TEAM_OFFICIAL") {
      return NextResponse.json({ error: "ไม่มีสิทธิ์ใช้ bucket นี้" }, { status: 403 });
    }

    if (!path) {
      return NextResponse.json(
        { error: "กรุณาระบุ path ของไฟล์ที่ต้องการลบ" },
        { status: 400 }
      );
    }

    // Ownership check: ATHLETEs can only delete their own files
    // File path format: uploads/{timestamp}_{sanitizedName}_{randomSuffix}.{ext}
    // We scope ATHLETE to only the athlete-docs bucket and verify via application ownership
    if (session.role === "ATHLETE") {
      // ATHLETE may only delete from athlete-docs bucket
      if (bucket !== "athlete-docs") {
        return NextResponse.json(
          { error: "ไม่มีสิทธิ์ลบไฟล์จาก bucket นี้" },
          { status: 403 }
        );
      }
      // Verify the file path is referenced by one of this athlete's own applications
      const { prisma } = await import("@/lib/prisma");
      const publicUrl = path.startsWith("http")
        ? path
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
      const ownsFile = await prisma.application.findFirst({
        where: {
          userId: session.id,
          OR: [
            { photoFileUrl: publicUrl },
            { idCardFileUrl: publicUrl },
            { studentCardFileUrl: publicUrl },
            { studentCertFileUrl: publicUrl },
            { upAcademyFileUrl: publicUrl },
            { fitnessTestFileUrl: publicUrl },
            { noClubFileUrl: publicUrl },
          ],
        },
      });
      if (!ownsFile) {
        return NextResponse.json(
          { error: "ไม่มีสิทธิ์ลบไฟล์ของผู้อื่น" },
          { status: 403 }
        );
      }
    }

    const { error: deleteError } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path]);

    if (deleteError) {
      console.error("[Delete Error]", deleteError);
      return NextResponse.json(
        { error: `ลบไฟล์ไม่สำเร็จ: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "ลบไฟล์สำเร็จ" });
  } catch (error) {
    console.error("[DELETE /api/upload]", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
