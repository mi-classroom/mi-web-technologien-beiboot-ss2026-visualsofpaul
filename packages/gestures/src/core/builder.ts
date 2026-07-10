import { FingerDistanceRule, FingerStateRule } from "@/core/rules";
import { Direction, Finger, type Rule, type State } from "@/core/types";

export class GestureBuilder<Name extends string> {
	public basePoseRules: Rule[] = [];
	public triggerFingers: Finger[] = [];
	public targetHandMode: "left" | "right" | "both" | "any" = "any";
	public expectedDirection: Direction = Direction.Any;
	public dominantFinger: Finger = Finger.Index;
	public targetConfidence: number = 0.8;
	public cooldownMs: number = 0;
	public holdDurationMs: number = 0;
	public isSystemTrigger: boolean = false;

	constructor(public readonly name: Name) {}

	/**
	 * A connector to make the API more readable. It doesn't do anything, but it allows you to write near natural language when defining gestures.
	 */
	get where() {
		return this;
	}

	/**
	 * This method allows you to specify that the gesture can be performed with any hand.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	public anyHand(): GestureBuilder<Name> {
		this.targetHandMode = "any";
		return this;
	}

	/**
	 * This method allows you to specify that the gesture can be performed with the left hand.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	public leftHand(): GestureBuilder<Name> {
		this.targetHandMode = "left";
		return this;
	}

	/**
	 * This method allows you to specify that the gesture can be performed with the right hand.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	public rightHand(): GestureBuilder<Name> {
		this.targetHandMode = "right";
		return this;
	}

	/**
	 * This method allows you to specify that the gesture requires both hands to be performed.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	public requireBothHands(): GestureBuilder<Name> {
		this.targetHandMode = "both";
		return this;
	}

	/**
	 * This method allows you to specify that a particular finger should be in a specific state for the gesture to be recognized.
	 * @param finger The finger that should be in a specific state for the gesture to be recognized, as a value from the Finger enum.
	 * @returns An object with an inState method that allows you to specify the expected state for the finger.
	 */
	public has(finger: Finger): {
		inState: (state: State) => GestureBuilder<Name>;
	} {
		return {
			inState: (state: State) => {
				this.basePoseRules.push(
					new FingerStateRule(this.targetHandMode, finger, state),
				);
				return this;
			},
		};
	}

	/**
	 * This method allows you to specify that all fingers should be in a specific state for the gesture to be recognized.
	 * @param state The expected state for all fingers, as a value from the State enum.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	public isClosedInto(state: State): GestureBuilder<Name> {
		const allFingers = [
			Finger.Thumb,
			Finger.Index,
			Finger.Middle,
			Finger.Ring,
			Finger.Pinky,
		];
		for (const finger of allFingers) {
			this.basePoseRules.push(
				new FingerStateRule(this.targetHandMode, finger, state),
			);
		}
		return this;
	}

	/**
	 * This method allows you to specify that two fingers should be pinching for the gesture to be recognized.
	 * @param fingerA The first finger that should be pinching for the gesture to be recognized.
	 * @param fingerB The second finger that should be pinching for the gesture to be recognized.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	public pinches(fingerA: Finger, fingerB: Finger): GestureBuilder<Name> {
		this.basePoseRules.push(
			new FingerDistanceRule(this.targetHandMode, fingerA, fingerB, 0.25),
		);
		return this;
	}

	/**
	 * A connector to make the API more readable.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	public and(): GestureBuilder<Name> {
		return this;
	}

	/**
	 * This method allows you to specify the trigger for the gesture.
	 * @returns A TriggerBuilder instance that allows you to define the trigger for the gesture.
	 */
	public thenTriggeredBy(): GestureBuilder<Name> {
		return this;
	}

	/**
	 * This method allows you to specify which fingers should be curled for the gesture to be recognized.
	 * @param fingers The fingers that should be curled for the gesture to be recognized.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	public curling(fingers: Finger[]): GestureBuilder<Name> {
		this.triggerFingers = fingers;
		return this;
	}

	/**
	 * This method allows you to specify the dominant finger for the gesture.
	 * @param finger The finger that is expected to be the dominant finger for the gesture.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	public determineDirectionFrom(finger: Finger): this {
		this.dominantFinger = finger;
		return this;
	}

	/**
	 * This method allows you to specify the confidence level required for the gesture to be recognized.
	 * @param value The confidence level required for the gesture to be recognized, as a number between 0 and 1.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	public withConfidence(value: number): this {
		this.targetConfidence = value;
		return this;
	}

	/**
	 * This method allows you to specify the duration for which the gesture must be held before it is recognized.
	 * @param ms The duration in milliseconds for which the gesture must be held before it is recognized.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	public holdFor(ms: number): this {
		this.holdDurationMs = ms;
		return this;
	}

	/**
	 * This method allows you to specify the cooldown period for the gesture, which is the time that must pass before the gesture can be recognized again.
	 * @param ms The cooldown period in milliseconds.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	public idleFor(ms: number): this {
		this.cooldownMs = ms;
		return this;
	}

	/**
	 * This method allows you to specify the expected direction for the gesture.
	 * @param direction The expected direction for the gesture, as a value from the Direction enum.
	 * @return The current instance of GestureBuilder, allowing for method chaining.
	 */
	public isPointing(direction: Direction): this {
		this.expectedDirection = direction;
		return this;
	}

	/**
	 * This method allows you to specify that the gesture is a system gesture, which means it will be recognized even when the application is not started.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	public asSystemGesture(): this {
		this.isSystemTrigger = true;
		return this;
	}
}

export class HandBuilder<Name extends string> {
	constructor(private builder: GestureBuilder<Name>) {}

	/**
	 * This method allows you to specify that a particular finger should be in a specific state for the gesture to be recognized.
	 * @param finger The finger that should be in a specific state for the gesture to be recognized, as a value from the Finger enum.
	 * @returns An object with an inState method that allows you to specify the expected state for the finger.
	 */
	public has(finger: Finger): {
		inState: (state: State) => GestureBuilder<Name>;
	} {
		return {
			inState: (state: State) => {
				this.builder.basePoseRules.push(
					new FingerStateRule(this.builder.targetHandMode, finger, state),
				);
				return this.builder;
			},
		};
	}

	/**
	 * This method allows you to specify that the gesture is pointing in a specific direction.
	 * @param direction The expected direction for the gesture, as a value from the Direction enum.
	 * @returns The current instance of HandBuilder, allowing for method chaining.
	 */
	public isPointing(direction: Direction): GestureBuilder<Name> {
		this.builder.expectedDirection = direction;
		return this.builder;
	}

	/**
	 * This method allows you to specify that all fingers should be in a specific state for the gesture to be recognized.
	 * @param state The expected state for all fingers, as a value from the State enum.
	 * @returns The current instance of HandBuilder, allowing for method chaining.
	 */
	public isClosedInto(state: State): GestureBuilder<Name> {
		const allFingers = [
			Finger.Thumb,
			Finger.Index,
			Finger.Middle,
			Finger.Ring,
			Finger.Pinky,
		];
		for (const finger of allFingers) {
			this.builder.basePoseRules.push(
				new FingerStateRule(this.builder.targetHandMode, finger, state),
			);
		}
		return this.builder;
	}

	/**
	 * This method allows you to specify that two fingers should be pinching for the gesture to be recognized.
	 * @param fingerA The first finger that should be pinching for the gesture to be recognized, as a value from the Finger enum.
	 * @param fingerB The second finger that should be pinching for the gesture to be recognized, as a value from the Finger enum.
	 * @returns The current instance of HandBuilder, allowing for method chaining.
	 */
	public pinches(fingerA: Finger, fingerB: Finger): GestureBuilder<Name> {
		this.builder.basePoseRules.push(
			new FingerDistanceRule(
				this.builder.targetHandMode,
				fingerA,
				fingerB,
				0.25,
			),
		);
		return this.builder;
	}

	/**
	 * This method is a connector to make the API more readable. It doesn't do anything, but it allows you to write near natural language when defining gestures.
	 * @returns The current instance of HandBuilder, allowing for method chaining.
	 */
	public and(): GestureBuilder<Name> {
		return this.builder;
	}

	/**
	 * This method allows you to specify the trigger for the gesture.
	 * @returns A TriggerBuilder instance that allows you to define the trigger for the gesture.
	 */
	public thenTriggeredBy(): GestureBuilder<Name> {
		return this.builder;
	}

	/**
	 * This method allows you to specify the duration for which the gesture must be held before it is recognized.
	 * @param ms The duration in milliseconds for which the gesture must be held before it is recognized.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	public holdFor(ms: number): GestureBuilder<Name> {
		return this.builder.holdFor(ms);
	}

	/**
	 * This method allows you to specify the cooldown period for the gesture, which is the time that must pass before the gesture can be recognized again.
	 * @param ms The cooldown period in milliseconds.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	public idleFor(ms: number): GestureBuilder<Name> {
		return this.builder.idleFor(ms);
	}

	/**
	 * This method allows you to specify that the gesture is a system gesture, which means it will be recognized even when the application is not started.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	public asSystemGesture(): GestureBuilder<Name> {
		return this.builder.asSystemGesture();
	}

	/**
	 * This method is a connector to make the API more readable. It doesn't do anything, but it allows you to write near natural language when defining gestures.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	get where() {
		return this.builder;
	}

	/**
	 * This method allows you to specify the confidence level required for the gesture to be recognized.
	 * @param value The confidence level required for the gesture to be recognized, as a number between 0 and 1.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	public withConfidence(value: number): GestureBuilder<Name> {
		return this.builder.withConfidence(value);
	}
}

export class TriggerBuilder<Name extends string> {
	constructor(private builder: GestureBuilder<Name>) {}

	/**
	 * This method allows you to specify which fingers should be curled for the gesture to be recognized.
	 * @param fingers The fingers that should be curled for the gesture to be recognized, as an array of values from the Finger enum.
	 * @returns The current instance of TriggerBuilder, allowing for method chaining.
	 */
	public curling(fingers: Finger[]): GestureBuilder<Name> {
		this.builder.triggerFingers = fingers;
		return this.builder;
	}

	/**
	 * This method allows you to specify the cooldown period for the gesture, which is the time that must pass before the gesture can be recognized again.
	 * @param ms The cooldown period in milliseconds.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	public idleFor(ms: number): GestureBuilder<Name> {
		this.builder.cooldownMs = ms;
		return this.builder;
	}

	/**
	 * This method allows you to specify the duration for which the gesture must be held before it is recognized.
	 * @param ms The duration in milliseconds for which the gesture must be held before it is recognized.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	public holdFor(ms: number): GestureBuilder<Name> {
		this.builder.holdDurationMs = ms;
		return this.builder;
	}

	/**
	 * This method allows you to specify the confidence level required for the gesture to be recognized.
	 * @param value The confidence level required for the gesture to be recognized, as a number between 0 and 1.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	public withConfidence(value: number): GestureBuilder<Name> {
		this.builder.targetConfidence = value;
		return this.builder;
	}

	/**
	 * This method allows you to specify the expected direction for the gesture.
	 * @param direction The expected direction for the gesture, as a value from the Direction enum.
	 * @returns The current instance of GestureBuilder, allowing for method chaining.
	 */
	public isPointing(direction: Direction): GestureBuilder<Name> {
		this.builder.expectedDirection = direction;
		return this.builder;
	}
}

export const Gesture = {
	/**
	 * This method allows you to create a new GestureBuilder instance with the specified name.
	 * @param name The name of the gesture to be created.
	 * @returns A new instance of GestureBuilder with the specified name.
	 */
	create<Name extends string>(name: Name): GestureBuilder<Name> {
		return new GestureBuilder(name);
	},

	/**
	 * This method allows you to create a new GestureBuilder instance from a preset gesture configuration.
	 * @param preset The preset gesture configuration to be used for creating the new GestureBuilder instance.
	 * @returns The preset gesture configuration, allowing for method chaining and further customization of the gesture.
	 */
	fromPreset<T>(preset: T): T {
		return preset;
	},
} as const;
