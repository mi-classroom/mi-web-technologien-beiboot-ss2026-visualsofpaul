import {
	Finger,
	Gesture,
	GestureEngine,
	type GestureEvent,
	State,
} from "gestures";
import { Presets } from "gestures/presets";

const engine = new GestureEngine()
	.register(Presets.ThumbsUp("ThumbsUp").holdFor(2000))
	.register(Presets.Pointer("Pointer").holdFor(2000))
	.register(Presets.Gun("Gun"))
	.register(Presets.PinkyPinch("PinkyPinch").idleFor(2000).asSystemGesture())
	.register(Presets.Fist("Fist").holdFor(2000))
	.register(
		Gesture.create("MiddleFinger")
			.where.anyHand()
			.has(Finger.Middle)
			.inState(State.Extended)
			.has(Finger.Thumb)
			.inState(State.Curled)
			.has(Finger.Index)
			.inState(State.Curled)
			.has(Finger.Ring)
			.inState(State.Curled)
			.has(Finger.Pinky)
			.inState(State.Curled)
			.where.determineDirectionFrom(Finger.Middle),
	);

engine.bindWebcam({
	videoElement: document.getElementById("webcam") as HTMLVideoElement,
});

engine.onGesture("ThumbsUp", (event: GestureEvent) => {
	console.log("👍", event);
});

engine.onGesture("Pointer", (event: GestureEvent) => {
	console.log("☝️", event);
});

engine.onGesture("Gun", (event: GestureEvent) => {
	console.log("🔫", event);
});

engine.onGesture("PinkyPinch", (event: GestureEvent) => {
	console.log("🤏", event);
	engine.toggleActiveState();
});

engine.onGesture("Fist", (event: GestureEvent) => {
	console.log("✊", event);
});

engine.onGesture("MiddleFinger", (event: GestureEvent) => {
	console.log("🖕", event);
});

engine.onActiveState((event) => {
	console.log("Gesture detection active state changed:", event.activeState);
});
