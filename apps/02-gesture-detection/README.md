# Prototype: Hybrid Gesture Recognition Engine

## What's this?

This is the functional core prototype for the gesture recognition system. Moving beyond the initial Proof of Concept, this package implements a highly modular, scalable, and hybrid **Gesture Recognition Engine** capable of running multi-model pipelines in real time.

It concurrently processes **Hand Landmarks** (for high-fidelity near-range interactions) and **Pose Landmarks** (for ergonomic far-range body controls).

## How to run it

```bash
bun install
bun dev
```

Stand in front of your camera and start moving your hands and arms according to the documented gesture set. The engine will detect and classify your gestures in real time, with visual feedback on the video feed.

## Key Architectural Principles

Unlike hardcoded detection scripts, this package is engineered around strict software-design principles suitable for a core framework:

- **Chained-Function Architecture:** New gesture detectors are written as decoupled, isolated modules and can be dynamically hooked into the pipeline via fluent chaining (e.g., `engine.use(new Detector())`).
- **Source-Level Transformation:** Frame coordinates are symmetrically smoothed and mirrored directly at the engine's source, decoupling physical ergonomics from raw camera space.
- **Anatomically Relative Spatial Fences:** Interaction boundaries are measured relative to the user's own body joints (e.g., fingertips relative to their specific finger base, wrists relative to shoulders), making the system hardware- and scale-agnostic.
- **Temporal Gating:** Every detector enforces a strictly defined time gate (frame-counter logic) to elegantly solve the _Midas Touch_ problem and separate random motion from clear intent.

## Technical Documentation & ADR

The architectural decisions driving this implementation, including the mathematical compensation for MediaPipe's $Z$-axis volatility and occlusion management, are fully documented here:

- **Architecture Decision Record (ADR):** [ADR 0002: Modular Hybrid Pipeline and Spatial Fencing Criteria](../../docs/adr-0002-modular-hybrid-pipeline.md)
- **Gesture Mapping & Matrix:** Documented within the global [GESTURES.md](./GESTURES.md) file, detailing the fallback matrices, thresholds, and evaluated edge cases.
