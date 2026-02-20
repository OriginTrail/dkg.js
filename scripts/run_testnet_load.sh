#!/usr/bin/env bash
set -euo pipefail

CHAIN="${1:-}"
NODE_TO_TEST_ARG="${2:-}"

if [ -z "${CHAIN}" ]; then
  echo "Usage: bash scripts/run_testnet_load.sh <base|gnosis|neuroweb> [\"Node XX\"]"
  exit 1
fi

case "${CHAIN}" in
  base)
    SPEC_FILE="tests/testnet/Base_Testnet.spec.js"
    REPORT_FILENAME="testnet_base"
    ;;
  gnosis)
    SPEC_FILE="tests/testnet/Gnosis_Testnet.spec.js"
    REPORT_FILENAME="testnet_gnosis"
    ;;
  neuroweb)
    SPEC_FILE="tests/testnet/Neuroweb_Testnet.spec.js"
    REPORT_FILENAME="testnet_neuroweb"
    ;;
  *)
    echo "Unsupported chain '${CHAIN}'. Use one of: base, gnosis, neuroweb"
    exit 1
    ;;
esac

# Defaults kept exactly as requested; each can still be overridden from env.
export TEST_COMPACT_CHUNK_MODE="${TEST_COMPACT_CHUNK_MODE:-true}"
export TEST_COMPACT_CHUNK_IDS="${TEST_COMPACT_CHUNK_IDS:-8686}"
export TEST_COMPACT_CHUNK_EDGES="${TEST_COMPACT_CHUNK_EDGES:-2}"
export TEST_TARGET_UALS="${TEST_TARGET_UALS:-10}"
export TEST_TARGET_MINTED_UALS="${TEST_TARGET_MINTED_UALS:-0}"
export TEST_WALLET_SLOTS="${TEST_WALLET_SLOTS:-5}"
export TEST_PARALLEL_KA_BATCH_SIZE="${TEST_PARALLEL_KA_BATCH_SIZE:-3}"
export TEST_BATCH_DELAY_MS="${TEST_BATCH_DELAY_MS:-1000}"
export TEST_RATE_LIMIT_MAX_RETRIES="${TEST_RATE_LIMIT_MAX_RETRIES:-5}"
export TEST_RATE_LIMIT_COOLDOWN_MS="${TEST_RATE_LIMIT_COOLDOWN_MS:-65000}"

if [ -n "${NODE_TO_TEST_ARG}" ]; then
  export NODE_TO_TEST="${NODE_TO_TEST_ARG}"
fi

npx mocha "${SPEC_FILE}" --reporter mochawesome --reporter-options "reportFilename=${REPORT_FILENAME}" --exit
