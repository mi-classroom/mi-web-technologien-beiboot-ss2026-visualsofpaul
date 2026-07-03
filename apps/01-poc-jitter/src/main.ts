// MediaPipe for providing hand landmarks
import type { HandLandmarkerResult, Landmark } from "@mediapipe/tasks-vision";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

// HTML elements that are used
const video = document.getElementById("webcam") as HTMLVideoElement;
const canvas = document.getElementById("output") as HTMLCanvasElement;
const latencyDisplay = document.getElementById("latency") as HTMLElement;

// Make sure we have a 2D context for drawing
// biome-ignore lint/style/noNonNullAssertion: this is only for demonstration purposes, and we know the canvas exists
const ctx = canvas.getContext("2d")!;

// Global constants that can be tweaked for different measurement scenarios
const FINGERTIP_IDS = [
	4, // Thumb
	8, // Index
	12, // Middle
	16, // Ring
	20, // Pinky
];
const MEASUREMENT_DURATION_MS = 2000;

// States that are used to track the current measurement session
let handLandmarker: HandLandmarker | undefined;
let isMeasuring = false;
let measurementData: Landmark[][] = [];

/**
 * Sets up the MediaPipe hand landmarker, initializes the webcam feed, and starts the main prediction loop. Also sets up an event listener for starting jitter measurements when the spacebar is pressed.
 */
async function setup(): Promise<void> {
	// Step 1: Load the MediaPipe vision files
	const vision = await FilesetResolver.forVisionTasks(
		"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
	);

	// Step 2: Create the hand landmarker with the specified options
	handLandmarker = await HandLandmarker.createFromOptions(vision, {
		baseOptions: {
			modelAssetPath:
				"https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
			delegate: "GPU",
		},
		runningMode: "VIDEO",
		numHands: 1,
	});

	// Step 3: Initialize the webcam and start processing frames
	const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
		video: true,
	});
	video.srcObject = stream;
	video.onloadedmetadata = () => {
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		predict();
	};

	// Step 4: Initialize the measurement event listener
	window.addEventListener("keydown", (event: KeyboardEvent) => {
		if (event.code === "Space" && !isMeasuring) {
			event.preventDefault();
			startMeasurement();
		}
	});
}

/**
 * Starts a new jitter measurement session by resetting the measurement state, clearing previous data, and setting a timeout to end the measurement after the specified duration. During the measurement period, landmark data will be collected for the specified fingertip IDs, and once the measurement ends, the final jitter values will be calculated and displayed.
 */
function startMeasurement(): void {
	// Step 1: Reset measurement state
	isMeasuring = true;
	measurementData = [];
	latencyDisplay.textContent = "Measuring...";

	// Step 2: Reset jitter values
	FINGERTIP_IDS.forEach((id) => {
		const element = document.getElementById(`${id}-jitter`);
		if (element) element.textContent = "-";
	});

	// Step 3: Set a timeout to end the measurement after the specified duration
	setTimeout(() => {
		isMeasuring = false;
		processFinalJitter();
	}, MEASUREMENT_DURATION_MS);
}

/**
 * Processes the collected landmark data for each specified fingertip ID to calculate the jitter (standard deviation) for each axis (x, y, z) and then combines them into a single 3D jitter value. The calculated jitter values are then displayed in the corresponding HTML elements for each fingertip.
 */
function processFinalJitter(): void {
	FINGERTIP_IDS.forEach((id) => {
		// Step 1: Collect samples
		const samples = measurementData.map((frame) => frame[id]);
		if (samples.length < 2) return;

		/**
		 * Calculates the jitter (standard deviation) for a specific axis (x, y, or z) based on the collected samples.
		 * @param {"x" | "y" | "z"} axis - The axis for which to calculate jitter.
		 * @returns {number} The calculated jitter value for the specified axis.
		 */
		function getAxisJitter(axis: "x" | "y" | "z"): number {
			const values = samples
				.map((sample) => sample?.[axis])
				.filter((value) => value !== undefined) as number[];

			const mean = values.reduce((a, b) => a + b, 0) / values.length;
			const variance =
				values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;

			return Math.sqrt(variance);
		}

		// Step 2: Calculate the combined 3D jitter (root sum of variances)
		const combinedJitter = Math.sqrt(
			getAxisJitter("x") ** 2 +
				getAxisJitter("y") ** 2 +
				getAxisJitter("z") ** 2,
		);

		// Step 3: Update the jitter display for the current fingertip
		const element = document.getElementById(`${id}-jitter`);
		if (element) element.textContent = combinedJitter.toFixed(6);
	});
}

/**
 * The main prediction loop that continuously processes video frames from the webcam, detects hand landmarks using the MediaPipe hand landmarker, and updates the display with the current latency and landmark positions. If a measurement session is active, it also collects landmark data for the specified fingertip IDs to be processed later for jitter calculation.
 */
function predict(): void {
	if (!handLandmarker) return;

	// Step 1: Define measurement data
	const startTime = performance.now();
	const results: HandLandmarkerResult = handLandmarker.detectForVideo(
		video,
		startTime,
	);
	const latency = performance.now() - startTime;

	// Step 2: Display latency
	latencyDisplay.textContent = `Latency: ${latency.toFixed(2)} ms | [SPACE] to measure jitter`;

	// Step 3: Draw the video frame and detected landmarks
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

	if (results.landmarks?.[0]) {
		const hand = results.landmarks[0];

		// Step 4: If we are currently measuring, collect the landmark data for the specified fingertip IDs
		if (isMeasuring) {
			measurementData.push(JSON.parse(JSON.stringify(hand)));
		}

		// Step 5: Draw landmarks and update coordinate displays
		FINGERTIP_IDS.forEach((id) => {
			const landmark = hand[id];
			if (!landmark) return;

			const xElement = document.getElementById(`${id}-x`);
			const yElement = document.getElementById(`${id}-y`);
			const zElement = document.getElementById(`${id}-z`);

			if (xElement) xElement.textContent = landmark.x.toFixed(6);
			if (yElement) yElement.textContent = landmark.y.toFixed(6);
			if (zElement) zElement.textContent = landmark.z.toFixed(6);

			const x = landmark.x * canvas.width;
			const y = landmark.y * canvas.height;

			ctx.fillStyle = isMeasuring ? "red" : "blue";
			ctx.beginPath();
			ctx.arc(x, y, 6, 0, 2 * Math.PI);
			ctx.fill();
			ctx.fillStyle = "white";
			ctx.font = "bold 12px Arial";
			ctx.fillText(id.toString(), x + 10, y);
		});
	}

	requestAnimationFrame(predict);
}

// Start the setup process and catch any errors that occur during initialization
setup().catch(console.error);
