#!/bin/bash -e
# Build a release image to pick up the new version.
docker build . --tag release-image

# Log into container registry
echo "${GITHUB_TOKEN}" | docker login https://ghcr.io -u "${GITHUB_USER}" --password-stdin