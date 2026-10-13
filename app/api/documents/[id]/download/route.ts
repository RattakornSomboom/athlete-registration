import { GET as getDocument } from "../route";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const response = await getDocument(request, context);
  if (!response.ok) return response;
  const data: { url: string } = await response.json();
  return new Response(null, { status: 302, headers: { Location: data.url, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
}
