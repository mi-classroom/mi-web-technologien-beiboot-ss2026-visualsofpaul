# Lifecycle State Separation via System Gesture Flags (The Logic Gap)

- **Status:** accepted
- **Workload:** 5.0h
- **Decider:** Paul Strebinger
- **Date:** 2026-06-25

## Context and Problem Statement

The engine has a deliberate inactive mode to conserve resources when gesture recognition is not supposed to drive the application. That state reduces frame evaluation cost, skips gesture matching, and keeps the runtime quiet. The problem appears when the system still needs a gesture to bring itself back online.

This creates a control paradox: if every gesture obeys the inactive guard, then the engine can be disabled into a state from which no user gesture can re-enable it. The architecture therefore needed a narrow escape hatch for background-safe gestures that can still be recognized while the global loop is dormant.

## Decision Outcome

Chosen option: **Introduce `.asSystemGesture()` as an explicit bypass flag for selected lightweight gestures**.

Gestures marked as system gestures are evaluated even when the engine is not in its active state. This allows a minimal control macro, such as `PinkyPinch`, to act as a lifecycle toggle and safely re-arm the engine without requiring an external UI button or separate control channel.

### Architectural Impacts

1. **Solves the standby lock-out**
   - The inactive state no longer becomes terminal.
   - A narrowly approved gesture can restore the engine without violating the resource-saving goal of inactivity.
2. **Preserves power discipline**
   - Only gestures explicitly flagged with `.asSystemGesture()` are allowed through the inactive guard.
   - The rest of the recognizer remains dormant and does not pay evaluation costs unnecessarily.
3. **Encodes intent in the API**
   - Lifecycle-control gestures are visible in code rather than hidden behind a special-case registry.
   - The system behavior is opt-in and auditable, which matters for anything that toggles application-wide state.

### Code Mechanics

The engine gate checks the global state before evaluating each registered gesture. If the engine is inactive, the evaluation path skips every ordinary gesture and only processes builders whose `isSystemTrigger` flag is set by `.asSystemGesture()`.

That flag is intentionally narrow. It does not make the gesture “more powerful” in general; it only exempts the gesture from the inactive guard. This distinction matters because the gesture still passes through the same rule evaluation, direction checks, trigger logic, and cooldown controls as any other gesture.

In practical terms, the pattern allows a minimal background macro to toggle the engine state while avoiding a second parallel control subsystem. That keeps the architecture single-purpose and prevents lifecycle state from leaking into unrelated gesture logic.

## Technical Evaluation and Honest Observations

The bypass is effective, but it must remain constrained. If system gestures are overused, the inactive state stops being a meaningful power-saving mechanism and becomes merely a soft suggestion.

### Pros

- **No lock-out condition:** The engine can always be reactivated by an approved gesture.
- **Low complexity at runtime:** A boolean flag is enough to express the exception path.
- **Explicit lifecycle semantics:** The code makes the distinction between ordinary and system gestures visible.

### Cons

- **Security and UX sensitivity:** A system gesture is effectively a privileged control surface and should be chosen carefully.
- **Policy drift risk:** If too many gestures are granted bypass access, the inactive mode loses its architectural value.

## Links

- [ADR 0005: Architectural Separation of Core Engine and Anatomical Presets](./adr-0005-architectural-separation-of-core-engine-and-anatomical-presets.md)
- [DOCUMENTATION.md](../DOCUMENTATION.md)
