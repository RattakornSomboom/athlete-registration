# Password reset delivery

Server configuration required:

- `JWT_SECRET`: private signing secret; password reset fails closed when missing.
- `APP_URL`: trusted canonical application origin, HTTPS in production.
- `RESEND_API_KEY`: server-only Resend API key.
- `PASSWORD_RESET_FROM_EMAIL`: sender address on a verified Resend domain.

Delivery uses the [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email) through server-side fetch; no extra package is required. Do not prefix these variables with `NEXT_PUBLIC_`. Never commit credentials.

Public requests return the same confirmation JSON for found/missing accounts and transport failures. Reset links are never returned in development responses or printed in application logs. Admin recovery reports 503 when delivery is unavailable and records its sent audit event only after the provider accepts the message. Provider acceptance does not guarantee inbox delivery.

Tokens expire after 15 minutes; reset writes conditionally match the original password/version so concurrent redemptions cannot both succeed. Reset does not activate suspended accounts. Audit events use independent `SystemSetting` keys with prefix `audit_logs:` and are persisted in the account mutation transaction; the legacy `audit_logs` record is retained. Admin email delivery and its audit transaction cannot be atomic across an external provider and PostgreSQL; a provider-accepted message can exist if subsequent audit persistence fails.

Deployment verification remains necessary: the local environment has no configured delivery values, and tests mock fetch without sending email. Configure the sender/key/origin, then verify delivery using an authorized test account. The existing 60-second limiter is per application process, so multi-instance deployments require a shared limiter. Public confirmation content is uniform, but synchronous database/provider work can produce different response times; a durable asynchronous delivery queue is needed to avoid this timing distinction.

Database-backed concurrency and authorization integration tests require a dedicated test database and explicit write opt-in. No schema migration or production database write is needed for this implementation.
