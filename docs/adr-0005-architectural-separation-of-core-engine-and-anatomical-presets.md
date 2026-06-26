# Architectural Separation of Core Engine and Anatomical Presets

- **Status:** accepted
- **Workload:** 1.5h
- **Decider:** Paul Strebinger
- **Date:** 2026-06-25

## Context and Problem Statement

The gesture library needed to avoid turning every consumer into a bundle-tax payer for gestures they do not use. A monolithic export surface would have made the package easier to browse, but it would also have forced the core engine, the builder primitives, and the preset catalog into the same dependency graph, limiting tree-shaking and making the package feel heavier than necessary.

The key architectural problem was therefore one of byte ownership: how do we expose ergonomic presets without forcing the runtime to retain preset code when a consumer only wants the core engine and a few hand-authored gestures?

## Decision Outcome

Chosen option: **Split the public surface into `gestures` and `gestures/presets`**.

The core entrypoint exports the engine, builder, and shared types. The preset entrypoint exports ready-made gesture factories as an optional add-on. This preserves a minimal default import path while still giving consumers a convenient higher-level catalog when they want it.

### Architectural Impacts

1. **Sharper bundle boundaries**
   - Consumers importing only `gestures` do not automatically inherit the preset catalog.
   - The default bundle remains focused on the engine, which is the actual runtime dependency of most applications.
2. **Aggressive tree-shaking**
   - Presets remain isolated behind a separate entrypoint, so unused gestures can fall out of the production build cleanly.
   - The library no longer has to pay for every convenience helper when only one or two are needed.
3. **Clear API layering**
   - Core primitives stay low-level and composable.
   - Presets become a convenience layer, not a required abstraction.

### Code Mechanics

The separation is enforced at the package export level rather than by convention alone. That means the runtime shape mirrors the conceptual layering:

- `gestures` contains the public engine and builder primitives.
- `gestures/presets` contains named factory functions such as `ThumbsUp`, `Pointer`, `Gun`, `PinkyPinch`, and `Fist`.

The preset module itself is still built from the same fluent core, which is important because it prevents the preset layer from becoming a second implementation path. Instead, presets are merely named, curated instantiations of the builder API.

## Technical Evaluation and Honest Observations

This split is mechanically simple but architecturally valuable. It reduces accidental coupling and gives the bundler enough information to remove dead code, but it also means the team must respect entrypoint intent during future additions.

### Pros

- **Lower default payload:** Consumers only import the preset layer when they explicitly need it.
- **Better API clarity:** The core package and the preset catalog have different jobs and now advertise that difference.
- **Improved maintainability:** Presets can evolve independently without bloating the core engine surface.

### Cons

- **More import choices:** Consumers must choose the right path instead of relying on one catch-all export.
- **Potential duplication pressure:** New presets must be checked against the core primitives to avoid re-encoding logic that already belongs in the engine.

## Links

- [ADR 0004: Fluent API and Builder Pattern for Type-Safe Gesture Definitions](./adr-0004-fluent-api-and-builder-pattern-for-type-safe-gesture-definitions.md)
- [DOCUMENTATION.md](../DOCUMENTATION.md)
