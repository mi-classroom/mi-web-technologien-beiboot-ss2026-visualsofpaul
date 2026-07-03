import type { Landmark } from "@mediapipe/tasks-vision";

import type { DetectionFrame, GestureDetector, GestureResult } from "../types";
import { SignalSmoother } from "./signal-smoother";

export class GestureEngine {
	private detectors: GestureDetector[] = [];
	private handSmoother = new SignalSmoother(5); // Buffer size of 5 frames
	private poseSmoother = new SignalSmoother(5); // Buffer size of 5 frames

	public use(detector: GestureDetector): this {
		this.detectors.push(detector);
		return this;
	}

	public analyze(
		hand: Landmark[] | null,
		pose: Landmark[] | null,
	): GestureResult {
		// Step 1: Smooth the incoming landmarks to reduce noise
		let processedHand: Landmark[] | null = null;
		if (hand && hand.length > 0) {
			const stableHand = this.handSmoother.smooth(hand);
			processedHand = stableHand.map((landmark) => ({
				...landmark,
				x: 1 - landmark.x,
			}));
		}

		let processedPose: Landmark[] | null = null;
		if (pose && pose.length > 0) {
			const stablePose = this.poseSmoother.smooth(pose);
			processedPose = stablePose.map((landmark) => ({
				...landmark,
				x: 1 - landmark.x,
			}));
		}

		// Step 2: Check fences and time gates
		const frame: DetectionFrame = {
			handLandmarks: processedHand,
			poseLandmarks: processedPose,
		};

		for (const detector of this.detectors) {
			const result = detector.process(frame);
			if (result.detected) return result;
		}

		// Step 3: If no gesture is detected, return a default response
		return {
			detected: false,
			name: "NONE",
			type: "near",
			confidence: 0,
		};
	}
}
