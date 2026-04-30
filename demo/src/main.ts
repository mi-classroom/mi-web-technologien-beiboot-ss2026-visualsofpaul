// MediaPipe for providing hand landmarks
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type { Landmark } from "@mediapipe/tasks-vision";

// HTML elements that are used
const video = document.getElementById("webcam") as HTMLVideoElement;
const canvas = document.getElementById("output") as HTMLCanvasElement;
const dataLog = document.getElementById("log") as HTMLElement;

// Make sure we have a 2D context for drawing
const ctx = canvas.getContext("2d")!;

// Instance for hand landmark detection
let handLandmarker: HandLandmarker;

// State variables to track last triggered direction, hand state and command
let lastTriggeredDirection: string | null = null;
let lastHandState: "OPEN" | "CLOSED" | "POINTING" | "OTHER" = "OTHER";

/**
 * Helper function to determine if a finger is extended based on the distance from wrist to tip vs. wrist to pip joint.
 * @param hand - Array of landmarks for the detected hand.
 * @param tipIdx - Index of the fingertip landmark (e.g., 8 for index finger).
 * @param pipIdx - Index of the pip joint landmark (e.g., 6 for index finger).
 * @param wrist - Landmark representing the wrist (landmark 0).
 * @returns boolean indicating if the finger is extended or not.
 */
function isFingerExtended(
  hand: Landmark[],
  tipIdx: number,
  pipIdx: number,
  wrist: Landmark,
): boolean {
  const wristToTip = Math.hypot(
    hand[tipIdx]!.x - wrist.x,
    hand[tipIdx]!.y - wrist.y,
  );
  const wristToPip = Math.hypot(
    hand[pipIdx]!.x - wrist.x,
    hand[pipIdx]!.y - wrist.y,
  );
  return wristToTip > wristToPip * 1.15; // Threshold to determine if finger is extended
}

/**
 * Sets up the MediaPipe hand landmarker and initializes the webcam.
 */
async function setup() {
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

  // Step 3: Access the webcam and start the video stream
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  video.addEventListener("loadeddata", () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    predict();
  });
}

/**
 * Main loop for processing video frames and detecting hand gestures. It updates the canvas with the video feed and detected landmarks, determines the current hand state (OPEN, CLOSED, POINTING), and triggers commands based on state changes and pointing direction.
 */
async function predict() {
  const startTimeMs = performance.now();

  // Step 1: Run hand landmark detection on the current video frame
  const results = handLandmarker.detectForVideo(video, startTimeMs);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (results.landmarks && results.landmarks.length > 0) {
    // Step 2: Process the detected hand landmarks
    const hand = results.landmarks[0];

    if (!hand || !hand[0]) return;

    const wrist = hand[0];

    // Determine if each finger is extended or not
    const index = isFingerExtended(hand, 8, 6, wrist); // Index
    const middle = isFingerExtended(hand, 12, 10, wrist); // Middle
    const ring = isFingerExtended(hand, 16, 14, wrist); // Ring
    const pinky = isFingerExtended(hand, 20, 18, wrist); // Pinky

    // Step 3: Determine the current hand state based on which fingers are extended
    let currentState: typeof lastHandState = "OTHER";

    if (index && !middle && !ring && !pinky) {
      currentState = "POINTING";
    } else if (index && middle && ring && pinky) {
      currentState = "OPEN";
    } else if (!index && !middle && !ring && !pinky) {
      currentState = "CLOSED";
    }

    // Step 4: If the hand is in the POINTING state, determine the direction of pointing and trigger corresponding commands
    if (currentState === "POINTING") {
      const mcp = hand[5];
      const tip = hand[8];

      if (!mcp || !tip) return;

      const dx = tip.x - mcp.x;
      const dy = tip.y - mcp.y;
      const threshold = 0.1;

      let currentDir = "";
      if (Math.abs(dx) > Math.abs(dy)) {
        currentDir = dx > threshold ? "LEFT" : dx < -threshold ? "RIGHT" : "";
      } else {
        currentDir = dy > threshold ? "DOWN" : dy < -threshold ? "UP" : "";
      }

      if (currentDir !== "" && currentDir !== lastTriggeredDirection) {
        lastTriggeredDirection = currentDir;
      }
    } else {
      lastTriggeredDirection = null;
    }

    lastHandState = currentState;

    // Step 5: Draw the detected hand landmarks on the canvas and update the data log with the current state and last triggered direction
    hand.forEach((pt) => {
      ctx.fillStyle = currentState === "POINTING" ? "red" : "green";
      ctx.beginPath();
      ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    dataLog.innerText = `[${currentState}] \t ${lastTriggeredDirection}\n`;
  }

  requestAnimationFrame(predict);
}

// Start the application by setting up the hand landmarker and webcam
setup();
