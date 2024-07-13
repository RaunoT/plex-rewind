#!/bin/sh

if [ -z "$NEXTAUTH_SECRET" ]; then
  export NEXTAUTH_SECRET=$(openssl rand -base64 32)
  echo "Generated NEXTAUTH_SECRET"
fi

# Execute the Docker CMD
exec "$@"
