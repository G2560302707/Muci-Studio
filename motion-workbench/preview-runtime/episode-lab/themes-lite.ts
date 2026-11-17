// 实验室预览用极简主题表（仅 stage/accent/字幕色）。
// 正式成片仍以 muci-engine/components/src/style/themes.ts 为准；此处不回写主工程。

export type ThemeName = "whiteWindow" | "blackGold";

export type LabTheme = {
  name: ThemeName;
  stageBg: string;
  paper: string;
  ink: string;
  accent: string;
  onAccent: string;
  subBubble: string;
  subText: string;
  label: string;
};

export const LAB_THEMES: Record<ThemeName, LabTheme> = {
  whiteWindow: {
    name: "whiteWindow",
    stageBg: "#ffffff",
    paper: "#f5f5f7",
    ink: "#111114",
    accent: "#7C3AED",
    onAccent: "#FFFFFF",
    subBubble: "rgba(17,17,20,0.84)",
    subText: "#ffffff",
    label: "白窗紫",
  },
  blackGold: {
    name: "blackGold",
    stageBg: "#000000",
    paper: "#1a1a20",
    ink: "#ffffff",
    accent: "#fbbf24",
    onAccent: "#0b0b0f",
    subBubble: "rgba(0,0,0,0.72)",
    subText: "#ffffff",
    label: "黑金",
  },
};

export function resolveLabTheme(name: string | undefined): LabTheme {
  if (name === "blackGold") return LAB_THEMES.blackGold;
  return LAB_THEMES.whiteWindow;
}
