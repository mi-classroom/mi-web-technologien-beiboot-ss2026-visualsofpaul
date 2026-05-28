import { CameraService } from "./classes/camera-service";
import { UIRenderer } from "./classes/ui-renderer";
import { GestureEngine } from "./classes/gesture-engine";
import { StartDetector } from "./classes/start-detector";
import { FarStartDetector } from "./classes/far-start-detector";
import { NavigationDetector } from "./classes/navigation-detector";
import { FarNavigationDetector } from "./classes/far-navigation-detection";

const ui = new UIRenderer();
const gestureEngine = new GestureEngine()
  .use(new StartDetector())
  .use(new FarStartDetector())
  .use(new NavigationDetector())
  .use(new FarNavigationDetector());

const cameraService = new CameraService((handResults, poseResults) => {
  ui.clear();

  if (handResults.landmarks?.[0] && poseResults.landmarks?.[0]) {
    const hand = handResults.landmarks[0];
    const pose = poseResults.landmarks[0];

    const gesture = gestureEngine.analyze(hand, pose);

    ui.showGesture(gesture);
  }
});

cameraService.initialize().catch(console.error);
