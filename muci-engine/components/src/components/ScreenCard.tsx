import React from "react";
import {
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { WindowShell } from "./WindowShell";
import { useTheme } from "../style/ThemeContext";
import { getFrameLayout } from "../style/layout";
import { shellBodyAvailHeight } from "../style/shell";

type ScreenCardProps = {
  src: string;
  aspect?: number;
  title?: string;
  speedBadge?: string;
  focusFrom?: number;
  focusTo?: number;
};

export const ScreenCard: React.FC<ScreenCardProps> = ({
  src,
  aspect = 1.9,
  title,
  speedBadge,
  focusFrom = 1,
  focusTo = 1.04,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();
  // ep01–03 世代组件：按 1080×1920 设计。
  const L = getFrameLayout(width, height, { portraitHeight: 1920 });
  const t = useTheme();
  const progress = frame / Math.max(durationInFrames - 1, 1);
  const scale = interpolate(progress, [0, 1], [focusFrom, focusTo]);
  const entrance = spring({ frame, fps, config: { damping: 14 } });
  const visibleTitleLength = Math.max(
    0,
    Math.floor((frame - 12) / 2),
  );
  const isTyping = title ? visibleTitleLength < title.length : false;

  // 竖屏沿用原公式（宽度驱动）；横屏画布矮，图片高度受窗体内容区预算约束。
  const baseHeight = Math.min((width * 0.66) / aspect, L.s(620));
  const heightBudget =
    shellBodyAvailHeight(height, L, 58, 72) - (title ? L.s(102) : 0);
  const imageHeight = L.portrait ? baseHeight : Math.min(baseHeight, heightBudget);

  return (
    <WindowShell padding={`${L.s(58)}px ${L.s(58)}px ${L.s(72)}px`}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: imageHeight,
          borderRadius: L.s(32),
          overflow: "hidden",
          backgroundColor: t.colors.imgBg,
          border: `2px solid ${t.colors.line}`,
          opacity: entrance,
          transform: `scale(${0.98 + entrance * 0.02})`,
        }}
      >
        <Img
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            transform: `scale(${scale})`,
          }}
        />
        {speedBadge ? (
          <div
            style={{
              position: "absolute",
              top: L.s(24),
              right: L.s(24),
              // 贴在白色截图上的徽章固定浅色，不随主题反转
              backgroundColor: t.colors.onImgChipBg,
              color: t.colors.onImgChipText,
              padding: `${L.s(14)}px ${L.s(26)}px`,
              borderRadius: 999,
              fontSize: L.s(30),
              fontWeight: 600,
            }}
          >
            {speedBadge}
          </div>
        ) : null}
      </div>
      {title ? (
        <div
          style={{
            marginTop: L.s(44),
            textAlign: "center",
            color: t.colors.ink,
            fontSize: L.s(58),
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: "0.01em",
          }}
        >
          {title.slice(0, visibleTitleLength)}
          {isTyping && (
            <span
              style={{
                display: "inline-block",
                width: L.s(34),
                height: L.s(54),
                marginLeft: L.s(14),
                backgroundColor: frame % 16 < 10 ? t.colors.ink : "transparent",
                transform: `translateY(${L.s(6)}px)`,
              }}
            />
          )}
        </div>
      ) : null}
    </WindowShell>
  );
};
