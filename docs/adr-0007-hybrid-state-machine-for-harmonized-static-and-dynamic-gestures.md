# Hybrid State Machine for Harmonized Static and Dynamic Gestures

- **Status:** accepted
- **Workload:** 4.0h
- **Decider:** Paul Strebinger
- **Date:** 2026-06-25

## Context and Problem Statement

The library needed to unify two gesture families that behave differently at runtime. Static gestures are simple pose assertions that should fire when a hand shape is present for long enough. Dynamic gestures begin as a stable pose and only fire after a follow-up transition, such as curled fingers or another motion threshold.

Implementing these as separate pipelines would have duplicated the same hand filtering, rule evaluation, cooldown logic, and active-state bookkeeping. However, collapsing them too early risks losing the semantic difference between “hold this state” and “enter this state, then complete a transition.” The architecture therefore needed a unified matcher that can represent both the static hold and the dynamic trigger without conflating their time semantics.

## Decision Outcome

Chosen option: **A hybrid state machine that normalizes static and dynamic gestures into one pipeline rule-matcher**.

The engine now treats a gesture as a sequence of stages: base pose validation, trigger readiness, trigger completion, and cooldown enforcement. Static gestures simply never enter the trigger sub-state, while dynamic gestures use it to track the interval between the initial pose and the follow-up motion.

### Architectural Impacts

1. **Single execution model**
   - Static and dynamic gestures share the same evaluation loop and listener dispatch path.
   - The engine no longer needs separate subsystems for hold-based and transition-based gestures.
2. **Explicit temporal semantics**
   - `waitFor(ms)` defines the cooldown window, while the dynamic trigger stage defines the readiness window.
   - The state machine makes it clear when a gesture is merely observed versus when it is eligible to emit.
3. **Reduced Midas-Touch behavior**
   - Immediate resets such as `activeFrames = 0` are applied when the base pose or direction breaks.
   - That prevents partially completed gestures from leaking into later frames and firing after the user has already moved on.

### Code Mechanics

The matcher uses a small set of internal states, including a waiting state and a ready state, to track whether a dynamic gesture has seen the correct base pose long enough to expect the trigger transition.

The critical distinction is that the state machine resets on semantic failure, not merely on time expiry. If a base pose disappears or the direction constraint no longer matches, the gesture returns to the waiting state immediately. That behavior prevents stale confidence accumulation and avoids the false continuity that usually causes gesture systems to feel sticky or haunted.

This hybrid approach also makes frame counters usable again. Static gestures remain direct enough to be evaluated as pose assertions, while dynamic gestures gain a temporal buffer that protects them from one-frame noise without requiring a second separate pipeline.

## Technical Evaluation and Honest Observations

The unified matcher is the right abstraction, but it is only reliable if the state transitions remain strict. Too much leniency makes the engine tolerant of noise; too much eagerness makes it brittle during real-world motion.

### Pros

- **One pipeline, two gesture semantics:** The implementation stays compact without flattening the behavior model.
- **Better temporal control:** Dynamic gestures can wait for completion while static gestures emit immediately once stable.
- **Less state leakage:** Reset behavior is explicit, which reduces the chance of ghost activations.

### Cons

- **State machine complexity:** The matcher is more difficult to reason about than a simple threshold check.
- **Edge-case sensitivity:** Frame drops or ambiguous mid-transition poses can still force conservative resets.

## Links

- [ADR 0006: Lifecycle State Separation via System Gesture Flags (The Logic Gap)](./adr-0006-lifecycle-state-separation-via-system-gesture-flags-the-logic-gap.md)
- [DOCUMENTATION.md](../DOCUMENTATION.md)
