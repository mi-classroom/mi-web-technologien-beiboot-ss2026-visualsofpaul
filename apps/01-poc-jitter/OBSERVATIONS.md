# Observations: MediaPipe Hand Tracking Analysis

## 1. Experimental Setup

- **Hardware:** MacBook Air M1 (Battery mode, no power supply)
- **Environment:** Comparison between optimal lighting and low-light (monitor glow).
- **Measurement:** 3D Euclidean Jitter (Standard Deviation) captured over 2000ms windows.

## 2. Quantitative Results

### Scenario A: Optimal Lighting (3 Measurements)

| Landmark   | Avg. Jitter (Still) | Observation                      |
| :--------- | :------------------ | :------------------------------- |
| 4 (Thumb)  | ~0.0020             | Stable lock                      |
| 8 (Index)  | ~0.0019             | Very precise                     |
| 20 (Pinky) | ~0.0028             | Slightly higher noise than index |

**Performance:** Latency stable between 9ms and 16ms.

### Scenario B: Low Light (3 Measurements)

| Landmark   | Avg. Jitter (Still) | Observation           |
| :--------- | :------------------ | :-------------------- |
| 4 (Thumb)  | ~0.0052             | Visible micro-jitter  |
| 8 (Index)  | ~0.0040             | Reasonable lock       |
| 20 (Pinky) | ~0.0056             | Increased fluctuation |

**Performance:** Latency remains identical (~9-20ms), but data quality degrades. Jitter increases by factor ~2.5.

---

## 3. Qualitative Analysis & Edge Cases

### Occlusion (Hidden Thumb)

- **Observation:** When the thumb is covered by the hand, jitter spikes to **0.022** (+1000% noise).
- **Phantom Effect:** The model predicts the thumb position based on anatomical probability. The point "floats" in the air where the thumb is expected to be, even if not visible.

### Distance Variations

- **Far Away:** Surprisingly low jitter (~0.0012). The model seems to apply stronger smoothing on smaller hand representations.
- **Close Range:** High jitter (~0.008 to 0.020). The proximity to the camera lens and resulting distortions significantly decrease coordinate stability.

## 4. Conclusion

The system is highly reliable for 2D/3D interaction. However, for gesture recognition, a "noise gate" or smoothing filter (like One Euro Filter) is recommended to handle the ~250% noise increase in low-light environments and to mitigate "jumpy" coordinates during occlusion.
