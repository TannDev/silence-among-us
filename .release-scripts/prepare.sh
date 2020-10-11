#!/bin/bash -e
# Build a release image to pick up the new version.
docker pull "${IMAGE_ID}:latest" || true
docker pull "${IMAGE_ID}:beta" || true
docker build . --tag "${IMAGE_NAME}" --cache-from "${IMAGE_ID}:latest" --cache-from "${IMAGE_ID}:beta" > /dev/null

# Log into container registry
echo "${GITHUB_TOKEN}" | docker login https://ghcr.io -u TannDev-CI --password-stdin > /dev/null