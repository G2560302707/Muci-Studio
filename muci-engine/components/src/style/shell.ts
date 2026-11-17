// WindowShell 壳层几何的画幅化辅助。
// 竖屏：沿用原稿数值（unit=1 时输出与旧字面量完全一致）；
// 横屏：画布矮，外层留白收窄、窗体放宽，给内容换高度（横屏数值按 1080 高画布书写）。
import type { FrameLayout } from "./layout";

// 窗体标题栏逻辑高度（与 WindowShell.tsx 内部一致，改一处须同步两处）。
export const SHELL_TITLEBAR = 82;

// 外层 AbsoluteFill 留白：竖屏沿用原稿 88；横屏收窄到 48。
export const shellOuterPad = (L: FrameLayout): number =>
  L.portrait ? L.s(88) : L.s(48);

// 窗体默认最大宽度：竖屏沿用原稿 920；横屏放宽到 1240，且不超过画布减两倍留白。
// 组件若显式传 maxWidth prop，由组件自行决定是否覆盖。
export const shellWindowMaxWidth = (canvasWidth: number, L: FrameLayout): number =>
  L.portrait ? L.s(920) : Math.min(1240, canvasWidth - shellOuterPad(L) * 4);

// 窗体 body 内容区的可用高度（真实 px）。
// padTopPx / padBotPx 传竖屏逻辑值，即组件传给 WindowShell 的 padding 上下数值。
// 供横屏分支做高度预算（图片高度、行距压缩等）；竖屏不要用它改布局。
export const shellBodyAvailHeight = (
  canvasHeight: number,
  L: FrameLayout,
  padTopPx: number,
  padBotPx: number,
): number =>
  canvasHeight -
  shellOuterPad(L) * 2 -
  L.s(SHELL_TITLEBAR) -
  L.s(padTopPx) -
  L.s(padBotPx);
