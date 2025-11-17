#!/bin/bash

# Parallel Analysis Execution Script
# Runs all 6 analysis tasks simultaneously

echo "=========================================="
echo "Starting Parallel Analysis Tasks"
echo "=========================================="
echo ""

# Create log directory
mkdir -p /home/ubuntu/analysis/logs

# Run all tasks in parallel
echo "Launching Task 1: Model Performance Analysis..."
python3.11 /home/ubuntu/analysis/model_performance/analyze.py > /home/ubuntu/analysis/logs/task1.log 2>&1 &
PID1=$!

echo "Launching Task 2: Feature Correlation Analysis..."
python3.11 /home/ubuntu/analysis/feature_correlation/analyze.py > /home/ubuntu/analysis/logs/task2.log 2>&1 &
PID2=$!

echo "Launching Task 3: Ensemble Optimization..."
python3.11 /home/ubuntu/analysis/ensemble_optimization/analyze.py > /home/ubuntu/analysis/logs/task3.log 2>&1 &
PID3=$!

echo "Launching Task 4: Calibration Analysis..."
python3.11 /home/ubuntu/analysis/calibration/analyze.py > /home/ubuntu/analysis/logs/task4.log 2>&1 &
PID4=$!

echo "Launching Task 5: Model Interpretability..."
python3.11 /home/ubuntu/analysis/interpretability/analyze.py > /home/ubuntu/analysis/logs/task5.log 2>&1 &
PID5=$!

echo "Launching Task 6: Synthetic Data Testing..."
python3.11 /home/ubuntu/analysis/synthetic_testing/analyze.py > /home/ubuntu/analysis/logs/task6.log 2>&1 &
PID6=$!

echo ""
echo "All tasks launched. Waiting for completion..."
echo ""

# Wait for all tasks to complete
wait $PID1
STATUS1=$?
echo "Task 1 completed with status: $STATUS1"

wait $PID2
STATUS2=$?
echo "Task 2 completed with status: $STATUS2"

wait $PID3
STATUS3=$?
echo "Task 3 completed with status: $STATUS3"

wait $PID4
STATUS4=$?
echo "Task 4 completed with status: $STATUS4"

wait $PID5
STATUS5=$?
echo "Task 5 completed with status: $STATUS5"

wait $PID6
STATUS6=$?
echo "Task 6 completed with status: $STATUS6"

echo ""
echo "=========================================="
echo "All Parallel Tasks Complete!"
echo "=========================================="
echo ""

# Summary
echo "Task Summary:"
echo "  Task 1 (Model Performance): $([ $STATUS1 -eq 0 ] && echo 'SUCCESS' || echo 'FAILED')"
echo "  Task 2 (Feature Correlation): $([ $STATUS2 -eq 0 ] && echo 'SUCCESS' || echo 'FAILED')"
echo "  Task 3 (Ensemble Optimization): $([ $STATUS3 -eq 0 ] && echo 'SUCCESS' || echo 'FAILED')"
echo "  Task 4 (Calibration Analysis): $([ $STATUS4 -eq 0 ] && echo 'SUCCESS' || echo 'FAILED')"
echo "  Task 5 (Model Interpretability): $([ $STATUS5 -eq 0 ] && echo 'SUCCESS' || echo 'FAILED')"
echo "  Task 6 (Synthetic Testing): $([ $STATUS6 -eq 0 ] && echo 'SUCCESS' || echo 'FAILED')"
echo ""

# Check if any task failed
if [ $STATUS1 -ne 0 ] || [ $STATUS2 -ne 0 ] || [ $STATUS3 -ne 0 ] || [ $STATUS4 -ne 0 ] || [ $STATUS5 -ne 0 ] || [ $STATUS6 -ne 0 ]; then
    echo "WARNING: Some tasks failed. Check logs in /home/ubuntu/analysis/logs/"
    exit 1
else
    echo "All tasks completed successfully!"
    exit 0
fi
