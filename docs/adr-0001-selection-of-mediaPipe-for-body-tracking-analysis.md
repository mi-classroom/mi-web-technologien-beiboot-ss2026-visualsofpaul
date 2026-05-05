# Selection of MediaPipe for Body Tracking Analysis

- **Status:** accepted
- **Workload:** 3h (so far)
- **Decider:** [Paul Strebinger](https://github.com/visualsofpaul)
- **Date:** 2026-05-05

## Context and Problem Statement

The project requires a solution to extract live body tracking data (landmarks) directly in the browser. The goal is to visualize raw data without high-level abstraction to analyze data quality, noise, and performance. We need a library that provides high frequency and precision while running efficiently on client-side hardware.

## Decision Outcome

Chosen option: **MediaPipe (Hand Landmarker)**.

The choice was made because MediaPipe provides direct access to 21 hand landmarkers (x, y, z coordinates) and a visibility score per point. This granularity is essential for the required analysis of raw data and noise.

## Planned Observations (Experimentation)

To evaluate the model's quality and performance as requested, I Will focus on the following experiments:

1. **Analysis of Data Noise (Jitter)**

- **Target:** Measure the coordinate fluctuation of the fingertips (Landmarks 4, 8, 12, 16, 20) while holding the hand still.
- **Observation:** How much noise is present in the raw stream?

2. **Performance Tracking**

- **Target:** Monitoring the latency (inference time) of the detection loop.
- **Observation:** How consistent is the frame rate on my local hardware?

3. **Reliability and Edge Cases**

- **Target:** Testing hand occlusion (one finger covering another) and distance variations.
- **Observation:** When do the raw coordinates become unreliable or jump?

## Pros and Cons of MediaPipe

### Pros

- Extremely fast processing via WebAssembly.
- Provides raw z-axis estimation, allowing for depth analysis.

### Cons

- High dependency on specific WASM assets which requires careful initialization.

## Links

- [MediaPipe Hand Landmarker Documentation](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker)
