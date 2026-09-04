# AthleteLinQ — Getting M1 Running on Your Laptop

Follow these steps in order. Total time: about 30 minutes.

## Step 1 — Install Node.js (one time only)
1. Go to https://nodejs.org and download the **LTS** version.
2. Install it with the default options.
3. Open a terminal (Command Prompt on Windows) and type `node -v`.
   If you see a version number (v20 or higher), you're good.

## Step 2 — Unzip the project
1. Unzip `athletelinq.zip` somewhere sensible, e.g. `Documents/athletelinq`.
2. In the terminal, move into the folder:
   ```
   cd Documents/athletelinq
   ```
3. Install the project's packages (needs internet, takes a few minutes):
   ```
   npm install
   ```

## Step 3 — Create your Supabase project (one time only)
1. Go to https://supabase.com and sign up (free, GitHub or email).
2. Click **New project**. Name it `athletelinq`, set a strong database
   password (save it somewhere), choose the **West EU (London)** region
   (closest to Nigeria), and create.
3. Wait ~2 minutes while it sets up.

## Step 4 — Create the database tables
1. In the Supabase dashboard, open **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open the file `supabase/schema.sql` from this project, copy ALL of it,
   paste it in, and click **Run**.
4. You should see "Success. No rows returned". Done — all 8 tables,
   security rules, and the sign-up automation are now live.

## Step 5 — Turn off email confirmation (for now)
So you can test sign-ups instantly without real emails:
1. In Supabase: **Authentication -> Sign In / Providers -> Email**.
2. Turn OFF "Confirm email". Save.
   (We turn this back on before public launch.)

## Step 6 — Connect the app to Supabase
1. In Supabase: **Project Settings -> API**.
2. Copy the **Project URL** and the **anon public** key.
3. In the project folder, copy `.env.local.example` to a new file named
   exactly `.env.local` and paste your two values in.

## Step 7 — Run it
```
npm run dev
```
Open http://localhost:3000 in your browser. You should see the
AthleteLinQ landing page.

## Step 8 — Test it properly (5 minutes)
1. Sign up as an **Athlete** — you should land on the dashboard.
2. Edit your profile: set state, date of birth, position, bio. Save.
3. Sign out. Sign up again with a different email as an **Academy**.
   Notice the profile form changes (club name, home ground).
4. In Supabase -> **Table Editor** -> `profiles`: you should see both
   accounts with the right roles. That's M1 working end to end.

## If something goes wrong
- **"Invalid API key" or blank page** — your `.env.local` values are
  wrong or the file is misnamed. Fix, then stop the server (Ctrl+C)
  and run `npm run dev` again (Next.js only reads env values on start).
- **Sign-up succeeds but dashboard says profile still creating** —
  Step 4 wasn't run, or it failed. Re-check the SQL Editor output.
- Anything else: copy the exact error message and paste it to Claude.

## What's next (M2)
Video upload + the public discovery feed. Before we build it, create a
free Cloudflare account at https://dash.cloudflare.com — we'll need it
for video hosting.
