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
