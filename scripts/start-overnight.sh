#!/usr/bin/env bash
cd /Users/camrontrost/Documents/Macbook-Documents/vocalLearn
mkdir -p debug-logs/test-runs
nohup ./scripts/run-tests.sh --loop > debug-logs/test-runs/overnight.log 2>&1 &
echo "Loop started PID $!"
echo "Tail log: tail -f debug-logs/test-runs/overnight.log"
