// src/core/presets.ts
import { Gesture, type GestureBuilder } from "@/core/builder";
import { Finger, State } from "@/core/types";

export const Presets = {
	/**
	 * ThumbsUp: Daumen gestreckt, alle anderen Finger geschlossen.
	 * Ideal für vertikale Triggersignale.
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
			.stableFor(300);
	},

	/**
	 * Pointer: Nur der Zeigefinger ist gestreckt.
	 * Perfekt für Richtungs-Swipes und Navigation.
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
			.stableFor(250);
	},

	/**
	 * GunPose: Daumen und Zeigefinger gestreckt, der Rest als Faust.
	 * Stark für Shooter-Mechaniken oder selektive Trigger.
	 */
	GunPose: <Name extends string>(name: Name): GestureBuilder<Name> => {
		return Gesture.create(name)
			.where.anyHand()
			.has(Finger.Thumb)
			.inState(State.Extended)
			.thenTriggeredBy()
			.curling([Finger.Index, Finger.Middle])
			.stableFor(400)
			.withConfidence(0.75);
	},

	/**
	 * PinkyPinch: Anatomischer Loop aus Daumen- und kleiner Fingerspitze.
	 * Diskreter Hintergrund- oder System-Trigger.
	 */
	PinkyPinch: <Name extends string>(name: Name): GestureBuilder<Name> => {
		return Gesture.create(name)
			.where.anyHand()
			.pinches(Finger.Thumb, Finger.Pinky)
			.stableFor(2000);
	},

	/**
	 * Fist: Alle 5 Finger sind komplett in die Handfläche gezogen.
	 * Optimal als Hard-Stop oder Grab-Geste.
	 */
	Fist: <Name extends string>(name: Name): GestureBuilder<Name> => {
		return Gesture.create(name)
			.where.anyHand()
			.isClosedInto(State.Curled)
			.stableFor(400); // Höherer Filter gegen kurzes flackern beim Schließen
	},
};
