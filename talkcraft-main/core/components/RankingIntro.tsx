import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { WindowShell } from "./WindowShell";
import { useTheme } from "../style/ThemeContext";
import { getFrameLayout } from "../style/layout";
import { p } from "../lib/motion";

type RankingItem = {
  title: string;
  org: string;
  weeklyStars: number;
};

type RankingIntroProps = {
  title: string;
  items: RankingItem[];
};

export const RankingIntro: React.FC<RankingIntroProps> = ({ title, items }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  // ep01–03 世代组件：按 1080×1920 设计。
  const L = getFrameLayout(width, height, { portraitHeight: 1920 });
  const t = useTheme();
  const titleProgress = p(frame, 0, 16);

  return (
    <WindowShell padding={`${L.s(70)}px ${L.s(64)}px ${L.s(80)}px`}>
      <div
        style={{
          width: "100%",
          fontSize: L.s(76),
          fontWeight: 600,
          lineHeight: 1.15,
          textAlign: "center",
          letterSpacing: "0em",
          // 横屏高度预算紧，标题下边距收半。
          marginBottom: L.s(L.portrait ? 56 : 32),
          clipPath: `inset(0 ${(1 - titleProgress) * 100}% 0 0)`,
          transform: `translateX(${(1 - titleProgress) * L.s(18)}px)`,
        }}
      >
        {title}
      </div>

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: L.s(20),
        }}
      >
        {items.map((item, index) => {
          const progress = p(frame, 10 + index * 9, 16);
          return (
            <div
              key={item.title}
              style={{
                display: "flex",
                alignItems: "center",
                gap: L.s(26),
                backgroundColor: t.colors.surface,
                borderRadius: L.s(26),
                // 横屏单行紧凑行（org 内联到标题右侧）；竖屏沿用原稿双行。
                padding: L.portrait
                  ? `${L.s(28)}px ${L.s(32)}px`
                  : `${L.s(18)}px ${L.s(28)}px`,
                opacity: progress,
                transform: `translateX(${(1 - progress) * L.s(48)}px)`,
              }}
            >
              <div
                style={{
                  fontSize: L.s(L.portrait ? 60 : 48),
                  fontWeight: 600,
                  color: t.colors.ink,
                  minWidth: L.s(84),
                  lineHeight: 1,
                  letterSpacing: "-0.01em",
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              {L.portrait ? (
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: L.s(46),
                      fontWeight: 600,
                      lineHeight: 1.15,
                      color: t.colors.ink,
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: L.s(30),
                      fontWeight: 600,
                      color: t.colors.inkMute,
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
                      fontSize: L.s(46),
                      fontWeight: 600,
                      lineHeight: 1.15,
                      color: t.colors.ink,
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: L.s(30),
                      fontWeight: 600,
                      color: t.colors.inkMute,
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
                  gap: L.s(7),
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
    </WindowShell>
  );
};
