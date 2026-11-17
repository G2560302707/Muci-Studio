import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useTheme } from "../style/ThemeContext";
import { getFrameLayout } from "../style/layout";
import { p } from "../lib/motion";

/**
 * 人物/画面聚焦运镜（对标 Overlay FocusCard 语义）：
 * 左侧缩框媒体 + 右侧要点逐条弹出。无 mediaSrc 时左侧为色块占位。
 */
export type FocusHostProps = {
  title?: string;
  items: string[];
  mediaSrc?: string;
};

export const FocusHost: React.FC<FocusHostProps> = ({
  title = "",
  items,
  mediaSrc = "",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const L = getFrameLayout(width, height);
  const t = useTheme();
  const enter = p(frame, 0, 14);
  const leftW = interpolate(enter, [0, 1], [0.92, 0.42]);

  return (
    <AbsoluteFill style={{ backgroundColor: t.colors.stageBg, fontFamily: t.fonts.body }}>
      <div
        style={{
          position: "absolute",
          left: L.s(48),
          top: L.s(72),
          bottom: L.s(72),
          width: `${leftW * 100}%`,
          maxWidth: "46%",
          borderRadius: L.s(28),
          overflow: "hidden",
          backgroundColor: t.colors.paper || "#fff",
          border: `2px solid ${t.colors.accent}33`,
          boxShadow: "0 18px 48px rgba(0,0,0,0.08)",
          opacity: enter,
        }}
      >
        {mediaSrc ? (
          <Img src={mediaSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: `linear-gradient(145deg, ${t.colors.surface}, ${t.colors.accent}22)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: t.colors.ink,
              fontSize: L.s(28),
              opacity: 0.55,
            }}
          >
            A-roll / 人物框
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          right: L.s(56),
          top: L.s(96),
          bottom: L.s(96),
          width: "46%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: L.s(22),
          color: t.colors.ink,
        }}
      >
        {title ? (
          <div style={{ fontSize: L.s(40), fontWeight: 700, lineHeight: 1.25, opacity: p(frame, 6, 12) }}>
            {title}
          </div>
        ) : null}
        {items.map((item, i) => {
          const local = p(frame, 16 + i * 10, 12);
          return (
            <div
              key={`${i}-${item}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: L.s(14),
                opacity: local,
                transform: `translateX(${(1 - local) * L.s(28)}px)`,
              }}
            >
              <div
                style={{
                  width: L.s(14),
                  height: L.s(14),
                  marginTop: L.s(12),
                  borderRadius: 4,
                  backgroundColor: t.colors.accent,
                  flexShrink: 0,
                }}
              />
              <div style={{ fontSize: L.s(30), fontWeight: 600, lineHeight: 1.4 }}>{item}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
