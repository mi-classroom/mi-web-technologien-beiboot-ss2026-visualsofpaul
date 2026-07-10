# Transition from waitFor to explicit holdFor and idleFor Semantics

- **Status:** accepted
- **Workload:** 0.5h
- **Decider:** Paul Strebinger
- **Date:** 2026-07-10

## Context and Problem Statement

The initial gesture lifecycle relied on a singular `waitFor(ms)` parameter. This parameter attempted to serve two distinct temporal requirements: delaying a gesture's execution until a pose became stable, and enforcing a cooldown period after a gesture fired to prevent rapid double-triggering.

Collapsing these distinct time dimensions into a single configuration led to developer confusion and restricted the engine's capability. Developers could not create a gesture that required a precise, long hold time (e.g., holding a fist for 500ms to trigger a secondary action) without simultaneously enforcing that exact same duration as a blind lockout window after execution. The vocabulary lacked semantic clarity, forcing the codebase to run ambiguous internal timers.

## Decision Outcome

Chosen option: **Deprecate `waitFor(ms)` and split its functionality into two explicit, independent temporal constraints: `holdFor(ms)` and `idleFor(ms)`**.

The engine now decouples the pre-trigger stability validation from the post-trigger throttle window:
* **`holdFor(ms)`**: Defines the continuous duration a hand pose must be stably maintained in front of the camera before the engine qualifies it as a valid activation.
* **`idleFor(ms)`**: Defines the subsequent cooldown period during which the engine completely ignores the gesture after a successful emission, preventing accidental frame-flooding.

### Architectural Impacts

1. **Explicit Engine Pipelines**
   The internal frame evaluator now operates with two distinct timestamp registries per gesture: `firstDetectedTimestamps` (for checking stability thresholds) and `lastIdleTimestamps` (for checking lockout windows).
2. **Deterministic Presets**
   By default, all ready-made presets ship with `0ms` configurations for both fields. This design leaves timing policy entirely to the application layer rather than baking magic numbers into the shared gesture registry.

## Technical Evaluation and Honest Observations

### Pros

- **Semantic Precision:** The developer API reads naturally, directly expressing the physical intention of the gesture.
- **Granular Control:** Allows high-hold, low-cooldown interactions (e.g., fast sequential scrolling that requires an initial stable activation).

### Cons

- **State Overhead:** Tracking two distinct temporal vectors per gesture increases memory lookup overhead in the core execution loop, though the impact remains negligible at 30-60 FPS.