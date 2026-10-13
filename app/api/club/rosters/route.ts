import { api, body, ensure, string } from "@/lib/phase4-server";
import { clubRosterView, saveRoster } from "@/lib/roster-service";
export async function GET(request: Request) {
  return api(request, ["CLUB"], async s => {
    ensure(s.clubId, "ไม่พบชมรม", 403);
    return clubRosterView(s.clubId, string(new URL(request.url).searchParams.get("competitionId"), "competitionId"));
  });
}
export async function POST(request: Request) {
  return api(request, ["CLUB"], async s => saveRoster(s, await body(request)));
}

