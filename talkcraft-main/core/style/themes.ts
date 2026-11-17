// 两套主题的唯一视觉来源（Phase 4 主题拆分）。
// whiteWindow：现状白窗紫，所有色值与 2026-11-14 像素基线逐字一致（保证已过审画面零变化）；
// blackGold：黑金（源自 custom-skills/github-top5-video/SKILL.md 的 Design Tokens：
//   #000000 底 + #fbbf24 金 + 白字 + Courier New）。
//   注意点：
//   · 明暗反转不是只换强调色——surface/line/shadow/inkSoft 全部按深色底重调；
//   · Courier New 无 CJK 字形，中文字体回退链显式落到 MiSans Semibold；
//   · 图片容器底 imgBg 两套都保持白色（截图本身是白底 OG 卡，暗底白卡是标准暗色模式形态）。
//
// 用法：组件内 const t = useTheme(); 颜色一律取 t.colors.*，字体取 t.fonts.body；
// 默认主题是 whiteWindow（ThemeContext 缺省值），已有调用点零改动。

export type ThemeName = "whiteWindow" | "blackGold";

export type Theme = {
  name: ThemeName;
  colors: {
    stageBg: string; // 舞台底（WindowShell 外层 / Backdrop / LightStage / 预览包裹层）
    paper: string; // 窗体底
    surface: string; // 标题栏 / 胶囊 / 解说条底
    imgBg: string; // 图片容器底（与截图同色）
    imgBgSoft: string; // 图片容器底·浅灰变体（FlashIntro，白窗=#f6f6f8）
    onImgChipBg: string; // 贴图胶囊底（压在截图上的 UI，固定浅色，不随主题反转）
    onImgChipText: string; // 贴图胶囊文字
    line: string; // 描边
    ink: string; // 主文字 / 光标 / 第三点
    inkSoft: string; // 次要点 / 光标灰
    inkMute: string; // 次要文字（RankingIntro org，白窗=rgba(17,17,20,0.54)）
    inkFaint: string; // 次要文字（ProjectCard/OutroCard org，白窗=rgba(17,17,20,0.52)）
    accent: string; // 强调色
    onAccent: string; // 强调底上的文字
    dot1: string; // 窗体三点
    dot2: string;
    dot3: string;
    subBubble: string; // 字幕泡底
    subText: string; // 字幕文字
    glowA: string; // Backdrop 光斑 A
    glowB: string; // Backdrop 光斑 B
  };
  shadow: {
    card: string; // 窗体卡片投影
  };
  fonts: {
    body: string;
  };
};

export const themes: Record<ThemeName, Theme> = {
  whiteWindow: {
    name: "whiteWindow",
    colors: {
      stageBg: "#ffffff",
      paper: "#ffffff",
      surface: "#f5f5f7",
      imgBg: "#FFFFFF",
      imgBgSoft: "#f6f6f8",
      onImgChipBg: "#F5F5F7",
      onImgChipText: "#111114",
      line: "#e5e5ea",
      ink: "#111114",
      inkSoft: "#8f8f9d",
      inkMute: "rgba(17,17,20,0.54)",
      inkFaint: "rgba(17,17,20,0.52)",
      accent: "#7C3AED",
      onAccent: "#FFFFFF",
      dot1: "#8b5cf6",
      dot2: "#8f8f9d",
      dot3: "#111114",
      subBubble: "rgba(17,17,20,0.84)",
      subText: "white",
      glowA: "rgba(124,58,237,0.07)",
      glowB: "rgba(17,17,20,0.04)",
    },
    shadow: {
      card: "0 28px 64px rgba(17,17,20,0.12)",
    },
    fonts: {
      body: '"MiSans Semibold", "PingFang SC", "Microsoft YaHei", sans-serif',
    },
  },
  blackGold: {
    name: "blackGold",
    colors: {
      stageBg: "#000000",
      paper: "#0b0b0f",
      surface: "#1a1a20",
      imgBg: "#FFFFFF",
      imgBgSoft: "#FFFFFF",
      onImgChipBg: "#F5F5F7",
      onImgChipText: "#111114",
      line: "#2c2c34",
      ink: "#ffffff",
      inkSoft: "#9a9aa6",
      inkMute: "rgba(255,255,255,0.60)",
      inkFaint: "rgba(255,255,255,0.58)",
      accent: "#fbbf24",
      onAccent: "#0b0b0f",
      dot1: "#fbbf24",
      dot2: "#9a9aa6",
      dot3: "#ffffff",
      subBubble: "rgba(0,0,0,0.72)",
      subText: "#ffffff",
      glowA: "rgba(251,191,36,0.10)",
      glowB: "rgba(251,191,36,0.05)",
    },
    shadow: {
      card: "0 28px 64px rgba(0,0,0,0.55)",
    },
    fonts: {
      body: '"Courier New", "MiSans Semibold", "PingFang SC", monospace',
    },
  },
};
