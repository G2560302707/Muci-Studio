import React from "react";
import { Img, useCurrentFrame, useVideoConfig } from "remotion";
import { WindowShell } from "./WindowShell";
import { useTheme } from "../style/ThemeContext";
import { getFrameLayout } from "../style/layout";
import { p } from "../lib/motion";

export type FlashItem = {
  image: string;
  title: string;
  rank: number;
  stars: number;
};

export const FlashIntro: React.FC<{
  items: FlashItem[];
  framesPerCard?: number;
}> = ({ items, framesPerCard = 15 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  // ep01–03 世代组件：按 1080×1920 设计。
  const L = getFrameLayout(width, height, { portraitHeight: 1920 });
  const t = useTheme();
  const index = Math.min(
    Math.floor(frame / framesPerCard),
    items.length - 1
  );
  const item = items[index];
  // 钳住局部帧:index 钳到最后一张后(定格阶段),帧差会超过 framesPerCard,
  // 若用 frame % framesPerCard 会让最后一张反复重播滑入动画(2026-11-14 用户发现)。
  const localFrame = Math.min(frame - index * framesPerCard, framesPerCard);
  const slideProgress = p(localFrame, 0, 8);
  const translateX = (1 - slideProgress) * L.s(320);

  return (
    <WindowShell padding={`${L.s(58)}px ${L.s(58)}px ${L.s(72)}px`}>
      <div
        style={{
          width: "100%",
          opacity: slideProgress,
          transform: `translateX(${translateX}px)`,
        }}
      >
        <div
          style={{
            width: "100%",
            maxHeight: L.s(600),
            borderRadius: L.s(28),
            overflow: "hidden",
            backgroundColor: t.colors.imgBgSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Img
            src={item.image}
            style={{
              width: "100%",
              height: "auto",
              maxHeight: L.s(600),
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: L.s(22),
            marginTop: L.s(38),
          }}
        >
          <div
            style={{
              fontSize: L.s(84),
              fontWeight: 600,
              color: t.colors.ink,
              lineHeight: 1,
              letterSpacing: "-0.01em",
            }}
          >
            {String(item.rank).padStart(2, "0")}
          </div>
          <div
            style={{
              flex: 1,
              fontSize: L.s(48),
              fontWeight: 600,
              color: t.colors.ink,
              lineHeight: 1.2,
              letterSpacing: "0.01em",
            }}
          >
            {item.title}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: L.s(8),
              whiteSpace: "nowrap",
              color: t.colors.accent,
              fontWeight: 600,
            }}
          >
            <span style={{ fontSize: L.s(34) }}>★</span>
            <span style={{ fontSize: L.s(40) }}>
              {item.stars.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </WindowShell>
  );
};
