import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { p, springAt } from "../lib/motion";
import { WindowShell } from "./WindowShell";
import { useTheme } from "../style/ThemeContext";
import { getFrameLayout } from "../style/layout";

type OutroItem = {
  title: string;
  org: string;
  weeklyStars: number;
};

type OutroCardProps = {
  title: string;
  items: OutroItem[];
  question: string;
  button: string;
};

export const OutroCard: React.FC<OutroCardProps> = ({
  items,
  question,
  button,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  // ep01–03 世代组件：按 1080×1920 设计。
  const L = getFrameLayout(width, height, { portraitHeight: 1920 });
  const t = useTheme();

  return (
    <WindowShell
      padding={
        L.portrait
          ? `${L.s(78)}px ${L.s(70)}px ${L.s(92)}px`
          : `${L.s(56)}px ${L.s(64)}px ${L.s(64)}px`
      }
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          color: t.colors.ink,
        }}
      >
        <div
          style={{
            fontSize: L.s(72),
            fontWeight: 600,
            lineHeight: 1.2,
            marginBottom: L.s(L.portrait ? 40 : 24),
            opacity: p(frame, 0, 14),
          }}
        >
          本周 <span style={{ color: t.colors.accent }}>GitHub 涨星</span> Top 5
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: L.s(20) }}>
          {items.map((item, index) => {
            const at = 6 + index * 8;
            const progress = p(frame, at, 14);
            return (
              <div
                key={item.title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: L.s(24),
                  backgroundColor: t.colors.surface,
                  borderRadius: L.s(26),
                  // 横屏单行紧凑行；竖屏沿用原稿双行。
                  padding: L.portrait
                    ? `${L.s(28)}px ${L.s(34)}px`
                    : `${L.s(18)}px ${L.s(28)}px`,
                  opacity: progress,
                  transform: `translateX(${(1 - progress) * L.s(28)}px)`,
                }}
              >
                <div
                  style={{
                    fontSize: L.s(L.portrait ? 60 : 48),
                    fontWeight: 600,
                    color: t.colors.ink,
                    minWidth: L.s(74),
                    lineHeight: 1,
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>
                {L.portrait ? (
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: L.s(44),
                        fontWeight: 600,
                        lineHeight: 1.15,
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: L.s(30),
                        fontWeight: 600,
                        color: t.colors.inkFaint,
                        marginTop: L.s(5),
                      }}
                    >
                      {item.org}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "baseline",
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: L.s(44),
                        fontWeight: 600,
                        lineHeight: 1.15,
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: L.s(30),
                        fontWeight: 600,
                        color: t.colors.inkFaint,
                        marginLeft: L.s(16),
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.org}
                    </div>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: L.s(6),
                    whiteSpace: "nowrap",
                    color: t.colors.accent,
                    fontWeight: 600,
                  }}
                >
                  <span style={{ fontSize: L.s(30) }}>★</span>
                  <span style={{ fontSize: L.s(38) }}>
                    +{item.weeklyStars.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {L.portrait ? (
          <div style={{ textAlign: "center", marginTop: L.s(58) }}>
            <div
              style={{
                fontSize: L.s(60),
                fontWeight: 600,
                marginBottom: L.s(34),
                opacity: p(frame, 56, 16),
                transform: `translateY(${(1 - p(frame, 56, 16)) * L.s(14)}px)`,
              }}
            >
              {question}
            </div>
            <div
              style={{
                display: "inline-block",
                backgroundColor: t.colors.accent,
                color: t.colors.onAccent,
                borderRadius: 999,
                padding: `${L.s(22)}px ${L.s(58)}px`,
                fontSize: L.s(44),
                fontWeight: 600,
                opacity: p(frame, 68, 14),
                transform: `scale(${springAt(frame, 68, 18, 0.06)})`,
              }}
            >
              {button}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: L.s(24),
              marginTop: L.s(32),
            }}
          >
            <div
              style={{
                fontSize: L.s(44),
                fontWeight: 600,
                opacity: p(frame, 56, 16),
                transform: `translateY(${(1 - p(frame, 56, 16)) * L.s(14)}px)`,
              }}
            >
              {question}
            </div>
            <div
              style={{
                display: "inline-block",
                flexShrink: 0,
                backgroundColor: t.colors.accent,
                color: t.colors.onAccent,
                borderRadius: 999,
                padding: `${L.s(22)}px ${L.s(58)}px`,
                fontSize: L.s(44),
                fontWeight: 600,
                opacity: p(frame, 68, 14),
                transform: `scale(${springAt(frame, 68, 18, 0.06)})`,
              }}
            >
              {button}
            </div>
          </div>
        )}
      </div>
    </WindowShell>
  );
};
