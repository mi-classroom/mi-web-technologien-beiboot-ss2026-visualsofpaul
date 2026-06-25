import type {
  GestureDetector,
  DetectionType,
  GestureResult,
  DetectionFrame,
} from "../types";

export class FarStartDetector implements GestureDetector {
  public name = "Start Gesture Control (Far)";
  public type: DetectionType = "far";

  private activeFrames = 0;
  private readonly requiredFrames = 15; // ~500ms at 30fps

  public process(frame: DetectionFrame): GestureResult {
    const { poseLandmarks: landmarks } = frame;

    if (!landmarks) return this.fail();

    const configurations = [
      {
        shoulder: landmarks[12],
        elbow: landmarks[14],
        wrist: landmarks[16],
        side: "RIGHT",
      },
      {
        shoulder: landmarks[11],
        elbow: landmarks[13],
        wrist: landmarks[15],
        side: "LEFT",
      },
    ];

    let gestureDetectedInThisFrame = false;
    let detectedSide: "RIGHT" | "LEFT" | "NONE" = "NONE";

    for (const config of configurations) {
      const { shoulder, elbow, wrist, side } = config;

      if (!shoulder || !elbow || !wrist) continue;

      const elbowAtShoulderHight = Math.abs(elbow.y - shoulder.y) < 0.12;
      const handAboveElbow = wrist.y < elbow.y - 0.15;
      const upperArmExtended = Math.abs(elbow.x - shoulder.x) > 0.15;

      if (elbowAtShoulderHight && handAboveElbow && upperArmExtended) {
        gestureDetectedInThisFrame = true;
        detectedSide = side as "RIGHT" | "LEFT";
        break; // No need to check the other arm if one already shows the gesture
      }
    }

    if (gestureDetectedInThisFrame) {
      this.activeFrames++;
      if (this.activeFrames >= this.requiredFrames) {
        return {
          detected: true,
          name: `START_CONTROL_${detectedSide}`,
          type: this.type,
          confidence: 0.85,
        };
      }
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
