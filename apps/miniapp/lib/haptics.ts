export type HapticStyle = "light" | "medium" | "heavy";

export function haptic(style: HapticStyle = "light") {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  const patterns: Record<HapticStyle, number | number[]> = {
    light: 10,
    medium: 25,
    heavy: [40, 10, 40],
  };
  navigator.vibrate(patterns[style]);
}
