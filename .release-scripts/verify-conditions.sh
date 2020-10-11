#!/bin/bash +e
EXIT_CODE=0;
if [ -z "${IMAGE}" ]; then
  echo "IMAGE variable is required."
  EXIT_CODE=1
fi
if [ -z "${GITHUB_USER}" ]; then
  echo "GITHUB_USER variable is required."
  EXIT_CODE=1
fi
if [ -z "${GITHUB_TOKEN}" ]; then
  echo "GITHUB_TOKEN variable is required."
  EXIT_CODE=1
fi
exit ${EXIT_CODE}