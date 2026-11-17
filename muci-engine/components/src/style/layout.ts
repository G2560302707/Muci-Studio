// 画幅适配工具：把「写死的 px」换成「按画布算出来的 px」。
//
// unit 规则（2026-11-14 画幅参数化修正）：
//   竖屏 unit = min(1, 画布高 ÷ 组件设计基准高)——只缩不放。库里有两代设计基准：
//     · ep04 世代（BulletList、NumberRoll、Subtitle）：按 720×1280 设计，
//       portraitHeight 缺省 1280，720×1280 下 unit=1，逐像素等于旧字面量（ep04 已过审画面零变化）；
//     · ep01–03 世代（其余 10 个 WindowShell 系组件）：按 1080×1920 设计，
//       组件传 { portraitHeight: 1920 }，1080×1920 预览 unit=1，逐像素不变（保住已入档预览）。
//     clamp 的原因：720 世代组件若在 1080×1920 放大 1.5，会被预览包裹层的 920px
//     可用宽度卡住（实测 NumberRoll 大数字横向溢出裁切），故竖屏一律不放大；
//     画布矮于组件设计基准时才等比缩小（如 1080 基准组件放 720×1280 → 0.667 整卡缩小可用）。
//   横屏 unit = 画布高 ÷ 1080（1920×1080 → 1.0；1280×720 → 0.667），横屏分支数值按
//   1080 高画布直接书写。
//   旧规则（min(宽/720, 高/舞台高)）在 1080×1920 会给出 1.5，把按 1080 设计的组件
//   撑爆画布（实测 OutroCard / ProjectCard 堆叠约 1500 / 1250 逻辑px），已废弃。
//
// 用法（组件里）：
//   const { width, height } = useVideoConfig();
//   const L = getFrameLayout(width, height, { portraitHeight: 1920 });
//   fontSize: L.s(40)          // 原来写 40 的地方
//   gridTemplateColumns: `repeat(${L.cols}, 1fr)`   // 预留：横屏多列
//
// 设计要点：等比缩放只解决「字和图在不在画内」；横屏该用几列、
// 图片占多大、字幕放哪，仍要靠 L.portrait / L.cols 单独分支处理。

const PORTRAIT_STAGE = { width: 720, height: 1280 };
const LANDSCAPE_STAGE_HEIGHT = 1080;

export type FrameLayout = {
  portrait: boolean;
  unit: number;
  s: (px: number) => number;
  cols: number;
  safeX: number;
  safeY: number;
  subtitleBottom: number;
  imageMaxHeight: (availableWidth: number) => number;
};

export const getFrameLayout = (
  width: number,
  height: number,
  design?: { portraitHeight?: number },
): FrameLayout => {
  const portrait = height >= width;
  const portraitStageHeight = design?.portraitHeight ?? PORTRAIT_STAGE.height;

  // 竖屏：按组件设计基准高等比，只缩不放（clamp 1）。
  //   720×1280（基准 1280）→ 1.0；1080×1920（基准 1280 或 1920）→ 1.0；
  //   1080 基准的组件放到 720×1280 → 0.667，整卡缩小可用。
  // 横屏：统一 1080 高度基准（1920×1080 → 1.0）。
  const unit = portrait
    ? Math.min(1, height / portraitStageHeight)
    : height / LANDSCAPE_STAGE_HEIGHT;
  const s = (px: number) => Math.round(px * unit * 100) / 100;

  return {
    portrait,
    unit,
    s,
    cols: portrait ? 1 : 2,
    safeX: s(56),
    safeY: s(36),
    subtitleBottom: s(96),
    imageMaxHeight: (availableWidth: number) =>
      Math.min(s(600), availableWidth * (portrait ? 0.62 : 0.42)),
  };
};
