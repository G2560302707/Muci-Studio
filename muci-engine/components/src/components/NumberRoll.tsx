import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { mix, p } from "../lib/motion";
import { useMiSansFonts } from "../lib/fonts";
import { useTheme } from "../style/ThemeContext";
import { getFrameLayout } from "../style/layout";
import { shellWindowMaxWidth } from "../style/shell";

type NumberRollProps = {
  value: number;
  from?: number;
  duration?: number;
  format?: (value: number) => string;
  label?: string;
  caption?: string;
  style?: React.CSSProperties;
};

const defaultFormat = (value: number) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const NumberRoll: React.FC<NumberRollProps> = ({
  value,
  from = 0,
  duration = 30,
  format = defaultFormat,
  label = "",
  caption = "",
  style,
}) => {
  useMiSansFonts();
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  // ep04 世代组件：按 720×1280 设计。
  const L = getFrameLayout(width, height);
  const t = useTheme();
  const progress = p(frame, from, duration);
  const displayValue = Math.round(mix(0, value, progress));
  const fontFamily = t.fonts.body;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: shellWindowMaxWidth(width, L),
        backgroundColor: t.colors.paper,
        borderRadius: L.s(36),
        border: `2px solid ${t.colors.line}`,
        overflow: "hidden",
        boxShadow: t.shadow.card,
        fontFamily,
        color: t.colors.ink,
      }}
    >
      <div
        style={{
          height: L.s(82),
          display: "flex",
          alignItems: "center",
          paddingLeft: L.s(36),
          gap: L.s(14),
          backgroundColor: t.colors.surface,
        }}
      >
        <div style={{ width: L.s(18), height: L.s(18), borderRadius: L.s(9), backgroundColor: t.colors.dot1 }} />
        <div style={{ width: L.s(18), height: L.s(18), borderRadius: L.s(9), backgroundColor: t.colors.dot2 }} />
        <div style={{ width: L.s(18), height: L.s(18), borderRadius: L.s(9), backgroundColor: t.colors.dot3 }} />
      </div>

      <div
        style={{
          padding: `${L.s(76)}px ${L.s(76)}px ${L.s(92)}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: L.s(30),
        }}
      >
        {label && (
          <div
            style={{
              fontSize: L.s(44),
              fontWeight: 600,
              lineHeight: 1.2,
              textAlign: "center",
              letterSpacing: "0.01em",
            }}
          >
            {label}
          </div>
        )}

        <div
          style={{
            fontSize: L.s(224),
            fontWeight: 600,
            lineHeight: 1,
            textAlign: "center",
            letterSpacing: "-0.01em",
            fontVariantNumeric: "tabular-nums",
            ...style,
          }}
        >
          {format(displayValue)}
        </div>

        {caption && (
          <div
            style={{
              fontSize: L.s(40),
              fontWeight: 600,
              lineHeight: 1.2,
              textAlign: "center",
              letterSpacing: "0.01em",
              color: t.colors.accent,
            }}
          >
            {caption}
          </div>
        )}
      </div>
    </div>
  );
};
