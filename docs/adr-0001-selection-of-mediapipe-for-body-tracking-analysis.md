# Selection of MediaPipe for Body Tracking Analysis

- **Status:** accepted
- **Workload:** 6h
- **Decider:** [Paul Strebinger](https://github.com/visualsofpaul)
- **Date:** 2026-05-14

## Context and Problem Statement

The project requires a solution to extract live body tracking data (landmarks) directly in the browser. The goal is to visualize raw data without high-level abstraction to analyze data quality, noise, and performance. We need a library that provides high frequency and precision while running efficiently on client-side hardware.

## Decision Outcome

Chosen option: **MediaPipe (Hand Landmarker)**.

The choice was made because MediaPipe provides direct access to 21 hand landmarkers (x, y, z coordinates). This granularity is essential for the required analysis of raw data and noise.

## Planned Observations (Experimentation)

To evaluate the model's quality and performance as requested, I will focus on the following experiments:

1. **Analysis of Data Noise (Jitter)**

- **Target:** Measure the coordinate fluctuation of the fingertips (Landmarks 4, 8, 12, 16, 20) while holding the hand still.
- **Observation:** How much noise is present in the raw stream?

2. **Performance Tracking**

- **Target:** Monitoring the latency (inference time) of the detection loop.
- **Observation:** How consistent is the frame rate on my local hardware?

3. **Reliability and Edge Cases**

- **Target:** Testing hand occlusion (one finger covering another) and distance variations.
- **Observation:** When do the raw coordinates become unreliable or jump?

## Confirmation and Results

The planned experiments were conducted on a MacBook Air M1 (battery mode) to evaluate the decision. The following results were documented:

- **Stable Performance:** Latency remains consistently between 9ms and 20ms, confirming the efficiency of the WASM/GPU execution.
- **Environmental Impact:** Low-light conditions increase the noise floor (jitter) by a factor of ~2.5.
- **Occlusion Behavior:** During hand occlusion, the model predicts "Phantom-Points" with significantly higher jitter (0.022), which must be handled in future gesture logic.

For detailed metrics and test scenarios, see [OBSERVATIONS.md](../demo/OBSERVATIONS.md).

## Pros and Cons of MediaPipe

### Pros

- Extremely fast processing via WebAssembly.
- Provides raw z-axis estimation, allowing for depth analysis.
- Robust tracking even under varying power-management states of the hardware.

### Cons

- High dependency on specific WASM assets which requires careful initialization.
- Occlusion leads to predicted coordinates ("Phantom-Points") instead of clear tracking loss.

## Links

- [MediaPipe Hand Landmarker Documentation](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker)
- [Observations](../demo/OBSERVATIONS.md)
