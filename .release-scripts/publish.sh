#!/bin/bash -e

# If on the default channel (aka `main`), publish to latest.
if [ -z "${CHANNEL}" ]; then
  CHANNEL=latest
fi

# Release the version tag.
VERSION_TAG="${IMAGE}:${VERSION}"
docker tag release-image "${VERSION_TAG}" > /dev/null
docker push "${VERSION_TAG}" > /dev/null

# Release the channel tag.
CHANNEL_TAG="${IMAGE}:${CHANNEL}"
docker tag release-image "${CHANNEL_TAG}" > /dev/null
docker push "${CHANNEL_TAG}" > /dev/null

# Report the released images.
echo "{\"dockerImages\": [ \"${VERSION_TAG}\", \"${LATEST_TAG}\" ]}"
