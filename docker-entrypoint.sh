#!/bin/sh
set -eu

# This image's persistent mount is /data. Never chown arbitrary host/system paths.
if [ "${DATA_DIR:-/data}" != "/data" ]; then
  echo "Docker DATA_DIR must be /data" >&2
  exit 1
fi
mkdir -p /data
chown node:node /data
chmod 700 /data
# Only the mount directory changes owner; existing unrelated files are untouched.
exec su-exec node:node "$@"
