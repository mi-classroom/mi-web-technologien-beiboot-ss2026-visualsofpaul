# Gesture Vocabulary & Library Philosophy

> **Single Source of Truth & Reflection:**
> This document represents the authoritative specification of the `@gestures` ecosystem. It synthesizes and refactors the experimental findings from `apps/02-gesture-detection` and the architectural baselines from `docs/adr-0002-modular-hybrid-pipeline.md`.
>
> **The Philosophy:**
> **Anatomy over Interaction.** Based on real-world prototyping, this package **does not hardcode specific interaction meanings** (like "Next Slide" or "Volume Up"). Instead, it serves as an open, extensible framework. It provides a set of highly optimized **Anatomical Presets** and a fluent **Custom Builder Engine** allowing developers to assemble their own gesture logic like a sentence.

---

## 1. Core Anatomical Presets

The library exports a foundational vocabulary under the `@gestures/presets` subpath. These presets focus purely on the structural state of the hand, exposing rich metadata (`hand: [Left|Right|Both]`, `direction: [Up|Down|Left|Right|Any]`) to the application layer.

| Preset Identifier | Anatomical Description & Core Trigger | Low-Level Constraints (The Fluent DSL Logic) |
| :--- | :--- | :--- |
| **`ThumbsUp`** | A crisp sign where the thumb is extended and all other fingers are tightly curled. <br><br>*Use Case: Ideal for vertical triggers (Up/Down).* | 1. `Thumb` = State: Extended.<br>2. `Index`, `Middle`, `Ring`, `Pinky` = State: Curled.<br>3. `.determineDirectionFrom(Finger.Thumb)` |
| **`Pointer`** | Classic pointing pose with the index finger extended. <br><br>*Use Case: Directional swipes or navigation.* | 1. `Index` = State: Extended.<br>2. `Thumb`, `Middle`, `Ring`, `Pinky` = State: Curled.<br>3. `.determineDirectionFrom(Finger.Index)` |
| **`GunPose`** | Thumb and Index extended, remaining fingers curled (resembling a pistol). <br><br>*Use Case: Dynamic trigger actions.* | 1. `Thumb` + `Index` = State: Extended.<br>2. `Middle`, `Ring`, `Pinky` = State: Curled. |
| **`PinkyPinch`** | The tip of the thumb firmly touches the tip of the pinky, closing an anatomical loop. <br><br>*Use Case: Discrete background toggle / system command.* | 1. `Proximity([Thumb_Tip, Pinky_Tip])` $\le 2\text{cm}$.<br>2. Debounce window: $\ge 200\text{ms}$ to bridge occlusion noise. |
| **`Fist`** | All five fingers are tightly curled into the palm. <br><br>*Use Case: Hard stop or grab modifiers.* | 1. All 5 fingers = State: Curled.<br>2. Rolling average filter to prevent occlusion jitter. |

This presets can be loaded from `@gestures/presets` and used directly in the application code:

```typescript
import { GestureEngine, Direction } from "@gestures";
import { ThumbsUp, Pointer, Fist, PinkyPinch } from "@gestures/presets";

const engine = new GestureEngine();

// Register the raw, predefined anatomical presets
engine.register(ThumbsUp);
engine.register(Pointer);
engine.register(Fist);
engine.register(PinkyPinch);

// Option A: Granular Lifecycle Control (Dedicated Start/Stop Gestures)
engine.onGesture("ThumbsUp", (event) => {
  if (event.hand === "both" && event.direction === Direction.Up) {
    engine.startActiveState();
    console.log("System Active");
  }
});

engine.onGesture("Fist", (event) => {
  if (event.hand === "any") {
    engine.stopActiveState();
    console.log("System Paused");
  }
});

// Option B: Quick Lifecycle Toggle (Single Gesture Inverts Current State)
engine.onGesture("PinkyPinch", (event) => {
  if (event.hand === "right") {
    engine.toggleActiveState();
    console.log(engine.isActive ? "Resumed" : "Muted");
  }
});

// Context-aware execution: Only processes events when active state is true
engine.onGesture("Pointer", (event) => {
  if (!engine.isActive) return;
  
  if (event.direction === Direction.Right) {
    Reveal.next();
  } else if (event.direction === Direction.Left) {
    Reveal.prev();
  }
});

// Execute functions on the active state
engine.onActiveState((event) => {
  if(event.activeState) {
    console.log("System is now active. Listening for gestures...");
  } else {
    console.log("System is now inactive. Ignoring gestures...");
  }
});
```

## 2. The Extensible Building Kit (Custom Gestures)

If the presets are not sufficient, the core strength of the library is its **Fluent API**. New gestures can be registered completely inline within the application code without ever changing the library core.

### Example 1: Building a Custom "Trigger" Action
A developer can combine static presets with dynamic inflection triggers via logical connectors (`and()`, `or()`, `thenTriggeredBy()`):

```typescript
import { Gesture, Finger, State } from "@gestures";

const customClick = Gesture.create("CustomClick")
  .where.anyHand()
    .has(Finger.Index).inState(State.Extended)
    .and()
    .has(Finger.Middle).inState(State.Extended)
  .thenTriggeredBy()
    .curling([Finger.Index, Finger.Middle]) // Detects the rapid contraction
  .withConfidence(0.90);
```

### Example 2: Complex Multi-Hand Coordination via Logical Gates
For sophisticated spatial commands, the API supports combining distinct conditions for the left and right hand using logical combinations. This allows building semantic macros directly at the application layer:

```typescript
import { Gesture, Finger, State, Direction } from "@gestures";

const systemReset = Gesture.create("SystemReset")
  .requireBothHands()
  .where.leftHand()
    .has(Finger.Thumb).inState(State.Extended)
    .and()
    .isPointing(Direction.Up)
  .where.rightHand()
    .isClosedInto(State.Curled) // Full fist shorthand
  .and() // Wait for synchronous hold duration
    .stableFor(500) 
  .withConfidence(0.95);
```

### Example 3: Defining Alternatives using Disjunctions
If an interaction should be triggered by multiple independent anatomical variations, developers can leverage the .either().or() syntax to keep event routing clean and single-channeled:

```typescript
import { Gesture, Direction } from "@gestures";
import { Pointer, GunPose } from "@gestures/presets";

const universalForward = Gesture.create("UniversalForward")
  .either(
    Gesture.fromPreset(Pointer).withDirection(Direction.Right)
  )
  .or(
    Gesture.fromPreset(GunPose).withDirection(Direction.Right)
  );
```