# Railway Database Migration Guide

This guide explains how to migrate your local database data to your Railway PostgreSQL project and resolve common connection errors.

## 🛑 Understanding the Error: `P1001: Can't reach database server`

If you see this error when running `railway run ...`:
> Error: P1001: Can't reach database server at `postgres.railway.internal:5432`

**Reason:**
The `DATABASE_URL` in your Railway project is set to a **private internal address** (`.internal`). This address is only accessible from *inside* Railway's infrastructure. It cannot be resolved by your local computer.

**Solution:**
You must use `railway connect` to proxy the connection or use the public TCP proxy URL.

---

## 🚀 Migration Steps

### Step 1: Backup Local Data
Use the helper script to create a clean SQL dump of your local database.

1. Ensure your local `postgres` container is running:
   ```powershell
   docker-compose up -d postgres
   ```
2. Run the backup script:
   ```powershell
   .\backup_db.ps1
   ```
   This effectively creates a file like `backups/smartcareer_backup_20260121-123456.sql`.

### Step 2: Connect to Railway
To push data or run migrations from your local machine, use `railway connect`.

1. Open a **NEW** terminal window.
2. Run the connect command:
   ```bash
   railway connect postgres
   ```
   *(Note: replace `postgres` with your actual service name if different)*
3. Keep this terminal **OPEN**. It will display the local address, e.g.:
   > `🎉 Connected to Postgres at localhost:5432`

   *If it says a different port (e.g., 6231), make a note of it.*

### Step 3: Deployment / Restore

Now that you have checks and balances in place, you can proceed.

#### Option A: Apply Schema with Prisma (Fixing your error)
In your **original** terminal (where you ran the failed command), verify your `.env` or just run the command ensuring it points to the simple localhost port opened by `railway connect`.

However, `railway run` forces the *remote* env vars. To bypass this and use the tunnel:
1. Create a temporary `.env` or just set the variable in the shell.
2. Assuming `railway connect` is running on port **5432** (or whatever port it gave you):
   ```powershell
   # PowerShell example (adjust port/password if needed)
   # You can get the password from accessing `railway variables` in another tab or the dashboard
   $env:DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/railway"
   npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
   ```

#### Option B: Import Data (The "Send Data" goal)
You can use `psql` to import your backup file directly into the tunnel.

Assuming `railway connect` provided:
- **Host:** `localhost`
- **Port:** `5432` (example)
- **User:** `postgres`
- **Password:** (Get this from `railway variables` or dashboard)

Run this command:
```powershell
# CAUTION: This may overwrite existing data on Railway
# Replace PASSWORD, PORT, and FILENAME with actual values

$env:PGPASSWORD="YOUR_RAILWAY_PASSWORD"
psql -h localhost -p 5432 -U postgres -d railway -f backups/smartcareer_backup_YYYYMMDD-HHmmss.sql
```

**Tip:** If you don't have `psql` installed locally on Windows, you can't run the above easily.
**Alternative:** Use a tool like **pgAdmin** or **DBeaver** to connect to the `localhost:Port` provided by `railway connect` and run the Restore tool using the `.sql` file generated in Step 1.
