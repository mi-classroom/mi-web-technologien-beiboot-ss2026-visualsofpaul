import type { Landmark } from "@mediapipe/tasks-vision";

export class SignalSmoother {
  private buffer: Landmark[][] = [];

  constructor(private readonly bufferSize: number = 5) {}

  public smooth(landmarks: Landmark[]): Landmark[] {
    // Step 1: Add the new landmarks to the buffer
    this.buffer.push(landmarks);

    // Step 2: If the buffer exceeds the specified size, remove the oldest entry
    if (this.buffer.length > this.bufferSize) this.buffer.shift();

    // Step 3: Calculate the average of the landmarks in the buffer
    return landmarks.map((current, index) => {
      let sumX = 0,
        sumY = 0,
        sumZ = 0;

      this.buffer.forEach((frame) => {
        const point = frame[index];
        if (point) {
          sumX += point.x;
          sumY += point.y;
          sumZ += point.z;
        }
      });

      return {
        x: sumX / this.buffer.length,
        y: sumY / this.buffer.length,
        z: sumZ / this.buffer.length,
      };
    }) as Landmark[];
  }
}
