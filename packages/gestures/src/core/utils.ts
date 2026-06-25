import { Direction, type HandLandmarks } from "./types";

export function calculateFingerDirection(
	hand: HandLandmarks,
	dominantFinger: number = 5,
): Direction {
	// Wir nehmen das MCP-Gelenk (Basis) und die TIP-Landmark (Spitze) des Fingers
	// Standardmäßig Landmark 5 (Index MCP) und 8 (Index TIP)
	const base = hand.points[dominantFinger];
	const tip = hand.points[dominantFinger + 3]; // TIP ist immer +3 Landmarks weiter als MCP

	if (!base || !tip) return Direction.Any;

	const dx = tip.x - base.x;
	const dy = tip.y - base.y; // Achtung: Y ist im Browser invertiert

	// Schauen wir, welche Achse die dominante Bewegung hat
	if (Math.abs(dx) > Math.abs(dy)) {
		// Horizontale Ausrichtung
		return dx > 0 ? Direction.Right : Direction.Left;
	} else {
		// Vertikale Ausrichtung
		return dy > 0 ? Direction.Down : Direction.Up; // Da Y nach unten positiv ist
	}
}
