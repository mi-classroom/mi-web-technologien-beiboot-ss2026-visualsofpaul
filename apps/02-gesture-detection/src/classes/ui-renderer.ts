import type { GestureResult } from "../types";

export class UIRenderer {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;

	// Connectors
	public static readonly HAND_CONNECTIONS = [
		[0, 1],
		[1, 2],
		[2, 3],
		[3, 4], // Thumb
		[0, 5],
		[5, 6],
		[6, 7],
		[7, 8], // Index finger
		[0, 9],
		[9, 10],
		[10, 11],
		[11, 12], // Middle finger
		[0, 13],
		[13, 14],
		[14, 15],
		[15, 16], // Ring finger
		[0, 17],
		[17, 18],
		[18, 19],
		[19, 20], // Pinky
		[5, 9],
		[9, 13],
		[13, 17], // Hand base
	];

	public static readonly POSE_ARM_CONNECTIONS = [
		[11, 12], // Shoulders
		[11, 13],
		[13, 15], // Left Arm
		[12, 14],
		[14, 16], // Right Arm
	];

	constructor() {
		this.canvas = document.createElement("canvas") as HTMLCanvasElement;
		document.body.appendChild(this.canvas);
		this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
		this.resizeCanvas();
		window.addEventListener("resize", this.resizeCanvas.bind(this));
	}

	private resizeCanvas(): void {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.canvas.style.position = "fixed";
		this.canvas.style.top = "0";
		this.canvas.style.left = "0";
	}

	public clear(): void {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	public showGesture(gesture: GestureResult): void {
		if (!gesture.detected) return;

		const PADDING = 20;
		const X = PADDING;
		const Y = PADDING;

		this.ctx.fillStyle = "red";
		this.ctx.font = "bold 20px sans-serif";
		this.ctx.fillText(gesture.name, X, Y);
	}
}
