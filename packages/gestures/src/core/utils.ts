import { Direction, type HandLandmarks } from "@/core/types";

/**
 * Calculates the direction of a finger based on its landmarks.
 * @param hand The hand landmarks containing the finger points.
 * @param dominantFinger The index of the dominant finger (default is 5 for the index finger).
 * @returns The direction of the finger as a Direction enum value.
 */
export function calculateFingerDirection(
	hand: HandLandmarks,
	dominantFinger: number = 5,
): Direction {
	// The base of the finger is the MCP joint, and the tip is the fingertip
	const base = hand.points[dominantFinger];
	const tip = hand.points[dominantFinger + 3]; // The tip is 3 points away from the base in the landmarks array

	if (!base || !tip) return Direction.Any;

	const dx = tip.x - base.x;
	const dy = tip.y - base.y; // Caution: In many coordinate systems, the Y-axis is inverted (down is positive), so we might need to adjust this based on the specific system used

	// Determine the primary direction based on the differences in x and y coordinates
	if (Math.abs(dx) > Math.abs(dy)) {
		// Horizontal orientation
		return dx > 0 ? Direction.Right : Direction.Left;
	} else {
		// Vertical orientation
		return dy > 0 ? Direction.Down : Direction.Up; // Because of the inverted Y-axis, a positive dy means the finger is pointing downwards
	}
}
