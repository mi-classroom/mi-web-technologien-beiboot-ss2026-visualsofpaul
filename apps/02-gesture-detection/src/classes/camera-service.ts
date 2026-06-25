import {
  HandLandmarker,
  PoseLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import type {
  HandLandmarkerResult,
  PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

export class CameraService {
  private video!: HTMLVideoElement;
  private handLandmarker!: HandLandmarker;
  private poseLandmarker!: PoseLandmarker;

  constructor(
    private readonly onFrame: (
      handResult: HandLandmarkerResult,
      poseResult: PoseLandmarkerResult,
    ) => void,
  ) {
    this.createVideoElement();
  }

  private createVideoElement(): void {
    this.video = document.createElement("video");
    this.video.autoplay = true;
    this.video.playsInline = true;
    this.video.style.position = "fixed";
    this.video.style.width = "100vw";
    this.video.style.height = "100vh";
    this.video.style.objectFit = "cover";
    this.video.style.zIndex = "-1";
    this.video.style.transform = "scaleX(-1)";
    document.body.prepend(this.video);
  }

  public getVideoDimensions(): { width: number; height: number } {
    return {
      width: this.video.videoWidth,
      height: this.video.videoHeight,
    };
  }

  public async initialize(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
    );

    const [hands, pose] = await Promise.all([
      HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
      }),
      PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
      }),
    ]);

    this.handLandmarker = hands;
    this.poseLandmarker = pose;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1920, height: 1080 },
    });

    this.video.srcObject = stream;
    this.video.onloadedmetadata = () => {
      this.video.play();
      this.loop();
    };
  }

  private loop(): void {
    const startTime = performance.now();
    const handResults = this.handLandmarker.detectForVideo(
      this.video,
      startTime,
    );
    const poseResults = this.poseLandmarker.detectForVideo(
      this.video,
      startTime,
    );
    this.onFrame(handResults, poseResults);
    requestAnimationFrame(this.loop.bind(this));
  }
}
