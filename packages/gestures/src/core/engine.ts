import type { GestureBuilder } from "@/core/builder";
import {
	type ActiveStateEvent,
	Direction,
	type GestureEvent,
	type HandLandmarks,
	State,
	type WebcamOptions,
} from "@/core/types";

import { FingerStateRule } from "./rules";
import { calculateFingerDirection } from "./utils";

const FINGER_MCP_INDEX = { Thumb: 2, Index: 5, Middle: 9, Ring: 13, Pinky: 17 };

export class GestureEngine<RegisteredGestures extends string = never> {
	private _isActive: boolean = false;
	private gestures = new Map<string, GestureBuilder<any>>();
	private gestureListeners = new Map<
		string,
		Array<(event: GestureEvent) => void>
	>();
	private activeStateListeners: Array<(event: ActiveStateEvent) => void> = [];
	private lastTriggeredTimestamps = new Map<string, number>();
	private gestureStates = new Map<string, "waiting" | "ready">();

	private videoElement: HTMLVideoElement | null = null;
	private handsDetector: any = null;

	public get isActive(): boolean {
		return this._isActive;
	}

	public register<NewName extends string>(
		gesture: GestureBuilder<NewName>,
	): GestureEngine<RegisteredGestures | NewName> {
		this.gestures.set(gesture.name, gesture);
		return this as unknown as GestureEngine<RegisteredGestures | NewName>;
	}

	public startActiveState(): void {
		if (!this._isActive) {
			this._isActive = true;
			this.emitActiveState();
		}
	}

	public stopActiveState(): void {
		if (this._isActive) {
			this._isActive = false;
			this.emitActiveState();
		}
	}

	public toggleActiveState(): void {
		this._isActive = !this._isActive;
		this.emitActiveState();
	}

	public onGesture(
		name: RegisteredGestures,
		callback: (event: GestureEvent) => void,
	): void {
		if (!this.gestureListeners.has(name)) {
			this.gestureListeners.set(name, []);
		}
		this.gestureListeners.get(name)?.push(callback);
	}

	public onActiveState(callback: (event: ActiveStateEvent) => void): void {
		this.activeStateListeners.push(callback);
	}

	private emitActiveState(): void {
		const event: ActiveStateEvent = {
			activeState: this._isActive,
			timestamp: Date.now(),
		};
		this.activeStateListeners.forEach((listener) => {
			listener(event);
		});
	}

	public async bindWebcam(options: WebcamOptions): Promise<void> {
		this.videoElement = options.videoElement;

		// Step 1: Import MediaPipe
		const { FilesetResolver, HandLandmarker } = await import(
			"@mediapipe/tasks-vision"
		);

		const vision = await FilesetResolver.forVisionTasks(
			"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
		);

		this.handsDetector = await HandLandmarker.createFromOptions(vision, {
			baseOptions: {
				modelAssetPath:
					"https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
				delegate: "GPU", // Use GPU for better performance, if available
			},
			runningMode: "VIDEO",
			numHands: 2, // Important to allow multi-hand gestures
		});

		// Step 2: Activate the webcam and start processing frames
		const stream = await navigator.mediaDevices.getUserMedia({
			video: { width: 640, height: 480, frameRate: { ideal: 30 } },
			audio: false,
		});

		this.videoElement.srcObject = stream;

		this.videoElement.addEventListener("loadeddata", () => {
			this.videoElement?.play();
			this.startDetectionLoop(options.onFrameProcessed);
		});
	}

	private startDetectionLoop(
		onFrameProcessed?: (hands: HandLandmarks[]) => void,
	): void {
		const predict = () => {
			// Safety check to ensure videoElement and handsDetector are initialized
			if (!this.videoElement || !this.handsDetector) return;

			const timestamp = performance.now();
			const results = this.handsDetector.detectForVideo(
				this.videoElement,
				timestamp,
			);

			const transformedHands: HandLandmarks[] = [];

			if (results.landmarks && results.handedness) {
				for (let i = 0; i < results.landmarks.length; i++) {
					const handednessLabel = results.handedness[i][0].categoryName;

					transformedHands.push({
						handedness: handednessLabel as "Left" | "Right",
						points: results.landmarks[i],
					});
				}
			}

			// Step 3: Call the optional callback with the transformed hands
			this.processFrame(transformedHands);

			if (onFrameProcessed) {
				onFrameProcessed(transformedHands);
			}

			requestAnimationFrame(predict);
		};

		requestAnimationFrame(predict);
	}

	public processFrame(hands: HandLandmarks[]): void {
		for (const [name, gestureBuilder] of this.gestures.entries()) {
			// Wenn die Engine deaktiviert ist, Berechnungen skippen
			if (!this._isActive && !gestureBuilder.isSystemTrigger) {
				this.gestureStates.set(name, "waiting");
				continue;
			}

			const matchingHands = hands.filter(
				(h) =>
					gestureBuilder.targetHandMode === "any" ||
					h.handedness.toLowerCase() === gestureBuilder.targetHandMode,
			);

			if (matchingHands.length === 0) {
				this.gestureStates.set(name, "waiting");
				continue;
			}

			const activeHand = matchingHands[0];
			const mcpIndex =
				FINGER_MCP_INDEX[
					gestureBuilder.dominantFinger as keyof typeof FINGER_MCP_INDEX
				] || 5;
			const currentHandDirection = calculateFingerDirection(
				activeHand,
				mcpIndex,
			);

			let directionMatches = true;
			if (gestureBuilder.expectedDirection !== Direction.Any) {
				directionMatches =
					currentHandDirection === gestureBuilder.expectedDirection;
			}

			// 1. Statische Basis-Pose prüfen
			let basePoseMatches = true;
			for (const rule of gestureBuilder.basePoseRules) {
				if (!rule.evaluate(hands).matches) {
					basePoseMatches = false;
					break;
				}
			}

			// 2. Sind die Trigger-Finger gecurlt?
			let triggerFingersAreCurled = true;
			let triggerConfidenceSum = 0;
			for (const finger of gestureBuilder.triggerFingers) {
				const checkCurled = new FingerStateRule(
					gestureBuilder.targetHandMode,
					finger,
					State.Curled,
				).evaluate(hands);
				if (!checkCurled.matches) {
					triggerFingersAreCurled = false;
					break;
				}
				triggerConfidenceSum += checkCurled.confidence;
			}

			const currentState = this.gestureStates.get(name) || "waiting";
			const now = Date.now();
			const lastTriggered = this.lastTriggeredTimestamps.get(name) || 0;

			// 3. ERWEITERTE STATE MACHINE IN src/core/engine.ts

			// FALL 1: Es ist eine REINE STATISCHE POSE (wie deine PlainHand)
			if (gestureBuilder.triggerFingers.length === 0) {
				if (basePoseMatches && directionMatches) {
					if (now - lastTriggered >= gestureBuilder.cooldownMs) {
						// Statische Posen haben keine Trigger-Confidence, wir nehmen 1.0
						this.emitGesture(
							name,
							1.0,
							gestureBuilder.targetHandMode,
							currentHandDirection,
						);
						this.lastTriggeredTimestamps.set(name, now);
					}
				}
			}
			// FALL 2: Es ist eine DYNAMISCHE GESTE MIT TRIGGER (wie dein CustomClick)
			else {
				if (basePoseMatches && !triggerFingersAreCurled && directionMatches) {
					this.gestureStates.set(name, "ready");
				} else if (
					currentState === "ready" &&
					basePoseMatches &&
					triggerFingersAreCurled
				) {
					if (now - lastTriggered >= gestureBuilder.cooldownMs) {
						const avgTriggerConfidence =
							triggerConfidenceSum / gestureBuilder.triggerFingers.length;

						if (avgTriggerConfidence >= gestureBuilder.targetConfidence) {
							this.emitGesture(
								name,
								avgTriggerConfidence,
								gestureBuilder.targetHandMode,
								currentHandDirection,
							);
							this.lastTriggeredTimestamps.set(name, now);
						}
					}
					this.gestureStates.set(name, "waiting");
				} else if (!basePoseMatches || !directionMatches) {
					this.gestureStates.set(name, "waiting");
				}
			}
		}
	}

	private emitGesture(
		name: string,
		confidence: number,
		handMode: "left" | "right" | "both" | "any",
		direction: Direction,
	): void {
		const listeners = this.gestureListeners.get(name);
		if (!listeners) return;

		listeners.forEach((callback) => {
			callback({
				name,
				confidence,
				hand: handMode,
				direction,
				timestamp: Date.now(),
			});
		});
	}
}
