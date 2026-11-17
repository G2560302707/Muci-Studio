import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { WindowShell } from "./WindowShell";
import { useTheme } from "../style/ThemeContext";
import { getFrameLayout } from "../style/layout";
import { p, springAt } from "../lib/motion";

type PillTagsProps = {
  items: string[];
  cues?: number[];
  popInterval?: number;
};

export const PillTags: React.FC<PillTagsProps> = ({
  items,
  cues,
  popInterval = 8,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  // ep01–03 世代组件：按 1080×1920 设计。
  const L = getFrameLayout(width, height, { portraitHeight: 1920 });
  const t = useTheme();
  const starts = items.map(
    (item, index) => cues?.[index] ?? 8 + index * popInterval,
  );
  const activeIndex = starts.reduce(
    (currentIndex, start, index) => (frame >= start ? index : currentIndex),
    -1,
  );

  return (
    <WindowShell padding={`${L.s(96)}px ${L.s(88)}px ${L.s(108)}px`}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: L.s(28),
          maxWidth: L.s(760),
        }}
      >
        {items.map((item, index) => {
          const start = starts[index];
          const progress = p(frame, start, 16);
          const scale = springAt(frame, start, 18, 0.07);
          const isActive = index === activeIndex;
          return (
            <div
              key={item}
              style={{
                backgroundColor: isActive ? t.colors.accent : t.colors.surface,
                color: isActive ? t.colors.onAccent : t.colors.ink,
                padding: `${L.s(28)}px ${L.s(52)}px`,
                borderRadius: 999,
                fontSize: L.s(44),
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: "0.01em",
                opacity: progress,
                transform: `scale(${scale})`,
              }}
            >
              {item}
            </div>
          );
        })}
      </div>
    </WindowShell>
  );
};
