import { Gesture, type GestureBuilder } from "@/core/builder";
import { Finger, State } from "@/core/types";

export const Presets = {
	/**
	 * @name ThumbsUp
	 * Thumbs up gesture with thumb extended and all other fingers curled. Has a cooldown of 2 seconds to prevent accidental triggers.
	 */
	ThumbsUp: <Name extends string>(name: Name): GestureBuilder<Name> => {
		return Gesture.create(name)
			.where.anyHand()
			.has(Finger.Thumb)
			.inState(State.Extended)
			.has(Finger.Index)
			.inState(State.Curled)
			.has(Finger.Middle)
			.inState(State.Curled)
			.has(Finger.Ring)
			.inState(State.Curled)
			.has(Finger.Pinky)
			.inState(State.Curled)
			.where.determineDirectionFrom(Finger.Thumb)
			.waitFor(2000);
	},

	/**
	 * @name Pointer
	 * Index finger extended, all other fingers curled. Has a cooldown of 2 seconds to prevent accidental triggers.
	 */
	Pointer: <Name extends string>(name: Name): GestureBuilder<Name> => {
		return Gesture.create(name)
			.where.anyHand()
			.has(Finger.Index)
			.inState(State.Extended)
			.has(Finger.Thumb)
			.inState(State.Curled)
			.has(Finger.Middle)
			.inState(State.Curled)
			.has(Finger.Ring)
			.inState(State.Curled)
			.has(Finger.Pinky)
			.inState(State.Curled)
			.where.determineDirectionFrom(Finger.Index)
			.waitFor(2000);
	},

	/**
	 * @name Gun
	 * Gun pose with thumb and index finger extended, rest curled. To trigger this gesture, the user must curl the index finger. Has a cooldown of 2 seconds to prevent accidental triggers and a confidence threshold of 0.75 to ensure accurate detection.
	 */
	Gun: <Name extends string>(name: Name): GestureBuilder<Name> => {
		return Gesture.create(name)
			.where.anyHand()
			.has(Finger.Thumb)
			.inState(State.Extended)
			.thenTriggeredBy()
			.curling([Finger.Index])
			.waitFor(2000)
			.withConfidence(0.75);
	},

	/**
	 * @name PinkyPinch
	 * Pinch between thumb and pinky finger. Has a cooldown of 2 seconds to prevent accidental triggers.
	 */
	PinkyPinch: <Name extends string>(name: Name): GestureBuilder<Name> => {
		return Gesture.create(name)
			.where.anyHand()
			.pinches(Finger.Thumb, Finger.Pinky)
			.waitFor(2000);
	},

	/**
	 * @name Fist
	 * All fingers curled into a fist. Has a cooldown of 2 seconds to prevent accidental triggers.
	 */
	Fist: <Name extends string>(name: Name): GestureBuilder<Name> => {
		return Gesture.create(name)
			.where.anyHand()
			.isClosedInto(State.Curled)
			.waitFor(2000);
	},
};
