#!/bin/bash +e
EXIT_CODE=0;
if [ -z "${IMAGE_ID}" ]; then
  echo "IMAGE_ID variable is required."
  EXIT_CODE=1
fi
if [ -z "${IMAGE_NAME}" ]; then
  echo "IMAGE_NAME variable is required."
  EXIT_CODE=1
fi
if [ -z "${GITHUB_TOKEN}" ]; then
  echo "GITHUB_TOKEN variable is required."
  EXIT_CODE=1
fi
exit ${EXIT_CODE}