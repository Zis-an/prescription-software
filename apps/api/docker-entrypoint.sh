#!/bin/sh
set -e
echo "Running Prisma migrations..."
npx prisma migrate deploy
echo "Seeding database..."
if [ -f dist/prisma/seed.js ]; then
  node dist/prisma/seed.js
else
  echo "WARNING: dist/prisma/seed.js missing — skipping seed"
fi

MAIN=""
for candidate in dist/main.js dist/src/main.js; do
  if [ -f "$candidate" ]; then
    MAIN="$candidate"
    break
  fi
done

if [ -z "$MAIN" ]; then
  echo "ERROR: Nest build output not found. dist contents:"
  ls -laR dist || true
  exit 1
fi

echo "Starting API ($MAIN) on :${API_PORT:-3001}..."
exec node "$MAIN"
