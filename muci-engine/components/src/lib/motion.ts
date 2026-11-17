export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const mix = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

export const p = (time: number, at = 0, duration = 24) => {
  const progress = clamp01((time - at) / duration);
  return 1 - Math.pow(1 - progress, 3);
};

export const q = (time: number, at = 0, duration = 24) => {
  const progress = clamp01((time - at) / duration);
  return progress * progress * (3 - 2 * progress);
};

export const springAt = (
  time: number,
  at = 0,
  duration = 26,
  amount = 0.045,
) => {
  const progress = clamp01((time - at) / duration);
  return 1 + amount * Math.sin(Math.PI * progress) * (1 - progress);
};

export const quintic = (time: number, at = 0, duration = 36) => {
  const progress = clamp01((time - at) / duration);
  return progress < 0.5
    ? 16 * Math.pow(progress, 5)
    : 1 - Math.pow(-2 * progress + 2, 5) / 2;
};
