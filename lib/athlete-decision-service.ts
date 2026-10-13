export type ApplicationDecisionTarget = {
  status: string;
  squadType?: string | null;
  rosterItem?: { squadType?: string | null } | null;
  statusHistory?: Array<{ status: string }>;
  hasRosterItem?: boolean;
};

export function canAthleteCancelApplication(app: ApplicationDecisionTarget): boolean {
  const inRoster = Boolean(app.rosterItem || app.hasRosterItem);
  return (app.status === "SUBMITTED" || app.status === "CLUB_REJECTED") && !inRoster;
}

export function canAthleteEditApplication(app: ApplicationDecisionTarget): boolean {
  const inRoster = Boolean(app.rosterItem || app.hasRosterItem);
  return (app.status === "SUBMITTED" || app.status === "CLUB_REJECTED") && !inRoster;
}

export function getAthleteDecisionStatus(app: ApplicationDecisionTarget): "NOT_ELIGIBLE" | "PENDING" | "CONFIRMED" | "DECLINED" {
  if (app.status !== "FINAL_SELECTED") {
    return "NOT_ELIGIBLE";
  }
  const decision = app.statusHistory?.findLast?.(h => h.status === "ATHLETE_CONFIRMED" || h.status === "ATHLETE_DECLINED")
    ?? [...(app.statusHistory ?? [])].reverse().find(h => h.status === "ATHLETE_CONFIRMED" || h.status === "ATHLETE_DECLINED");
  if (decision?.status === "ATHLETE_CONFIRMED") return "CONFIRMED";
  if (decision?.status === "ATHLETE_DECLINED") return "DECLINED";
  return "PENDING";
}

export function canAthleteDecide(app: ApplicationDecisionTarget): boolean {
  return getAthleteDecisionStatus(app) === "PENDING";
}