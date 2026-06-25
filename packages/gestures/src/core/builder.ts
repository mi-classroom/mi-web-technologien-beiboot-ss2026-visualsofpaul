import { FingerDistanceRule, FingerStateRule } from "@/core/rules";
import { Direction, Finger, type Rule, type State } from "@/core/types";

export class GestureBuilder<Name extends string> {
	public basePoseRules: Rule[] = [];
	public triggerFingers: Finger[] = [];
	public targetHandMode: "left" | "right" | "both" | "any" = "any";
	public expectedDirection: Direction = Direction.Any;
	public dominantFinger: Finger = Finger.Index;
	public targetConfidence: number = 0.8;
	public cooldownMs: number = 400;
	public isSystemTrigger: boolean = false;

	constructor(public readonly name: Name) {}

	get where() {
		return this;
	}

	public anyHand() {
		this.targetHandMode = "any";
		return new HandBuilder(this);
	}

	public leftHand() {
		this.targetHandMode = "left";
		return new HandBuilder(this);
	}

	public rightHand() {
		this.targetHandMode = "right";
		return new HandBuilder(this);
	}

	public requireBothHands() {
		this.targetHandMode = "both";
		return new HandBuilder(this);
	}

	public thenTriggeredBy() {
		return new TriggerBuilder(this);
	}

	public determineDirectionFrom(finger: Finger): this {
		this.dominantFinger = finger;
		return this;
	}

	public withConfidence(value: number): this {
		this.targetConfidence = value;
		return this;
	}

	public stableFor(ms: number): this {
		this.cooldownMs = ms;
		return this;
	}

	public isPointing(direction: Direction): this {
		this.expectedDirection = direction;
		return this;
	}

	public asSystemGesture(): this {
		this.isSystemTrigger = true;
		return this;
	}
}

export class HandBuilder<Name extends string> {
	constructor(private builder: GestureBuilder<Name>) {}

	public has(finger: Finger) {
		return {
			inState: (state: State) => {
				this.builder.basePoseRules.push(
					new FingerStateRule(this.builder.targetHandMode, finger, state),
				);
				return this;
			},
		};
	}

	public isPointing(direction: Direction): this {
		this.builder.expectedDirection = direction;
		return this;
	}

	public isClosedInto(state: State): this {
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
		return this;
	}

	public pinches(fingerA: Finger, fingerB: Finger): this {
		this.builder.basePoseRules.push(
			new FingerDistanceRule(
				this.builder.targetHandMode,
				fingerA,
				fingerB,
				0.25,
			),
		);
		return this;
	}

	public and() {
		return this;
	}

	public thenTriggeredBy(): TriggerBuilder<Name> {
		return new TriggerBuilder(this.builder);
	}

	public stableFor(ms: number): GestureBuilder<Name> {
		return this.builder.stableFor(ms);
	}

	public asSystemGesture(): GestureBuilder<Name> {
		return this.builder.asSystemGesture();
	}

	get where() {
		return this.builder;
	}
}

export class TriggerBuilder<Name extends string> {
	constructor(private builder: GestureBuilder<Name>) {}

	public curling(fingers: Finger[]): this {
		this.builder.triggerFingers = fingers;
		return this;
	}

	public stableFor(ms: number): GestureBuilder<Name> {
		this.builder.cooldownMs = ms;
		return this.builder;
	}
}

// biome-ignore lint/complexity/noStaticOnlyClass: we want to use this class as a namespace for static methods
export class Gesture {
	static create<Name extends string>(name: Name): GestureBuilder<Name> {
		return new GestureBuilder(name);
	}

	static fromPreset(preset: any): any {
		return preset;
	}
}
