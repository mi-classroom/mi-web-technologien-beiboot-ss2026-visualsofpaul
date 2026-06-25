# Modular Hybrid Pipeline and Spatial Fencing Criteria

- **Status:** accepted
- **Workload:** 8h
- **Decider:** [Paul Strebinger](https://github.com/visualsofpaul)
- **Date:** 2026-05-29

## Context and Problem Statement

Following the initial Proof of Concept, the project requires the implementation of a scalable gesture recognition core for a package architecture. The system must process both near-range interactions (hand level) and far-range controls (body level).

The primary challenge shifts from raw performance analysis to software engineering: How do we translate highly volatile coordinate streams (exhibiting significant jitter and tracking losses during occlusions) into stable, deliberate, and discrete interaction states while ensuring code extensibility, preventing false positives, and solving the _Midas Touch_ problem?

## Decision Outcome

Chosen option: **Chained-Function Pipeline with Anatomically Relative Spatial Fences and Temporal Gating**.

The architecture was designed as a modular pipeline using a fluent API (`engine.use()`). Instead of binding heuristics to absolute pixels or camera-space coordinates, the gesture logic was refactored to rely exclusively on relative anatomical vectors.

### Selected Gestures for Implementation

1. **System Activation Trigger ("Start gesture control")**
   - **Near-Range:** Pinch gesture via Thumb-Tip and Pinky-Tip (`START_CONTROL`).
   - **Far-Range:** Right or Left arm raised vertically, bent at a 90 degree elbow angle (`START_FAR_LEFT` / `START_FAR_RIGHT`).
   - **Rationale:** Selected as a high-risk, noise-prone category to prove that a binary system state change can be reliably decoupled from the documented "Phantom-Point" occlusion noise (0.022 jitter).
2. **Directional Steering ("Next" & "Back")**
   - **Near-Range:** Index finger pointing horizontally (`NEXT` / `BACK`).
   - **Far-Range:** Outward lateral extension of the entire arm assembly (`NEXT` / `BACK`).
   - **Rationale:** Selected as a high-stability, deterministic category to validate horizontal mirror-image calculations and responsive boundary metrics.

## Heuristics and Algorithmic Implementation

### 1. Signal Stabilization (The Source Filter)

To mitigate coordinate fluctuation without introducing catastrophic input lag, the `GestureEngine` orchestrates two isolated instances of a rolling-window filter (`SignalSmoother`, window size = 5 frames).

- One filter handles the 21 Hand Landmarks.
- One filter handles the 33 Pose Landmarks.
  By keeping the buffers independent, tracking loss in one domain (e.g., getting too close to the camera, dropping the body pose) does not corrupt or wipe out the active coordinate memory of the other.

### 2. Intuitive Input Mirroring

To align algorithmic assessment with user ergonomics, all coordinates are mirrored directly at the engine's source using:
$$x_{\text{mirrored}} = 1 - x_{\text{raw}}$$
This ensures that when a user moves an extremity to their physical right, the algorithm processes a larger $x$-coordinate, keeping the threshold parameters intuitive across all downstream modules.

### 3. Anatomically Relative Spatial Fences

To build an environment- and scale-agnostic framework, absolute thresholds were eliminated in favor of joint-relative vectors:

- **Near-Range Navigation:** The Index Finger Tip (Landmark 8) is evaluated relative to its own MCP knuckle base (Landmark 5) rather than the hand center:
  $$\text{Next Geste: } x_{\text{tip}} > x_{\text{mcp}} + 0.08$$
  This allows the system to work regardless of hand width or camera distance.
- **Far-Range Navigation:** Rather than calculating strict, fragile horizontal lines, the system evaluates the relative outward progression of the limb chain:
  $$\text{Right Arm Outward: } x_{\text{wrist}} > x_{\text{elbow}} + 0.08 > x_{\text{shoulder}}$$
  This configuration eliminates vertical tracking dependencies (`VERTICAL_TOLERANCE`), allowing the arm to relax or stretch at arbitrary diagonal angles.

### 4. Temporal Gating (Time-Windows)

To prevent accidental triggers from fleeting, transitional movements, every detector implements an isolated frame-counter accumulation gate.

- **Near-Range:** Requires 8 consecutive frames (~200ms at 40 FPS).
- **Far-Range:** Requires 15 consecutive frames (~500ms at 30 FPS).
  Any break in the spatial fence condition instantaneously resets the counter to zero (`this.activeFrames = 0`), filtering out random kinesis.

## Technical Evaluation and Honest Observations

The system was evaluated via a live, client-side Canvas demo showing continuous rendering of multi-model bone structures (using dedicated connectivity matrices for both hand joints and shoulder/arm segments).

### Current Deficits and Future Iterations

While the adjusted thresholds successfully balanced ergonomic comfort with trigger reliability in a controlled home-office desktop setting, substantial edge cases remain:

1. **Occlusion-Induced Jitter:** In the near-range pinch (`StartDetector`), the actual landmark coordinates still undergo heavy distortion when the fingers overlap. Raising the threshold to `0.025` successfully bridged the noise floor but widened the activation fence, making the trigger highly sensitive.
2. **False Positives During Transitions:** Relaxing the vertical constraints on far-range navigation significantly increased user comfort but introduced a new weakness: natural, casual arm-swinging movements while speaking or adjusting postures occasionally cross the spatial criteria ($x_{\text{wrist}} > x_{\text{elbow}} > x_{\text{shoulder}}$) for long enough to breach the 500ms temporal gate.
3. **Context Disconnect:** The current testing environment (sitting directly in front of a development monitor) does not accurately emulate a real-world presentation layout (standing up, shifting body angles, changing lighting conditions).

Future iterations must focus on a secondary filtering layer, such as velocity tracking or calculating the acceleration delta of specific key joints—to clearly differentiate an active, intentional swipe gesture from a passive postural shift.

## Pros and Cons of the Current Engine

### Pros

- **Extremely Maintainable:** The functional chaining pattern (`.use()`) respects the Open-Closed Principle. Far-range features were integrated without altering a single line of near-range logic.
- **Hardware-Agnostic:** Relative joint scaling ensures flawless execution regardless of whether a user sits close to the lens or stands meters back.

### Cons

- **Dual-Model Overhead:** Running both `HandLandmarker` and `PoseLandmarker` concurrently inside the `CameraService` increases GPU utilization, making the execution path vulnerable on low-spec mobile units.
- **State Leakage:** Simple frame counters lack contextual awareness; a gesture starting accidentally and halting halfway through can cause stutter if frames drop unexpectedly.

## Links

- [ADR 0001: Selection of MediaPipe for Body Tracking Analysis](./adr-0001-selection-of-mediapipe-for-body-tracking-analysis.md)
- [Gesture Vocabulary Matrix (GESTURES.md)](../apps/02-gesture-detection/GESTURES.md)
