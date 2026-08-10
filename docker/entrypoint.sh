#!/bin/sh
set -e

DATA_DIR="${DATA_DIR:-/app/data}"
SEED_DIR="${SEED_DIR:-/app/seed}"
SEED_ITEMS="$SEED_DIR/items.json"
SEED_IMAGES="$SEED_DIR/images"

mkdir -p "$DATA_DIR/images"

# Merge bundled images into the volume on every start (never overwrites admin uploads).
if [ -d "$SEED_IMAGES" ]; then
  echo "Syncing product images into $DATA_DIR/images"
  cp -rn "$SEED_IMAGES"/. "$DATA_DIR/images/" 2>/dev/null || true
fi

if [ ! -f "$DATA_DIR/items.json" ]; then
  echo "Seeding catalogue data to $DATA_DIR/items.json"
  cp "$SEED_ITEMS" "$DATA_DIR/items.json"
elif [ -f "$SEED_ITEMS" ]; then
  # Repair empty or invalid catalogue (common on first deploy with a stale volume).
  if ! node -e "
    const fs = require('fs');
    const p = process.argv[1];
    const raw = fs.readFileSync(p, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) process.exit(1);
  " "$DATA_DIR/items.json" 2>/dev/null; then
    echo "Repairing empty or invalid $DATA_DIR/items.json from seed"
    cp "$SEED_ITEMS" "$DATA_DIR/items.json"
  fi
fi

exec "$@"
