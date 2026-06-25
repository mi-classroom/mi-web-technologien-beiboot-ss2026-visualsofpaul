import type { Landmark } from "@mediapipe/tasks-vision";

export type DetectionType = "near" | "far";

export interface DetectionFrame {
	handLandmarks: Landmark[] | null;
	poseLandmarks: Landmark[] | null;
}

export interface GestureResult {
	detected: boolean;
	name: string;
	type: DetectionType;
	confidence: number;
}

export interface GestureDetector {
	name: string;
	type: DetectionType;
	process(frame: DetectionFrame): GestureResult;
}
