#!/bin/bash -e
# Build a release image to pick up the new version.
docker pull "${IMAGE}:latest" || true
docker pull "${IMAGE}:beta" || true
docker build . --tag release-image --cache-from "${IMAGE}:latest" --cache-from "${IMAGE}:beta"

# Log into container registry
echo "${GITHUB_TOKEN}" | docker login https://ghcr.io -u "${GITHUB_USER}" --password-stdin