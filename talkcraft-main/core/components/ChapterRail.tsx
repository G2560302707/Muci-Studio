import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { useTheme } from "../style/ThemeContext";
import { getFrameLayout } from "../style/layout";
import { p } from "../lib/motion";

/** 常驻章节条（对标 Overlay ChapterBar 子集）：顶栏章节 + 可选说明。 */
export type ChapterRailProps = {
  chapters: string[];
  activeIndex?: number;
  caption?: string;
};

export const ChapterRail: React.FC<ChapterRailProps> = ({
  chapters,
  activeIndex = 0,
  caption = "",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const L = getFrameLayout(width, height);
  const t = useTheme();
  const enter = p(frame, 0, 12);
  const active = Math.max(0, Math.min(activeIndex, chapters.length - 1));

  return (
    <AbsoluteFill style={{ backgroundColor: t.colors.stageBg, fontFamily: t.fonts.body }}>
      <div
        style={{
          position: "absolute",
          top: L.s(48),
          left: L.s(56),
          right: L.s(56),
          display: "flex",
          gap: L.s(12),
          flexWrap: "wrap",
          opacity: enter,
        }}
      >
        {chapters.map((ch, i) => {
          const on = i === active;
          return (
            <div
              key={`${i}-${ch}`}
              style={{
                padding: `${L.s(14)}px ${L.s(28)}px`,
                borderRadius: 999,
                backgroundColor: on ? t.colors.accent : t.colors.surface,
                color: on ? t.colors.onAccent || "#fff" : t.colors.ink,
                fontSize: L.s(24),
                fontWeight: on ? 700 : 500,
                opacity: on ? 1 : 0.7,
              }}
            >
              {ch}
            </div>
          );
        })}
      </div>
      {caption ? (
        <div
          style={{
            position: "absolute",
            left: L.s(72),
            right: L.s(72),
            top: "42%",
            textAlign: "center",
            fontSize: L.s(44),
            fontWeight: 700,
            color: t.colors.ink,
            opacity: p(frame, 10, 14),
            lineHeight: 1.35,
          }}
        >
          {caption}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
