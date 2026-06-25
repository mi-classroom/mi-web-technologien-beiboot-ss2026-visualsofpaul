import type { Landmark } from "@mediapipe/tasks-vision";

import type {
  DetectionType,
  GestureDetector,
  GestureResult,
  DetectionFrame,
} from "../types";

export class NavigationDetector implements GestureDetector {
  public name = "Navigation (Next/Back)";
  public type: DetectionType = "near";

  private nextFrames = 0;
  private backFrames = 0;
  private readonly requiredFrames = 8; // ~200ms

  public process(frame: DetectionFrame): GestureResult {
    const { handLandmarks: landmarks } = frame;

    if (!landmarks) return this.fail();

    // Key landmarks for navigation detection
    const indexTip = landmarks[8];
    const indexPip = landmarks[6];
    const indexMcp = landmarks[5]; // Stable anchor point

    // Key landmarks for finger folding detection
    const middleTip = landmarks[12];
    const ringMcp = landmarks[13];
    const ringTip = landmarks[16];
    const pinkyMcp = landmarks[17];
    const pinkyTip = landmarks[20];

    // Step 1: Validate landmarks
    if (
      !indexTip ||
      !indexPip ||
      !indexMcp ||
      !middleTip ||
      !ringMcp ||
      !ringTip ||
      !pinkyMcp ||
      !pinkyTip
    )
      return this.fail();

    // Step 2: Check if the index finger is extended (for navigation) and other fingers are folded
    const fingersFolded =
      middleTip.y > indexPip.y &&
      ringTip.y > indexPip.y &&
      pinkyTip.y > indexPip.y;

    if (!fingersFolded) {
      this.resetCounters();
      return this.fail();
    }

    const HORIZONTAL_THRESHOLD = 0.12;

    // Gesture A1: Next (Index finger shows to the right)
    if (indexTip.x > indexMcp.x + HORIZONTAL_THRESHOLD) {
      this.nextFrames++;
      this.backFrames = 0; // Reset back counter

      if (this.nextFrames >= this.requiredFrames)
        return {
          detected: true,
          name: "NEXT",
          type: this.type,
          confidence: 0.9,
        };
    }

    // Gesture A2: Back (Index finger shows to the left)
    else if (indexTip.x < indexMcp.x - HORIZONTAL_THRESHOLD) {
      this.backFrames++;
      this.nextFrames = 0; // Reset next counter

      if (this.backFrames >= this.requiredFrames)
        return {
          detected: true,
          name: "BACK",
          type: this.type,
          confidence: 0.9,
        };
    }

    // If neither gesture is detected, reset counters and return no detection
    else {
      this.resetCounters();
    }

    return this.fail();
  }

  private resetCounters(): void {
    this.nextFrames = 0;
    this.backFrames = 0;
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
