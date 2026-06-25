import type { Landmark } from "@mediapipe/tasks-vision";

import type {
  DetectionType,
  GestureDetector,
  GestureResult,
  DetectionFrame,
} from "../types";

export class StartDetector implements GestureDetector {
  public name = "Start Gesture Control";
  public type: DetectionType = "near";

  private activeFrames = 0;
  private readonly requiredFrames = 8; // ~200ms

  public process(frame: DetectionFrame): GestureResult {
    const { handLandmarks: landmarks } = frame;

    if (!landmarks) return this.fail();

    // Key landmarks for start gesture detection
    const thumbTip = landmarks[4];
    const pinkyTip = landmarks[20];

    // Step 1: Validate landmarks
    if (!thumbTip || !pinkyTip) return this.fail();

    // Step 2: Check if thumb and pinky are close together (indicating a "pinch" gesture)
    const distance2D = Math.sqrt(
      Math.pow(thumbTip.x - pinkyTip.x, 2) +
        Math.pow(thumbTip.y - pinkyTip.y, 2),
    );

    const isPinching = distance2D < 0.025; // Threshold for pinch detection

    if (isPinching) {
      this.activeFrames++;
      if (this.activeFrames >= this.requiredFrames)
        return {
          detected: true,
          name: "START_CONTROL",
          type: this.type,
          confidence: 0.85,
        };
    } else {
      this.activeFrames = 0;
    }

    return this.fail();
  }

  private fail() {
    return {
      detected: false,
      name: "NONE",
      type: this.type,
      confidence: 0,
    };
  }
}
