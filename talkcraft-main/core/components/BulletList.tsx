import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { useMiSansFonts } from "../lib/fonts";
import { useTheme } from "../style/ThemeContext";
import { getFrameLayout } from "../style/layout";
import { shellWindowMaxWidth } from "../style/shell";

type BulletListProps = {
  items: string[];
  title?: string;
  startAt?: number;
  highlightIndex?: number;
};

export const BulletList: React.FC<BulletListProps> = ({
  items,
  title = "",
  startAt = 10,
  highlightIndex,
}) => {
  useMiSansFonts();
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  // ep04 世代组件：按 720×1280 设计（720×1280 下逐像素不变）。
  const L = getFrameLayout(width, height);
  const t = useTheme();
  const framesPerChar = 2;
  const gapFrames = 12;
  const titleLength = title.length;
  const titleEnd = startAt + titleLength * framesPerChar;

  const itemStarts = items.map((item, index) => {
    const previousLength = items
      .slice(0, index)
      .reduce((total, previous) => total + previous.length * framesPerChar + gapFrames, 0);
    return titleLength > 0
      ? titleEnd + gapFrames + previousLength
      : startAt + previousLength;
  });

  const activeLineIndex = (() => {
    if (titleLength > 0 && frame < titleEnd + gapFrames) return -1;
    for (let index = items.length - 1; index >= 0; index -= 1) {
      if (frame >= itemStarts[index]) return index;
    }
    return -1;
  })();

  const visibleTitleLength = Math.max(
    0,
    Math.floor((frame - startAt) / framesPerChar),
  );

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
          padding: `${L.s(72)}px ${L.s(76)}px ${L.s(88)}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: L.s(38),
        }}
      >
        {titleLength > 0 && (
          <div
            style={{
              fontSize: L.s(88),
              fontWeight: 600,
              lineHeight: 1.15,
              textAlign: "center",
              letterSpacing: "0em",
            }}
          >
            {title.slice(0, visibleTitleLength)}
            {activeLineIndex === -1 && frame < titleEnd && (
              <Cursor visible={frame % 16 < 10} L={L} />
            )}
          </div>
        )}

        {items.map((item, index) => {
          const itemStart = itemStarts[index];
          const visibleLength = Math.max(
            0,
            Math.floor((frame - itemStart) / framesPerChar),
          );
          const isTyping = visibleLength < item.length && frame >= itemStart;
          const showCursor =
            index === activeLineIndex && isTyping;
          const isHighlighted = highlightIndex === index;

          return (
            <div
              key={item}
              style={{
                fontSize: L.s(48),
                fontWeight: 600,
                lineHeight: 1.3,
                textAlign: "center",
                color: isHighlighted ? t.colors.accent : t.colors.ink,
                letterSpacing: "0.01em",
              }}
            >
              {item.slice(0, visibleLength)}
              {showCursor && <Cursor visible={true} L={L} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Cursor: React.FC<{ visible: boolean; L: ReturnType<typeof getFrameLayout> }> = ({
  visible,
  L,
}) => {
  const t = useTheme();
  return (
    <span
      style={{
        display: "inline-block",
        width: L.s(38),
        height: L.s(64),
        marginLeft: L.s(16),
        backgroundColor: visible ? t.colors.inkSoft : "transparent",
        transform: `translateY(${L.s(6)}px)`,
      }}
    />
  );
};
