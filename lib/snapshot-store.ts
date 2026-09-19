import { requestJson } from "@/lib/phase4-client";
import type { AnalyticsSummary } from "@/lib/analytics";
export type SnapshotInfo = { id:string;title:string;notes:string;createdAt:string;canDelete:boolean;schemaVersion:number };
export type AnalyticsSnapshot = SnapshotInfo & {filters:{competitionId:string|null;sport:string|null};data:AnalyticsSummary};
export async function getSnapshots(){return (await requestJson<{snapshots:SnapshotInfo[]}>("/api/staff/snapshots")).snapshots;}
export async function getSnapshot(id:string){return (await requestJson<{snapshot:AnalyticsSnapshot}>("/api/staff/snapshots/"+id)).snapshot;}
export async function saveSnapshot(input:{title:string;notes:string;competitionId:string;sport:string}){return requestJson("/api/staff/snapshots",input);}
export async function deleteSnapshot(id:string){return requestJson("/api/staff/snapshots/"+id,{},"DELETE");}

