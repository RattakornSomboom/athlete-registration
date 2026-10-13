# FF frontend integration

Date: 2026-10-03
Source: D:/BBN/FF
Destination: D:/BBN/athlete-registration

## Merge strategy

Keep the destination's existing API-backed functionality and in-progress changes. Import presentation changes selectively; never replace server authentication, Prisma services or document authorization with FF's demo stores. No dependency or schema changes.

## Area mapping

| Area | Integration decision |
| --- | --- |
| Landing page and public images | Already present; all seven image hashes match. Keep Next Image and existing destinations. |
| Global typography and branding | Bring in Prompt 300-700, Thai/Latin, FF font stack and SMED metadata. Keep existing navigation. |
| Login/signup | Keep destination /api/auth/login and /api/auth/register flows. Do not copy FF role cookies or mock tokens. |
| Athlete registration/status | Keep destination /api/applications, /api/documents and server-validated registration. |
| Club competitions/athletes/review | Keep existing club-scoped endpoints and persisted roster editor. |
| Club tracking | Add API-backed /club/tracking adapted to actual roster/application statuses, not simulated per-document approvals. |
| Club activities/requests | Keep existing /api/activities and /api/clubs/requests integrations. |
| Staff applications/analytics/settings | Keep existing authenticated APIs and shared review components; no mock applicants or counts. |
| Team officials | Keep /api/team-official/applications and existing shared OfficialReview component. |
| FF /dev and mock stores | Excluded intentionally. |

## Tracking behavior

- Select a competition to load the authenticated club's roster.
- Display actual roster status, starter/reserve counts and application statuses.
- Filter by the actual statuses returned; no hardcoded competition, club or athlete data.
- Open the signed roster through the existing PrivateFile authorization flow.
- Display return reasons through History; edit/resubmit using the existing roster page.
- Follow athlete links to the existing detail/document viewer.
- Clear previous results when competition changes; ignore responses after effect cleanup.

## Deliberate limitations

FF has a client-only per-document review and resubmission simulator. This merge does not implement that additional backend workflow or pretend that changing a filename uploads a document. The new page explicitly distinguishes roster/application statuses from per-document review. Existing screens are retained rather than made pixel-identical to every FF screen; full visual parity remains outside this completed selective merge.

## Verification

- npx tsc --noEmit: passed.
- npm run lint: passed, no lint warnings.
- npm run test:unit: 199 passed, zero failures; six new tracking cases.
- npm run build: passed; Prompt download requires Google Fonts connectivity.
- Existing Node module-type warnings remain unchanged.
- Live authenticated browser and database integration tests were not run.

No migrations, database writes, production deployment, commits, new branches or edits to D:/BBN/FF were performed.

