# Supabase Revenue Activation Setup

This repository contains contracts and a migration only; no Supabase project or network connection is created by the application.

1. Create a Supabase project and configure Auth for the Owner account.
2. Apply `supabase/migrations/001_revenue_activation.sql` through the Supabase migration workflow.
3. Verify RLS policies with an authenticated Owner and an anonymous client; anonymous reads must return no rows.
4. Configure server-only Supabase credentials in the deployment environment. Never expose a service-role key to the client.
5. Connect `createSupabaseOwnerAuthAdapter` and `createSupabaseUsageStoreAdapter` behind the existing server route.
6. Verify reservation, retry reservation, commit, release, cache expiry, and Emergency Stop before enabling any Provider call.

Until these checks pass, the system must remain `OWNER_AUTH_PROVIDER_REQUIRED` or `SERVER_USAGE_STORE_REQUIRED`.
