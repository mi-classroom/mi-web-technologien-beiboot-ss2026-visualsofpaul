# Fluent API and Builder Pattern for Type-Safe Gesture Definitions

- **Status:** accepted
- **Workload:** 5h
- **Decider:** Paul Strebinger
- **Date:** 2026-06-25

## Context and Problem Statement

The previous gesture configuration model relied too heavily on large declarative blobs. That approach was brittle for two reasons: it obscured intent during review and it made compile-time validation shallow, because the shape of a gesture was encoded as data rather than as a typed construction process.

The refactoring sprint therefore needed an API that could express gesture semantics as a readable sentence while still preserving the full precision of TypeScript inference. The hard part was not the fluent syntax itself, but ensuring that gesture names remain literal types throughout the builder chain so consumers get autocomplete and exhaustiveness support instead of collapsing into `string` or, worse, `never` at the engine boundary.

## Decision Outcome

Chosen option: **A chained builder API rooted in `Gesture.create(name)` and propagated through generic type retention**.

The public API is intentionally staged. A call such as `Gesture.create("ThumbsUp")` produces a `GestureBuilder<Name>` where the gesture name is stored as a literal generic parameter, not as an erased runtime string. That name is then carried through the registration pipeline so the engine can retain a precise union of supported gesture names.

### Architectural Impacts

1. **Type-safe gesture identity**
   - `Gesture.create<Name extends string>(name: Name)` preserves the literal name as `Name`.
   - `GestureEngine.register()` lifts each builder name into the engine’s `RegisteredGestures` union, allowing `onGesture("LiteralName", ...)` to be checked by the compiler.
2. **Readable, domain-shaped API**
   - The builder syntax mirrors the intent of the gesture definition instead of forcing consumers to manipulate JSON shapes.
   - A sequence such as `Gesture.create(...).where.anyHand().has(...).inState(...).waitFor(...)` keeps the decision logic near the semantics it controls.
3. **Composable rule staging**
   - Base pose rules, trigger fingers, confidence thresholds, and cooldown windows are collected incrementally rather than asserted in one opaque object.
   - This makes incremental extension possible without changing the public API every time a new detector feature appears.

### Code Mechanics

The implementation uses a fluent chain backed by explicit state buckets on the builder:

- `basePoseRules` stores pose constraints.
- `triggerFingers` stores delayed trigger transitions.
- `targetHandMode` stores hand scoping.
- `expectedDirection`, `targetConfidence`, and `cooldownMs` preserve gesture semantics as first-class data.

The type-level win comes from carrying `Name` across the builder and into the engine’s registration signature. That prevents the common failure mode where event APIs become permissive at runtime but unhelpful in tooling, which is exactly the point at which a gesture library stops feeling like infrastructure and starts feeling like a loose helper.

## Technical Evaluation and Honest Observations

The builder pattern produces a significantly better consumer experience, but it also imposes discipline on the implementation. Each chain step must preserve the generic identity cleanly, and each convenience method must return the correct builder stage or inference collapses.

### Pros

- **Strong autocomplete:** Literal gesture names flow into `onGesture()` without manual type annotations.
- **Reviewable intent:** The API reads like a gesture description, which makes architecture reviews and onboarding easier.
- **Extensible state model:** New constraints can be added without breaking consumers who already rely on the existing chain.

### Cons

- **Generic complexity:** The builder and engine signatures become harder to reason about than a plain config object.
- **Implementation fragility:** A small return-type mistake can destroy inference and reintroduce `never` or `string` leakage.

## Links

- [ADR 0003: Monorepo Structure for Development and Package Isolation](./adr-0003-monorepo-structure-for-development-and-package-isolation.md)
- [DOCUMENTATION.md](../DOCUMENTATION.md)
