# Proof of Concept: MediaPipe Gesture Recognition

## What's this?

Quick proof of concept showing that you can use **MediaPipe** to detect hand gestures in the browser:

- Open / closed hand detection
- Pointing finger direction
- Other hand poses are possible too, but this is just a starting point

Just spinning up something to validate the approach before building the actual thing.

## How to run it

```bash
bun install
bun dev
```

Open your browser and wave your hands around. The app picks up the gestures from your webcam.

## Why Vite + TypeScript?

**TypeScript** keeps things type-safe from the start. Better to catch issues early, plus it's a preview of what the actual MediaPipe package will look like.

**Vite** is the simplest way to get HTML + TypeScript running without fighting the build setup. Hot reloads work too, which makes iteration faster.

## Technical Evaluation

This PoC includes a built-in measurement tool to analyze the raw data quality of MediaPipe. By pressing `Space`, the app captures 3D jitter and latency metrics.

The findings regarding data noise, low-light performance, and edge cases (occlusion) are documented in [OBSERVATIONS.md](./OBSERVATIONS.md) and are also summarized in the ADR [Selection of MediaPipe for Body Tracking Analysis](../docs/adr-0001-selection-of-mediapipe-for-body-tracking-analysis.md).
