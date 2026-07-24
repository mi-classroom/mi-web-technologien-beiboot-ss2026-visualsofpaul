# Unifying the Fluent Builder Return Type to Eliminate State Traps

- **Status:** accepted
- **Workload:** 1.0h
- **Decider:** Paul Strebinger
- **Date:** 2026-07-10

## Context and Problem Statement

The original `Gesture.create(name)` API utilized a progressively restricted fluent builder interface. As developers chained structural rules (moving from `.where` to `.has` or `.thenTriggeredBy`), the methods returned specialized sub-interfaces (e.g., `HandBuilder`, `TriggerBuilder`). 

While this design theoretically guided the user through a logical sequence, it created an explicit usability trap. If an end-user wanted to jump back and add another finger state constraint after defining a direction rule, the type system blocked them. The developer was forced to structure their definitions in a rigid, brittle sequence. This friction severely undermined the "plain text sentence" philosophy of the library and required consumers to understand the engine's internal configuration phases just to build a custom shape.

## Decision Outcome

Chosen option: **Refactor all fluent builder methods to continuously return the root builder instance, keeping the API surface entirely flat**.

Instead of transitioning through distinct type states, every configuration method (`.where`, `.has`, `.inState`, `.idleFor`) now alters the internal configuration object and returns `this` typed as the comprehensive, unified builder interface.

### Architectural Impacts

1. **Order-Independent Configuration**
   Developers can now chain rules in whatever sequence matches their mental model. A gesture can declare its hand selection before, during, or after its finger assertions without breaking compile-time checks.
2. **Simplified Preset Extension**
   Because presets now return the unified root builder, consumers can instantly chain structural modifications onto an imported preset (e.g., `Presets.Fist("CustomFist").where.leftHand().idleFor(200)`) without the builder getting stuck in a restricted sub-state.

## Technical Evaluation and Honest Observations

### Pros

- **Ergonomic Freedom:** The API truly feels like an unrestricted, natural sentence. The learning curve for writing custom gestures drops to zero.
- **Drastically Lower Maintenance:** Removing multiple inter-dependent interfaces shrinks the builder codebase and eliminates complex TypeScript generics mapping.

### Cons

- **Loss of Structural Guarantees:** The compiler no longer prevents nonsensical chains (such as declaring `.inState()` without a preceding `.has()`). The engine must now catch these structural anomalies via runtime validation when the gesture is registered.