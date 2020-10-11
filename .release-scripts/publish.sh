#!/bin/bash -e

# If on the default channel (aka `main`), publish to latest.
[ -z "${CHANNEL}" ] && CHANNEL=latest

# Release the version tag.
VERSION_TAG="$IMAGE_ID:$VERSION"
docker tag "$IMAGE_NAME" "$VERSION_TAG" > /dev/null
docker push "$VERSION_TAG" > /dev/null

# Release the channel tag.
CHANNEL_TAG="$IMAGE_ID:$CHANNEL"
docker tag "$IMAGE_NAME" "$CHANNEL_TAG" > /dev/null
docker push "$CHANNEL_TAG" > /dev/null

# Report the released images.
echo "{\"dockerImages\": [ \"${VERSION_TAG}\", \"${LATEST_TAG}\" ]}"
