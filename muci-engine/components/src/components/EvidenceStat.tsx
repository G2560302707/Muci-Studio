import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { WindowShell } from "./WindowShell";
import { useTheme } from "../style/ThemeContext";
import { getFrameLayout } from "../style/layout";
import { mix, p } from "../lib/motion";

/** 证据数字卡（对标 Overlay StatProof 语义）：大数字 + 标签 + 说明。 */
export type EvidenceStatProps = {
  value: number;
  label?: string;
  caption?: string;
  unit?: string;
  from?: number;
  duration?: number;
};

export const EvidenceStat: React.FC<EvidenceStatProps> = ({
  value,
  label = "证据",
  caption = "",
  unit = "",
  from = 0,
  duration = 36,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const L = getFrameLayout(width, height);
  const t = useTheme();
  const progress = p(frame, from, duration);
  const shown = Math.round(mix(0, value, progress));

  return (
    <WindowShell padding={`${L.s(72)}px ${L.s(80)}px`}>
      <div
        style={{
          color: t.colors.ink,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: L.s(18),
          opacity: p(frame, 0, 10),
        }}
      >
        <div
          style={{
            padding: `${L.s(10)}px ${L.s(22)}px`,
            borderRadius: 999,
            backgroundColor: t.colors.surface,
            fontSize: L.s(22),
            fontWeight: 600,
            color: t.colors.accent,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: L.s(96), fontWeight: 800, lineHeight: 1, letterSpacing: -1 }}>
          {shown.toLocaleString("zh-CN")}
          {unit ? (
            <span style={{ fontSize: L.s(36), fontWeight: 600, marginLeft: L.s(12), opacity: 0.7 }}>
              {unit}
            </span>
          ) : null}
        </div>
        {caption ? (
          <div style={{ fontSize: L.s(28), opacity: 0.72, lineHeight: 1.45, maxWidth: "92%" }}>
            {caption}
          </div>
        ) : null}
      </div>
    </WindowShell>
  );
};
