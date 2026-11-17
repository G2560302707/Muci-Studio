import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { WindowShell } from "./WindowShell";
import { useTheme } from "../style/ThemeContext";
import { getFrameLayout } from "../style/layout";
import { p } from "../lib/motion";

type MaskTextProps = {
  text: string;
  from?: number;
  duration?: number;
  style?: React.CSSProperties;
};

export const MaskText: React.FC<MaskTextProps> = ({
  text,
  from = 0,
  duration = 24,
  style,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  // ep01–03 世代组件：按 1080×1920 设计。
  const L = getFrameLayout(width, height, { portraitHeight: 1920 });
  const t = useTheme();
  const progress = p(frame, from, duration);
  const visibleLength = Math.floor(text.length * progress);

  return (
    <WindowShell padding={`${L.s(84)}px ${L.s(88)}px ${L.s(104)}px`}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          color: t.colors.ink,
          fontSize: L.s(84),
          fontWeight: 600,
          lineHeight: 1.15,
          textAlign: "center",
          letterSpacing: "0em",
          maxWidth: "100%",
          ...style,
        }}
      >
        {text.slice(0, visibleLength)}
        {visibleLength < text.length && (
          <span
            style={{
              display: "inline-block",
              width: L.s(34),
              height: L.s(66),
              marginLeft: L.s(14),
              backgroundColor: t.colors.ink,
              transform: `translateY(${L.s(12)}px)`,
            }}
          />
        )}
      </div>
    </WindowShell>
  );
};
