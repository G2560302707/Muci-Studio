import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { WindowShell } from "./WindowShell";
import { useTheme } from "../style/ThemeContext";
import { getFrameLayout } from "../style/layout";

type ChapterCardProps = {
  index: number;
  total: number;
  title: string;
};

export const ChapterCard: React.FC<ChapterCardProps> = ({
  index,
  total,
  title,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  // ep01–03 世代组件：按 1080×1920 设计。
  const L = getFrameLayout(width, height, { portraitHeight: 1920 });
  const t = useTheme();
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame, [0, 18], [L.s(24), 0], {
    extrapolateRight: "clamp",
  });

  return (
    <WindowShell padding={`${L.s(92)}px ${L.s(84)}px ${L.s(104)}px`}>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: L.s(30),
          color: t.colors.ink,
          opacity,
          transform: `translateY(${translateY}px)`,
        }}
      >
        <div
          style={{
            padding: `${L.s(18)}px ${L.s(40)}px`,
            borderRadius: 999,
            backgroundColor: t.colors.surface,
            fontSize: L.s(40),
            fontWeight: 600,
            letterSpacing: "0.01em",
          }}
        >
          技巧 {index}/{total}
        </div>

        <div
          style={{
            fontSize: L.s(180),
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: "-0.01em",
          }}
        >
          {index}
        </div>

        <div
          style={{
            fontSize: L.s(68),
            fontWeight: 600,
            lineHeight: 1.25,
            textAlign: "center",
            letterSpacing: "0.01em",
          }}
        >
          {title}
        </div>
      </div>
    </WindowShell>
  );
};
