#!/bin/sh
set -e

# Already running as a non-root user (e.g. `--user 1000:1000`), nothing to fix
if [ "$(id -u)" != "0" ]; then
  exec "$@"
fi

PUID="${PUID:-1000}"
PGID="${PGID:-1000}"

case "$PUID$PGID" in
  *[!0-9]*)
    echo "PUID and PGID must be numeric, got PUID=$PUID PGID=$PGID" >&2
    exit 1
    ;;
esac

# PUID=0 keeps running as root, as older versions did
if [ "$PUID" = "0" ]; then
  exec "$@"
fi

# Reuse the user and group when the id already exists (the node user is 1000:1000)
group="$(getent group "$PGID" | cut -d: -f1)"

if [ -z "$group" ]; then
  group="rewind"
  addgroup -g "$PGID" "$group"
fi

if [ -z "$(getent passwd "$PUID")" ]; then
  adduser -D -H -u "$PUID" -G "$group" -s /sbin/nologin rewind
fi

# Existing installs have a root-owned config directory
chown -R "$PUID:$PGID" /app/config /app/.next/cache ||
  echo "Could not fix ownership of /app/config, the app may not be able to save settings" >&2

HOME="$(getent passwd "$PUID" | cut -d: -f6)"
export HOME

exec su-exec "$PUID:$PGID" "$@"
