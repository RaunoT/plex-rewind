#!/usr/bin/env bash
# Starts a built Plex Rewind image with an empty config directory and checks
# that the server boots and answers requests.
#
# Usage: smoke-test.sh <image>
set -euo pipefail

image="${1:?Usage: smoke-test.sh <image>}"
port=8383
name="plex-rewind-smoke-$$"
config_dir="$(mktemp -d)"

cleanup() {
  status=$?

  if [ "$status" -ne 0 ]; then
    echo '::group::Container logs'
    docker logs "$name" 2>&1 || true
    echo '::endgroup::'
  fi

  docker rm -f "$name" > /dev/null 2>&1 || true
  rm -rf "$config_dir" 2> /dev/null || true
  exit "$status"
}
trap cleanup EXIT

docker run --detach --name "$name" --publish "$port:$port" \
  --env NEXTAUTH_SECRET=smoke-test-secret \
  --env NEXTAUTH_URL="http://localhost:$port" \
  --env NEXT_PUBLIC_SITE_URL="http://localhost:$port" \
  --volume "$config_dir:/app/config" \
  "$image" > /dev/null

# Docker's port forwarding accepts connections before the server is listening
# and then resets them, so --retry-connrefused alone is not enough while the
# app starts; --retry-all-errors covers resets and empty replies.
#
# An unconfigured instance redirects pages and public files to the setup page,
# so --location follows that redirect and the check passes once the setup page
# renders.
for path in /api/status /manifest.json; do
  curl --location --retry 20 --retry-connrefused --retry-all-errors \
    --retry-delay 2 --max-time 10 --fail --silent --show-error \
    --output /dev/null --write-out "$path -> %{http_code}\n" \
    "http://localhost:$port$path"
done

echo 'Smoke test passed'
