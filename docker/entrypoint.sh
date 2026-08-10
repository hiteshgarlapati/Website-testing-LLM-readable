#!/bin/sh
set -e

DATA_DIR="${DATA_DIR:-/app/data}"
mkdir -p "$DATA_DIR/images"

if [ ! -f "$DATA_DIR/items.json" ]; then
  echo "Seeding catalogue data to $DATA_DIR/items.json"
  cp /app/seed/items.json "$DATA_DIR/items.json"
fi

if [ ! -f "$DATA_DIR/images/.seed-complete" ]; then
  if [ -d /app/seed/images ]; then
    echo "Seeding product images into $DATA_DIR/images"
    cp -rn /app/seed/images/. "$DATA_DIR/images/" 2>/dev/null || true
  fi
  touch "$DATA_DIR/images/.seed-complete"
fi

exec "$@"
