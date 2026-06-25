import type {
	DetectionFrame,
	DetectionType,
	GestureDetector,
	GestureResult,
} from "../types";

export class FarNavigationDetector implements GestureDetector {
	public name = "Far Navigation (Next/Back)";
	public type: DetectionType = "far";

	private nextFrames = 0;
	private backFrames = 0;
	private readonly requiredFrames = 8; // ~200ms for smooth flicking detection

	public process(frame: DetectionFrame): GestureResult {
		const { poseLandmarks: landmarks } = frame;

		if (!landmarks) return this.fail();

		// Relevant ankles of both arms
		const leftShoulder = landmarks[11];
		const leftElbow = landmarks[13];
		const leftWrist = landmarks[15];

		const rightShoulder = landmarks[12];
		const rightElbow = landmarks[14];
		const rightWrist = landmarks[16];

		const HORIZONTAL_STRETCH_THRESHOLD = 0.08;

		let currentFrameDetection: "NEXT" | "BACK" | "NONE" = "NONE";

		// Gesture A1: Next (Right arm shows to the right)
		if (rightShoulder && rightElbow && rightWrist) {
			const isRightExtendedOutward =
				rightWrist.x > rightElbow.x + HORIZONTAL_STRETCH_THRESHOLD &&
				rightElbow.x > rightShoulder.x;

			if (isRightExtendedOutward) {
				currentFrameDetection = "NEXT";
			}
		}

		// Gesture A2: Back (Left arm shows to the left)
		if (
			currentFrameDetection === "NONE" &&
			leftShoulder &&
			leftElbow &&
			leftWrist
		) {
			const isLeftExtendedOutward =
				leftWrist.x < leftElbow.x - HORIZONTAL_STRETCH_THRESHOLD &&
				leftElbow.x < leftShoulder.x;

			if (isLeftExtendedOutward) {
				currentFrameDetection = "BACK";
			}
		}

		// Step 3: Time gate to ensure gesture is held for a short duration to avoid flickering
		if (currentFrameDetection === "NEXT") {
			this.nextFrames++;
			this.backFrames = 0;

			if (this.nextFrames >= this.requiredFrames) {
				return {
					detected: true,
					name: "NAVIGATE_NEXT",
					type: this.type,
					confidence: 0.85,
				};
			}
			return this.fail();
		}

		if (currentFrameDetection === "BACK") {
			this.backFrames++;
			this.nextFrames = 0;

			if (this.backFrames >= this.requiredFrames) {
				return {
					detected: true,
					name: "NAVIGATE_BACK",
					type: this.type,
					confidence: 0.85,
				};
			}
			return this.fail();
		}

		// If no gesture detected, reset counters and return fail
		this.resetCounters();
		return this.fail();
	}

	private resetCounters(): void {
		this.nextFrames = 0;
		this.backFrames = 0;
	}

	private fail(): GestureResult {
		return {
			detected: false,
			name: "NONE",
			type: this.type,
			confidence: 0,
		};
	}
}
