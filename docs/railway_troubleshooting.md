# Railway Troubleshooting: Connecting Services

## ❌ Problem
Services (like `auth-service`, `job-service`) are not connecting to `Postgres`. The visual graph shows them independent of the database.

## 💡 Reason
In your local Docker setup, `docker-compose.yml` automatically sets:
`DATABASE_URL=postgresql://...`

In Railway, **you must explicitly tell each service where the database is.** They do not guess the password or host automatically.

## ✅ Solution: Link Environment Variables

You need to set the `DATABASE_URL` for **EACH** of your services (`auth-service`, `admin-service`, etc.).

### Option 1: The "Variable Reference" Way (Recommended)
This acts like a magic link. If you change your DB password, everything updates automatically.

1. Go to your **Railway Project Dashboard**.
2. Click on a service (e.g., `@smartcareer/auth-service`).
3. Click the **Variables** tab.
4. Click **New Variable**.
5. **Name:** `DATABASE_URL`
6. **Value:** Type `${` and wait for the autocomplete dropdown.
7. Select `Postgres` -> `DATABASE_URL`.
   - It should look like: `${{ Postgres.DATABASE_URL }}`
8. Click **Add**.
9. Railway will automatically **Redeploy** that service.

**Repeat** this for every service that needs the database.

### Option 2: The "Raw Value" Way
1. Click on your **Postgres** service.
2. Go to **Variables** or **Connect** tab.
3. Copy the full `DATABASE_URL` (starts with `postgresql://...`).
4. Go to your other services -> **Variables**.
5. Add `DATABASE_URL` and paste the value.

---

## 🔍 Other Variables to Check
Based on your `docker-compose.yml`, you also need to link **Redis** and **MinIO** for some services.

| Service | Requires | Variable Name | Reference Value (Approx) |
| :--- | :--- | :--- | :--- |
| **All Services** | Postgres | `DATABASE_URL` | `${{ Postgres.DATABASE_URL }}` |
| **auth-service** | Redis | `REDIS_URL` | `${{ Redis.REDIS_URL }}` |
| **scoring-service** | Redis | `REDIS_URL` | `${{ Redis.REDIS_URL }}` |
| **resume-service** | MinIO | `MINIO_ENDPOINT` | *Check MinIO service variables* |
