import { POST as upload } from "@/app/api/documents/route";
import { DELETE as remove } from "@/app/api/documents/[id]/route";
import { documentReference, documentId } from "@/lib/athlete-document-policy";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
  const response = await upload(request);
  if (!response.ok) return response;
  const { document }: { document: { id: string } } = await response.json();
  return NextResponse.json({ url: documentReference(document.id), path: documentReference(document.id) }, { status: 201 });
}
export async function DELETE(request: Request) {
  let data: unknown;
  try { data = await request.json(); } catch { return NextResponse.json({ error: "JSON ไม่ถูกต้อง" }, { status: 400 }); }
  const id = documentId(data && typeof data === "object" && "path" in data ? data.path : null);
  if (!id) return NextResponse.json({ error: "ลบได้เฉพาะเอกสารส่วนตัวผ่านรหัสเอกสาร" }, { status: 400 });
  return remove(request, { params: Promise.resolve({ id }) });
}
