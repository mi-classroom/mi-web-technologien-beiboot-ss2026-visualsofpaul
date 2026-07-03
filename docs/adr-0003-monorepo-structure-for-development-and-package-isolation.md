# Monorepo Structure for Development and Package Isolation

- **Status:** accepted
- **Workload:** 0.5h
- **Decider:** Paul Strebinger
- **Date:** 2026-06-25

## Context and Problem Statement

The refactoring sprint required a hard separation between the production gesture library and the interactive benchmarking surface. A single repository with shared TypeScript sources was no longer sufficient because the core package must remain consumable as a minimal library artifact while the demo application continues to absorb fast iteration, HMR, and experiment-specific dependencies.

The architectural question was not whether to split the codebase, but how to do it without reintroducing the coordination tax that usually appears when a package and its playground evolve in different directions. In particular, we needed a workspace model that preserves local dependency resolution, avoids manual linking, keeps source-to-runtime feedback loops short, and still makes the exported library feel like a standalone product rather than a demo-scoped submodule.

## Decision Outcome

Chosen option: **Bun Workspace Monorepo with a strict production/playground boundary**.

The repository is organized so the production package remains isolated under `packages/gestures` while the benchmarking and gesture-visualization surface lives under `apps/03-demo`. Workspace resolution is handled by Bun, which gives us immediate local package wiring without the operational friction of symlink management, ad hoc path aliases, or duplicated install trees.

### Architectural Impacts

1. **Zero-friction local dependency resolution**
   - The demo can depend on the library exactly as a consumer would, but without publishing or packing the package on every iteration.
   - Workspace references keep package boundaries explicit while still resolving edits immediately during development.
2. **Preserved HMR for the playground**
   - The demo remains a first-class development target with hot updates intact, so UI and gesture-tuning feedback is not blocked by library packaging concerns.
   - The production package can be rebuilt independently without forcing the playground into a full restart cycle.
3. **Isolation of release surface**
   - The library export surface stays narrow and intentional, which reduces the risk of demo-only helpers leaking into the public API.
   - Workspace-level imports keep the refactor honest: if a symbol is not meant for consumers, it does not belong in the library entrypoint.

### Code Mechanics

The split supports a clean ownership model:

- `packages/gestures` owns the engine, builder, presets, and public types.
- `apps/03-demo` owns the benchmarking harness, trace visualization, and runtime experiments.

This arrangement allows the demo to consume the package as an external dependency while still giving developers immediate editability over the underlying source. The result is a faster development loop than a traditional multi-repo setup and a lower coupling profile than direct source imports from the application layer.

## Technical Evaluation and Honest Observations

The Bun workspace model proved strong for rapid setup, but the tradeoff is that the boundary discipline must be enforced intentionally. Once the workspace exists, it becomes easy for application code to reach into library internals if the team is not strict about entrypoints and package exports.

### Pros

- **Fast initial setup:** The monorepo could be partitioned in roughly half an hour, which is materially faster than a publish/consume workflow.
- **Clean dependency topology:** Workspace-managed packages remain locally linked without manual symlink maintenance.
- **High iteration velocity:** The demo keeps HMR, so refactoring the library does not slow down visual benchmarking.

### Cons

- **Boundary leakage risk:** A workspace makes private internals easier to reach if export discipline is not enforced.
- **Toolchain coupling:** The setup assumes Bun workspace semantics; that is excellent for velocity, but it narrows portability compared to a tool-agnostic repository shape.

## Links

- [ADR 0002: Modular Hybrid Pipeline and Spatial Fencing Criteria](./adr-0002-modular-hybrid-pipeline.md)
- [DOCUMENTATION.md](../DOCUMENTATION.md)
