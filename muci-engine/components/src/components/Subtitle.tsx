import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { useMiSansFonts } from "../lib/fonts";
import { useTheme } from "../style/ThemeContext";
import { getFrameLayout } from "../style/layout";
import { p } from "../lib/motion";

export type SubtitleCue = {
  text: string;
  from: number;
  duration: number;
};

export const Subtitle: React.FC<{ cues: SubtitleCue[] }> = ({ cues }) => {
  useMiSansFonts();
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  // ep04 世代组件：按 720×1280 设计（720×1280 下逐像素不变）。
  const L = getFrameLayout(width, height);
  const t = useTheme();
  const active = cues.find(
    (cue) => frame >= cue.from && frame < cue.from + cue.duration,
  );
  if (!active) return null;

  const progress = p(frame, active.from, 12);
  const exitProgress = p(frame, active.from + active.duration - 8, 8);
  const opacity = progress * (1 - exitProgress);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: L.s(70),
        pointerEvents: "none",
        fontFamily: t.fonts.body,
      }}
    >
      <div
        style={{
          backgroundColor: t.colors.subBubble,
          borderRadius: L.s(22),
          padding: `${L.s(24)}px ${L.s(44)}px`,
          fontSize: L.s(40),
          fontWeight: 600,
          color: t.colors.subText,
          textAlign: "center",
          maxWidth: "86%",
          lineHeight: 1.2,
          letterSpacing: "0.01em",
          boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
          opacity,
          transform: `translateY(${(1 - progress) * L.s(16)}px)`,
        }}
      >
        {active.text}
      </div>
    </AbsoluteFill>
  );
};
