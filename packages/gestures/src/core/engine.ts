import type { GestureBuilder } from "@/core/builder";
import { FingerStateRule } from "@/core/rules";
import {
	type ActiveStateEvent,
	Direction,
	type GestureEvent,
	type HandLandmarks,
	State,
	type WebcamOptions,
} from "@/core/types";
import { calculateFingerDirection } from "@/core/utils";

const FINGER_MCP_INDEX = { Thumb: 2, Index: 5, Middle: 9, Ring: 13, Pinky: 17 };

export class GestureEngine<RegisteredGestures extends string = never> {
	private _isActive: boolean = false;
	private gestures = new Map<string, GestureBuilder<string>>();
	private gestureListeners = new Map<
		string,
		Array<(event: GestureEvent) => void>
	>();
	private activeStateListeners: Array<(event: ActiveStateEvent) => void> = [];
	private lastTriggeredTimestamps = new Map<string, number>();
	private gestureStates = new Map<string, "waiting" | "ready">();

	private firstDetectedTimestamps = new Map<string, number>();
	private lastIdleTimestamps = new Map<string, number>();

	private videoElement: HTMLVideoElement | null = null;
	private handsDetector:
		| import("@mediapipe/tasks-vision").HandLandmarker
		| null = null;

	/**
	 * Returns whether the gesture engine is currently active. When active, it will process webcam frames and detect gestures. When inactive, it will skip gesture detection to save resources.
	 * @returns True if the engine is active, false otherwise.
	 */
	public get isActive(): boolean {
		return this._isActive;
	}

	/**
	 * Registers a new gesture with the engine. The gesture is defined using a GestureBuilder instance. Once registered, the engine will start detecting this gesture in the webcam feed.
	 * @param gesture The GestureBuilder instance defining the gesture to register.
	 * @returns The GestureEngine instance, allowing for method chaining.
	 */
	public register<NewName extends string>(
		gesture: GestureBuilder<NewName>,
	): GestureEngine<RegisteredGestures | NewName> {
		this.gestures.set(gesture.name, gesture);
		return this as unknown as GestureEngine<RegisteredGestures | NewName>;
	}

	/**
	 * Activates the gesture engine, allowing it to process webcam frames and detect gestures. If the engine is already active, this method has no effect.
	 */
	public startActiveState(): void {
		if (!this._isActive) {
			this._isActive = true;
			this.emitActiveState();
		}
	}

	/**
	 * Deactivates the gesture engine, preventing it from processing webcam frames and detecting gestures. If the engine is already inactive, this method has no effect.
	 */
	public stopActiveState(): void {
		if (this._isActive) {
			this._isActive = false;
			this.emitActiveState();
		}
	}

	/**
	 * Toggles the active state of the gesture engine. If the engine is currently active, it will be deactivated, and vice versa. This method is useful for quickly enabling or disabling gesture detection without needing to call startActiveState() or stopActiveState() directly.
	 */
	public toggleActiveState(): void {
		this._isActive = !this._isActive;
		this.emitActiveState();
	}

	/**
	 * Registers a callback function to be invoked whenever a specific gesture is detected. The callback receives a GestureEvent object containing details about the detected gesture, such as its name, confidence level, hand used, direction, and timestamp.
	 * @param name The name of the gesture to listen for. This should match the name defined in the GestureBuilder when the gesture was registered.
	 * @param callback The function to be called when the gesture is detected.
	 */
	public onGesture(
		name: RegisteredGestures,
		callback: (event: GestureEvent) => void,
	): void {
		// Ensure that the gesture name is registered before adding a listener
		if (!this.gestureListeners.has(name)) {
			this.gestureListeners.set(name, []);
		}
		this.gestureListeners.get(name)?.push(callback);
	}

	/**
	 * Registers a callback function to be invoked whenever the active state of the gesture engine changes. The callback receives an ActiveStateEvent object containing details about the new active state and the timestamp of the change.
	 * @param callback The function to be called when the active state changes.
	 */
	public onActiveState(callback: (event: ActiveStateEvent) => void): void {
		this.activeStateListeners.push(callback);
	}

	/**
	 * Emits an ActiveStateEvent to all registered listeners, indicating the current active state of the gesture engine. This method is called internally whenever the active state changes, ensuring that all listeners are notified of the change.
	 */
	private emitActiveState(): void {
		const event: ActiveStateEvent = {
			activeState: this._isActive,
			timestamp: Date.now(),
		};
		this.activeStateListeners.forEach((listener) => {
			listener(event);
		});
	}

	/**
	 * Binds the gesture engine to a webcam feed, allowing it to process video frames and detect gestures in real-time. This method initializes the MediaPipe HandLandmarker, sets up the webcam stream, and starts the detection loop. An optional callback can be provided to receive the processed hand landmarks for each frame.
	 * @param options An object containing the HTMLVideoElement to bind to and an optional callback function to be called after each frame is processed.
	 * @returns A Promise that resolves when the webcam is successfully bound and the detection loop has started.
	 */
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

	/**
	 * Starts the detection loop that continuously processes video frames from the webcam and detects gestures. This method uses requestAnimationFrame to ensure smooth and efficient frame processing. It transforms the raw hand landmarks and handedness data into a more usable format and calls the processFrame method to evaluate registered gestures.
	 * @param onFrameProcessed An optional callback function that is called after each frame is processed, receiving the transformed hand landmarks as an argument.
	 */
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
					const handednessLabel = results.handedness[i]?.[0]?.categoryName;
					const landmarkPoints = results.landmarks[i];

					if (!landmarkPoints) {
						continue;
					}

					transformedHands.push({
						handedness: handednessLabel as "Left" | "Right",
						points: landmarkPoints,
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

	/**
	 * Processes a single frame of hand landmarks to evaluate registered gestures. This method checks each registered gesture against the current hand landmarks, determining if the gesture's base pose and trigger conditions are met. It manages the state of each gesture (waiting or ready) and emits gesture events when a gesture is successfully detected, taking into account cooldown periods and confidence thresholds.
	 * @param hands An array of HandLandmarks representing the detected hands in the current frame. Each HandLandmarks object contains the handedness and 3D points of the hand.
	 */
	private processFrame(hands: HandLandmarks[]): void {
		for (const [name, gestureBuilder] of this.gestures.entries()) {
			// If the engine is inactive and the gesture is not a system trigger, skip processing this gesture
			if (!this._isActive && !gestureBuilder.isSystemTrigger) {
				this.gestureStates.set(name, "waiting");
				continue;
			}

			const matchingHands = hands.filter(
				(hand) =>
					gestureBuilder.targetHandMode === "any" ||
					hand.handedness.toLowerCase() === gestureBuilder.targetHandMode,
			);

			if (matchingHands.length === 0) {
				this.gestureStates.set(name, "waiting");
				continue;
			}

			const activeHand = matchingHands[0];
			if (!activeHand) {
				this.gestureStates.set(name, "waiting");
				continue;
			}

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

			// Step 1: Check if the base pose rules are satisfied
			let basePoseMatches = true;
			for (const rule of gestureBuilder.basePoseRules) {
				if (!rule.evaluate(hands).matches) {
					basePoseMatches = false;
					break;
				}
			}

			// Step 2: Check if the trigger fingers are in the expected state (curled)
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

			// Step 3: Determine if the gesture should be emitted based on the current state, base pose match, trigger finger state, and timing settings
			const holdFor = gestureBuilder.holdDurationMs ?? 0;
			const idleFor = gestureBuilder.cooldownMs ?? 0;

			// Manage timestamps for when the base pose was first seen or last lost
			let basePoseHeldLongEnough = false;
			if (basePoseMatches && directionMatches) {
				if (!this.firstDetectedTimestamps.has(name)) {
					this.firstDetectedTimestamps.set(name, now);
				}
				this.lastIdleTimestamps.delete(name);
				const startedAt = this.firstDetectedTimestamps.get(name) || now;
				basePoseHeldLongEnough = now - startedAt >= holdFor;
			} else {
				// Base pose not matching: mark idle start if not already set
				if (this.firstDetectedTimestamps.has(name)) {
					this.firstDetectedTimestamps.delete(name);
				}
				if (!this.lastIdleTimestamps.has(name)) {
					this.lastIdleTimestamps.set(name, now);
				}
				const idleStartedAt = this.lastIdleTimestamps.get(name) || now;
				const idleElapsed = now - idleStartedAt;
				// If idle period is shorter than configured, keep previous state (debounce)
				if (idleFor > 0 && idleElapsed < idleFor) {
					// Do not forcefully set to waiting yet; skip to next gesture
					continue;
				}
				// If idleFor satisfied (or zero), clear idle timestamp so next detection restarts timing
				this.lastIdleTimestamps.delete(name);
			}

			// Option 1: Static pose without trigger fingers
			if (gestureBuilder.triggerFingers.length === 0) {
				if (basePoseMatches && directionMatches && basePoseHeldLongEnough) {
					if (now - lastTriggered >= gestureBuilder.cooldownMs) {
						this.emitGesture(
							name,
							1.0,
							gestureBuilder.targetHandMode,
							currentHandDirection,
						);
						this.lastTriggeredTimestamps.set(name, now);
						// Require a fresh hold interval before the next static trigger
						this.firstDetectedTimestamps.set(name, now);
					}
				}
				if (!basePoseMatches || !directionMatches) {
					this.gestureStates.set(name, "waiting");
				}
			}

			// Option 2: Dynamic gesture with trigger fingers
			else {
				// Dynamic gesture flow (requires trigger fingers)
				if (
					basePoseMatches &&
					!triggerFingersAreCurled &&
					directionMatches &&
					basePoseHeldLongEnough
				) {
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
							// Require a fresh hold interval before the next dynamic trigger cycle
							this.firstDetectedTimestamps.set(name, now);
						}
					}
					this.gestureStates.set(name, "waiting");
				} else if (!basePoseMatches || !directionMatches) {
					this.gestureStates.set(name, "waiting");
				}
			}
		}
	}

	/**
	 * Emits a GestureEvent to all registered listeners for a specific gesture. This method is called internally when a gesture is successfully detected, and it constructs the GestureEvent object with the provided parameters, including the gesture name, confidence level, hand mode, direction, and timestamp. It then invokes all callback functions that have been registered for this gesture.
	 * @param name The name of the detected gesture, which should match the name defined in the GestureBuilder when the gesture was registered.
	 * @param confidence The confidence level of the detected gesture, typically a value between 0 and 1, indicating how certain the engine is that the gesture was performed correctly.
	 * @param handMode The hand mode associated with the detected gesture, indicating whether the gesture was performed with the left hand, right hand, both hands, or any hand.
	 * @param direction The direction of the detected gesture, which can be one of the values defined in the Direction enum (Up, Down, Left, Right, Any).
	 */
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
