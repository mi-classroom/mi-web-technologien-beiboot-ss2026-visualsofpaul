import Reveal from "reveal.js";
// @ts-expect-error
import "reveal.js/reveal.css";
// @ts-expect-error
import "reveal.js/theme/black.css";

import { GestureEngine, type GestureEvent } from "gestures";
import { Presets } from "gestures/presets";

const engine = new GestureEngine()
	.register(Presets.Gun("Navigate").idleFor(1000))
	.register(
		Presets.PinkyPinch("Toggle").holdFor(1000).idleFor(2000).asSystemGesture(),
	);

engine.bindWebcam({
	videoElement: document.getElementById("webcam") as HTMLVideoElement,
});

Reveal.initialize();

engine.onGesture("Toggle", () => {
	engine.toggleActiveState();
});

engine.onGesture("Navigate", (event: GestureEvent) => {
	const { direction } = event;

	if (Reveal.isReady()) {
		if (direction === "Left") {
			Reveal.left();
		} else if (direction === "Right") {
			Reveal.right();
		} else if (direction === "Up") {
			Reveal.up();
		} else if (direction === "Down") {
			Reveal.down();
		}
	}
});

engine.onActiveState((event) => {
	// Show a little alert with the current state (animates smoothly in and out)
	const alert = document.createElement("div");
	alert.textContent = event.activeState
		? "Engine is active"
		: "Engine is inactive";

	// Base styles
	alert.style.position = "fixed";
	alert.style.top = "10px";
	alert.style.left = "50%";
	alert.style.padding = "10px 20px";
	alert.style.backgroundColor = event.activeState ? "green" : "red";
	alert.style.color = "white";
	alert.style.fontFamily = "Arial, sans-serif";
	alert.style.fontSize = "16px";
	alert.style.borderRadius = "100px";
	alert.style.zIndex = "1000";

	// Initial state for animation
	alert.style.opacity = "0";
	alert.style.transform = "translateX(-50%) translateY(-20px)";
	alert.style.transition = "opacity 0.3s ease, transform 0.3s ease";

	document.body.appendChild(alert);

	// Animate in after a short delay to ensure the element is rendered
	setTimeout(() => {
		alert.style.opacity = "1";
		alert.style.transform = "translateX(-50%) translateY(0)";
	}, 10);

	// Let the alert stay for 2 seconds, then animate out and remove it from the DOM
	setTimeout(() => {
		alert.style.opacity = "0";
		alert.style.transform = "translateX(-50%) translateY(-20px)";

		// Remove the alert from the DOM after the transition ends
		setTimeout(() => {
			if (alert.parentNode) {
				document.body.removeChild(alert);
			}
		}, 300);
	}, 2000);
});
