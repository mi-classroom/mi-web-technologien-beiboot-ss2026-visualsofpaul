# Gestures

`gestures` is a small gesture-recognition library for webcam-based hand tracking. It lets you define gestures in plain, fluent TypeScript and listen for them as simple events in your app.

The package is split into two import paths:

- `gestures` for the core engine, gesture builder, and shared types
- `gestures/presets` for ready-made gestures you can use immediately or customize further

## What it is good for

Use `gestures` when you want to turn hand shapes and finger movements into app actions such as navigation, shortcuts, or system-like controls.

The library works with these ideas:

- Choose which hand should count: left, right, both, or any hand
- Describe finger states such as extended or curled
- Detect pinch-like poses between two fingertips
- Detect a gesture direction from a specific finger
- Trigger a gesture from a follow-up motion, not just a static pose
- Apply cooldowns so gestures do not fire too often

## Quick start

Install the package and import the core API:

```ts
import {
  Finger,
  Gesture,
  GestureEngine,
  State,
  type GestureEvent,
} from "gestures";
import { Presets } from "gestures/presets";
```

Create an engine, register gestures, bind a webcam, and listen for events:

```ts
const engine = new GestureEngine()
  .register(Presets.ThumbsUp("ThumbsUp").holdFor(500).idleFor(1000))
  .register(Presets.Pointer("Pointer"))
  .register(Presets.Gun("Gun"))
  .register(Presets.PinkyPinch("PinkyPinch").asSystemGesture())
  .register(Presets.Fist("Fist").idleFor(1000))
  .register(
    Gesture.create("MiddleFinger")
      .where.anyHand()
      .has(Finger.Middle)
      .inState(State.Extended)
      .has(Finger.Thumb)
      .inState(State.Curled)
      .has(Finger.Index)
      .inState(State.Curled)
      .has(Finger.Ring)
      .inState(State.Curled)
      .has(Finger.Pinky)
      .inState(State.Curled)
      .where.determineDirectionFrom(Finger.Middle),
  );

engine.bindWebcam({
  videoElement: document.getElementById("webcam") as HTMLVideoElement,
});

engine.onGesture("ThumbsUp", (event: GestureEvent) => {
  console.log("Thumbs up detected", event);
});

engine.onGesture("MiddleFinger", (event) => {
  console.log("Custom gesture detected", event);
});
```

## How gestures are built

Gestures are created with the fluent builder returned by `Gesture.create(name)`. The builder reads like a sentence and keeps the gesture definition close to the hand shape it represents.

### Hand selection

- `.where.anyHand()` allows either hand
- `.where.leftHand()` limits the gesture to the left hand
- `.where.rightHand()` limits the gesture to the right hand
- `.where.requireBothHands()` requires both hands

### Finger states

Use `.has(finger).inState(state)` to describe a specific finger:

- `State.Extended`
- `State.Curled`

Examples:

```ts
Gesture.create("ThumbsUp")
  .where.anyHand()
  .has(Finger.Thumb)
  .inState(State.Extended)
  .has(Finger.Index)
  .inState(State.Curled);
```

To describe a full fist or fully open hand, use `.isClosedInto(state)`:

```ts
Gesture.create("Fist")
  .where.anyHand()
  .isClosedInto(State.Curled);
```

### Pinches and direction

Use `.pinches(fingerA, fingerB)` when two fingertips should be close together:

```ts
Gesture.create("PinkyPinch")
  .where.anyHand()
  .pinches(Finger.Thumb, Finger.Pinky);
```

Use `.determineDirectionFrom(finger)` to decide which finger defines the gesture direction:

```ts
Gesture.create("Pointer")
  .where.anyHand()
  .has(Finger.Index)
  .inState(State.Extended)
  .where.determineDirectionFrom(Finger.Index);
```

### Triggered gestures

Some gestures are not just a pose. They start as a base shape and then fire when certain fingers curl.

```ts
Gesture.create("Gun")
  .where.anyHand()
  .has(Finger.Thumb)
  .inState(State.Extended)
  .thenTriggeredBy()
  .curling([Finger.Index])
  .withConfidence(0.75);
```

Use this pattern when you want a gesture to feel like an action, not just a still pose.

### Cooldowns and system gestures

- `.holdFor(ms)` requires the gesture to be held stably for a certain duration before it fires. Perfect for preventing accidental triggers during transition movements.
- `.idleFor(ms)` enforces a cooldown window after the gesture fires. The engine will ignore this specific gesture for the given time, preventing rapid accidental double-triggering.
- `.asSystemGesture()` marks a gesture as globally available. It will still fire even if the engine has been set to an inactive state.

## Presets

Presets are ready-made gestures that save time for common shapes.

| Preset | What it represents |
| --- | --- |
| `Presets.ThumbsUp(name)` | Thumb extended, all other fingers curled |
| `Presets.Pointer(name)` | Index extended, all other fingers curled |
| `Presets.Gun(name)` | Thumb extended, then trigger by curling the index finger |
| `Presets.PinkyPinch(name)` | Thumb and pinky pinch gesture |
| `Presets.Fist(name)` | All fingers curled |

You can use them as-is or keep chaining extra options:

```ts
const pinkyPinch = Presets.PinkyPinch("PinkyPinch").asSystemGesture();
```

## Events

Register a handler with `engine.onGesture(name, callback)`.

The callback receives:

- `name` - The gesture name
- `confidence` - How strongly the gesture matched
- `hand` - `left`, `right`, `both`, or `any`
- `direction` - `Up`, `Down`, `Left`, `Right`, or `Any`
- `timestamp` - When the gesture fired

You can also listen for active state changes:

```ts
engine.onActiveState((event) => {
  console.log("Engine active:", event.activeState);
});
```

## Runtime behavior

The engine only processes webcam frames after `bindWebcam()` has been called. Gestures marked with `.asSystemGesture()` can still be recognized even when the engine is otherwise inactive.

This makes it easy to build interfaces where a single gesture can start or pause the rest of the interaction model.

## Package exports

The package exposes only the public entry points intended for consumers:

- `gestures` for the main API
- `gestures/presets` for the preset collection

This keeps imports clear and lets you choose whether you want the lightweight core API or the convenience presets.