# Gesture Vocabulary & Library Philosophy

> **Single Source of Truth & Reflection:**
> This document represents the authoritative specification of the `gestures` ecosystem. It synthesizes the production-ready implementation of the fluent API, the engine pipeline, and the optimized anatomical presets.
>
> **The Philosophy:**
> **Anatomy over Interaction.** This package **does not hardcode specific interaction meanings** (like "Next Slide" or "Volume Up"). Instead, it serves as an open, extensible framework. It provides a set of highly optimized **Anatomical Presets** and a fluent **Custom Builder Engine** allowing developers to assemble their own gesture logic like a sentence.

## 1. Core Anatomical Presets

The library exports a foundational vocabulary under the `gestures/presets` subpath. These presets focus purely on the structural state of the hand, exposing rich metadata (`hand: "left" | "right" | "both" | "any"`, `direction: Direction`) to the application layer.

| Preset Identifier | Anatomical Description & Core Trigger | Low-Level Constraints (The Fluent DSL Logic) |
| :--- | :--- | :--- |
| **`Presets.ThumbsUp`** | A crisp sign where the thumb is extended and all other fingers are tightly curled. <br><br>*Use Case: Vertical triggers / approval signals.* | 1. `Thumb` = State: Extended.<br>2. `Index`, `Middle`, `Ring`, `Pinky` = State: Curled.<br>3. `.determineDirectionFrom(Finger.Thumb)` |
| **`Presets.Pointer`** | Classic pointing pose with the index finger extended. <br><br>*Use Case: Directional swipes or navigation.* | 1. `Index` = State: Extended.<br>2. `Thumb`, `Middle`, `Ring`, `Pinky` = State: Curled.<br>3. `.determineDirectionFrom(Finger.Index)` |
| **`Presets.Gun`** | Thumb and Index extended, remaining fingers curled (resembling a pistol). The gesture triggers when the index finger gets curled. <br><br>*Use Case: Dynamic trigger actions.* | 1. `Thumb` + `Index` = State: Extended.<br>2. `Middle`, `Ring`, `Pinky` = State: Curled. |
| **`Presets.PinkyPinch`** | The tip of the thumb firmly touches the tip of the pinky, closing an anatomical loop. <br><br>*Use Case: Discrete background toggle / system command.* | 1. `pinches(Finger.Thumb, Finger.Pinky)` (Tip Proximity).<br>2. Built-in stabilization to bridge occlusion noise. |
| **`Presets.Fist`** | All five fingers are tightly curled into the palm. <br><br>*Use Case: Hard stop or grab modifiers.* | 1. All 5 fingers = State: Curled via `.isClosedInto(State.Curled)`. |

These presets are instantiated with a custom runtime identifier string and can be registered directly into the engine pipeline:

```typescript
import { GestureEngine, Direction, Gesture, Finger, State } from "gestures";
import { Presets } from "gestures/presets";

const engine = new GestureEngine()
  .register(Presets.ThumbsUp("ThumbsUp"))
  .register(Presets.Pointer("Pointer"))
  .register(Presets.Fist("Fist"))
  // Mark as system gesture to keep it active even when the engine is paused
  .register(Presets.PinkyPinch("PinkyPinch").asSystemGesture());

engine.bindWebcam({
  videoElement: document.getElementById("webcam") as HTMLVideoElement,
});

// Option A: Quick Lifecycle Toggle (System gesture runs in background)
engine.onGesture("PinkyPinch", (event) => {
  engine.toggleActiveState();
  console.log(engine.isActive ? "Resumed tracking" : "Muted tracking");
});

// Option B: Context-aware execution (Only processes events when active state is true)
engine.onGesture("Pointer", (event) => {
  if (event.direction === Direction.Right) {
    console.log("Swipe Right 👉");
  } else if (event.direction === Direction.Left) {
    console.log("Swipe Left 👈");
  }
});

engine.onGesture("ThumbsUp", (event) => {
  console.log("Thumbs Up Detected 👍", event);
});

// Execute functions on active state changes
engine.onActiveState((event) => {
  console.log("Gesture detection active state changed:", event.activeState);
});
```

## 2. The Extensible Building Kit (Custom Gestures)

If the presets are not sufficient, the core strength of the library is its **Fluent API**. New gestures can be registered completely inline within the application code without ever changing the library core.

### Example 1: Building a Custom "Peak" Action
A developer can combine static base poses with dynamic inflection triggers via `.thenTriggeredBy().curling()`. The state machine tracks the transition from the uncurled base pose to the curled state:

```typescript
import { Gesture, Finger, State } from "gestures";

const customClick = Gesture.create("CustomClick")
  .where.anyHand()
  .has(Finger.Thumb).inState(State.Extended)
  .thenTriggeredBy()
  .curling([Finger.Index, Finger.Middle]) // Triggers on rapid contraction
  .stableFor(400) // Require stable hold of the trigger
  .withConfidence(0.75);
```

### Example 2: Hold-to-Trigger Gestures (No Dynamic Trigger)
If a gesture does not have a dynamic "click" action but instead requires the user to intentionally hold a specific anatomical pose for a period of time, use `.waitFor(ms)` to prevent accidental triggers:

```typescript
import { Gesture, Finger, State } from "gestures";

const offensiveManeuver = Gesture.create("MiddleFinger")
  .where.anyHand()
  .has(Finger.Middle).inState(State.Extended)
  .has(Finger.Thumb).inState(State.Curled)
  .has(Finger.Index).inState(State.Curled)
  .has(Finger.Ring).inState(State.Curled)
  .has(Finger.Pinky).inState(State.Curled)
  .where.determineDirectionFrom(Finger.Middle)
  .waitFor(2000); // Must be intentionally held for 2 seconds to fire
```

### Example 3: Complex Multi-Hand Coordination
For sophisticated spatial commands, the API supports combining distinct conditions for the left and right hand using chains. This allows building semantic macros directly at the application layer:

```typescript
import { Gesture, Finger, State, Direction } from "gestures";

const systemReset = Gesture.create("SystemReset")
  .requireBothHands() // Enforces multi-hand checking
  .has(Finger.Thumb).inState(State.Extended)
  .isPointing(Direction.Up)
  .stableFor(500);
```