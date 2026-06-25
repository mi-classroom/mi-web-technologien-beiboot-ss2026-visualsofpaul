import { GestureEngine } from "gestures";
import { Presets } from "gestures/presets";

const engine = new GestureEngine();

engine.bindWebcam({
	videoElement: document.getElementById("webcam") as HTMLVideoElement,
});

const nextBefore = Presets.GunPose("NextBefore");
const toggleDetection = Presets.PinkyPinch("ToggleDetection").asSystemGesture();

engine.register(nextBefore).register(toggleDetection);

engine.onGesture("NextBefore", (event) => {
	console.log("NextBefore detected:", event);
});

engine.onGesture("ToggleDetection", (event) => {
	console.log("ToggleDetection detected:", event);
	engine.toggleActiveState();
});
