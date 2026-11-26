# Creates Clinical OS Postgres role + database on a native local server (no Docker).
# Requires: PostgreSQL installed, psql on PATH, superuser access.
#
# Usage:
#   $env:PGPASSWORD = 'your_postgres_password'
#   powershell -File scripts/setup-local-db.ps1
#
# Optional overrides:
#   $env:PGUSER = 'postgres'
#   $env:PGHOST = 'localhost'
#   $env:PGPORT = '5432'

$ErrorActionPreference = 'Stop'

$PgUser = if ($env:PGUSER) { $env:PGUSER } else { 'postgres' }
$PgHost = if ($env:PGHOST) { $env:PGHOST } else { 'localhost' }
$PgPort = if ($env:PGPORT) { $env:PGPORT } else { '5432' }

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
  Write-Error "psql not found. Install PostgreSQL and add its bin folder to PATH (e.g. C:\Program Files\PostgreSQL\17\bin)."
}

if (-not $env:PGPASSWORD) {
  $secure = Read-Host -AsSecureString "Password for PostgreSQL user '$PgUser'"
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
}

$appUser = 'clinicalos'
$appPass = 'clinicalos_dev'
$appDb = 'clinicalos'

Write-Host "Ensuring role '$appUser'..."
$roleExists = psql -U $PgUser -h $PgHost -p $PgPort -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$appUser'"
if ($roleExists -ne '1') {
  psql -U $PgUser -h $PgHost -p $PgPort -d postgres -c "CREATE USER $appUser WITH PASSWORD '$appPass' CREATEDB;"
} else {
  Write-Host "Role already exists."
}

Write-Host "Ensuring database '$appDb'..."
$dbExists = psql -U $PgUser -h $PgHost -p $PgPort -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$appDb'"
if ($dbExists -ne '1') {
  psql -U $PgUser -h $PgHost -p $PgPort -d postgres -c "CREATE DATABASE $appDb OWNER $appUser;"
} else {
  Write-Host "Database already exists."
}

Write-Host "Ensuring extensions..."
psql -U $PgUser -h $PgHost -p $PgPort -d $appDb -c 'CREATE EXTENSION IF NOT EXISTS pg_trgm;'
psql -U $PgUser -h $PgHost -p $PgPort -d $appDb -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'

Write-Host ""
Write-Host "Done. Use in .env:"
Write-Host "DATABASE_URL=postgresql://${appUser}:${appPass}@${PgHost}:${PgPort}/${appDb}?schema=public"
Write-Host ""
Write-Host "Next: cd apps/api && npm install && npx prisma migrate deploy && npx prisma db seed && npm run start:dev"
