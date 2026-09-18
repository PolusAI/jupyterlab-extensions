#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_CONFIG="${ROOT_DIR}/ui-tests/jupyter_server_test_config.py"
JUPYTER_CMD="${JUPYTER_CMD:-${ROOT_DIR}/.venv/bin/jupyter}"

if [[ ! -x "${JUPYTER_CMD}" ]] && ! command -v "${JUPYTER_CMD}" >/dev/null 2>&1; then
  echo "Could not find jupyter command: ${JUPYTER_CMD}" >&2
  echo "Set JUPYTER_CMD explicitly if needed." >&2
  exit 1
fi

if [[ ! -f "${TEST_CONFIG}" ]]; then
  echo "Missing test config: ${TEST_CONFIG}" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required but was not found on PATH." >&2
  echo "Install Node.js and retry. This is why Jupyter shows: 'Could not determine jupyterlab build status without nodejs'." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but was not found on PATH." >&2
  exit 1
fi

NODE_BIN_DIR="$(dirname "$(command -v node)")"
export PATH="${NODE_BIN_DIR}:$(dirname "${JUPYTER_CMD}"):${PATH}"

echo "Cold start build (npm install + npm run build)..."
npm install
npm run build

echo "Linking local frontend extension..."
"${JUPYTER_CMD}" labextension develop "${ROOT_DIR}" --overwrite >/dev/null

echo "Ensuring server extension is enabled..."
"${JUPYTER_CMD}" server extension enable jupyter_dataset --sys-prefix >/dev/null

export JUPYTER_DATASET_ROOT="${JUPYTER_DATASET_ROOT:-${ROOT_DIR}/.sample-datasets}"

echo "Starting JupyterLab"
echo "Root dir: ${ROOT_DIR}"
echo "Dataset root: ${JUPYTER_DATASET_ROOT}"
echo "Node binary: $(command -v node)"

exec "${JUPYTER_CMD}" lab \
  --config "${TEST_CONFIG}" \
  --LabApp.build_check=False \
  --LabApp.build_available=False \
  --ServerApp.root_dir="${ROOT_DIR}" \
  "$@"
