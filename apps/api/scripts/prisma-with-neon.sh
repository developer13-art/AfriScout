#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

if [ -n "${NEON_DATABASE_URL:-}" ]; then
  export DATABASE_URL="$NEON_DATABASE_URL"

  if [ "${1:-}" = "migrate" ]; then
    if [ "${2:-}" = "reset" ] && [ "${ALLOW_NEON_DATABASE_RESET:-}" != "1" ]; then
      echo "Refusing to reset the Neon database without ALLOW_NEON_DATABASE_RESET=1." >&2
      exit 1
    fi
    if [ -z "${NEON_DATABASE_URL_DIRECT:-}" ]; then
      echo "NEON_DATABASE_URL_DIRECT is required for Prisma migrations." >&2
      exit 1
    fi
    export DATABASE_URL_DIRECT="$NEON_DATABASE_URL_DIRECT"
  elif [ -n "${NEON_DATABASE_URL_DIRECT:-}" ]; then
    export DATABASE_URL_DIRECT="$NEON_DATABASE_URL_DIRECT"
  else
    export DATABASE_URL_DIRECT="$NEON_DATABASE_URL"
  fi
elif [ -n "${NEON_DATABASE_URL_DIRECT:-}" ]; then
  echo "NEON_DATABASE_URL must also be configured when using NEON_DATABASE_URL_DIRECT." >&2
  exit 1
fi

exec prisma "$@" --schema "$script_dir/../src/database/prisma/schema.prisma"
