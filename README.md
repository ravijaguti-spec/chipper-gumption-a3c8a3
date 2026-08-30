# ELITORR — Supabase + Netlify Ready

The existing ELITORR UI is preserved. The local SQLite database has been replaced by a shared Supabase PostgreSQL database. The API is also available as a Netlify Function, so the project can run on Netlify without a separate Node server.

## 1. Supabase table
Open Supabase → SQL Editor → New query. Paste and run `supabase_schema.sql` once.

## 2. Netlify environment variables
Open the ELITORR Netlify site → Site configuration → Environment variables and add:

`NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = your Supabase publishable key

Do NOT add or expose a Supabase service-role/secret key.

## 3. Deploy
Upload/deploy this project to Netlify. `netlify.toml` configures the `public` folder and the API function automatically.

The existing UI continues to call `/api/orders`; Netlify redirects those requests to the Supabase-backed function.

## 4. Verify
Open:

`https://YOUR-SITE.netlify.app/api/health`

It should return JSON containing `"status":"ok"` and `"database":"supabase"`.

## Important
The current SQL policies allow anonymous users to read/write the shared order table. This is suitable only for a controlled/private deployment. For a public production system, add Supabase Auth and user/role-based RLS before exposing customer/order data.
