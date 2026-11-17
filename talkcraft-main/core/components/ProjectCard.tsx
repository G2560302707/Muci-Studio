import React from "react";
import { Img, useCurrentFrame, useVideoConfig } from "remotion";
import { WindowShell } from "./WindowShell";
import { useTheme } from "../style/ThemeContext";
import { getFrameLayout } from "../style/layout";
import { shellBodyAvailHeight } from "../style/shell";
import { p } from "../lib/motion";

type ProjectCardProps = {
  rank: number;
  title: string;
  org: string;
  image: string;
  githubUrl: string;
  points: string[];
  stars?: number;
  weeklyStars?: number;
  overlayTags?: string[];
  caption: string;
};

const rankNames = ["第一名", "第二名", "第三名", "第四名", "第五名"];

export const ProjectCard: React.FC<ProjectCardProps> = ({
  rank,
  title,
  org,
  image,
  githubUrl,
  points,
  stars,
  weeklyStars,
  overlayTags,
  caption,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  // ep01–03 世代组件：按 1080×1920 设计（1080×1920 预览逐像素不变）。
  const L = getFrameLayout(width, height, { portraitHeight: 1920 });
  const t = useTheme();
  const headerProgress = p(frame, 0, 16);
  const imageProgress = p(frame, 10, 18);
  // 横屏分支的高度预算（竖屏不用它改布局）。
  const bodyAvail = shellBodyAvailHeight(height, L, 60, 76);

  const headerRow = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: L.s(18),
        marginBottom: L.s(24),
        opacity: headerProgress,
        transform: `translateY(${(1 - headerProgress) * L.s(20)}px)`,
      }}
    >
      <div
        style={{
          backgroundColor: t.colors.accent,
          color: t.colors.onAccent,
          borderRadius: 999,
          padding: `${L.s(16)}px ${L.s(32)}px`,
          fontSize: L.s(40),
          fontWeight: 600,
        }}
      >
        No.{rank}
      </div>
      <div style={{ fontSize: L.s(40), fontWeight: 600, color: t.colors.ink }}>
        {rankNames[rank - 1]}
      </div>
      <div style={{ flex: 1 }} />
      {typeof weeklyStars === "number" ? (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: L.s(7),
            color: t.colors.accent,
            fontWeight: 600,
          }}
        >
          <span style={{ fontSize: L.s(34) }}>★</span>
          <span style={{ fontSize: L.s(42) }}>
            +{weeklyStars.toLocaleString()}
          </span>
          <span style={{ fontSize: L.s(34), color: t.colors.ink }}>本周</span>
        </div>
      ) : null}
    </div>
  );

  const titleBlock = (
    <>
      <div
        style={{
          // 横屏列宽有限，标题降到 72 保住单行；竖屏维持原稿 84。
          fontSize: L.s(L.portrait ? 84 : 72),
          fontWeight: 600,
          lineHeight: 1.1,
          letterSpacing: "-0.01em",
          color: t.colors.ink,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: L.s(12),
          fontSize: L.s(34),
          fontWeight: 600,
          color: t.colors.inkFaint,
          // 横屏下 org 行可能过长，超出即省略号；竖屏容器窄，行为与原稿一致（换行）。
          whiteSpace: L.portrait ? "normal" : "nowrap",
          overflow: L.portrait ? "visible" : "hidden",
          textOverflow: L.portrait ? "clip" : "ellipsis",
        }}
      >
        {org}
        {typeof stars === "number"
          ? ` · 总星 ${stars >= 1000 ? `${Math.round(stars / 1000)}k` : stars}`
          : ""}
        {` · ${githubUrl}`}
      </div>
    </>
  );

  const imageBlock = (style: React.CSSProperties, withTags = L.portrait) => (
    <div
      style={{
        position: "relative",
        width: "100%",
        borderRadius: L.s(30),
        overflow: "hidden",
        border: `2px solid ${t.colors.line}`,
        backgroundColor: t.colors.imgBg,
        opacity: imageProgress,
        transform: `scale(${0.97 + imageProgress * 0.03})`,
        ...style,
      }}
    >
      <Img
        src={image}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
      {/* 竖屏：标签贴图底（原稿设计）；横屏：标签移到图片下方，避免压住截图内容 */}
      {overlayTags && withTags ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: L.s(30),
            padding: `0 ${L.s(34)}px`,
            display: "flex",
            flexWrap: "wrap",
            gap: L.s(16),
          }}
        >
          {overlayTags.map((tag, index) => {
            const progress = p(frame, 30 + index * 7, 14);
            return (
              <div
                key={tag}
                style={{
                  // 贴在白色截图上的 UI 固定浅色，不随主题反转
                  backgroundColor: t.colors.onImgChipBg,
                  color: t.colors.onImgChipText,
                  borderRadius: 999,
                  padding: `${L.s(16)}px ${L.s(30)}px`,
                  fontSize: L.s(34),
                  fontWeight: 600,
                  opacity: progress,
                  transform: `translateY(${(1 - progress) * L.s(10)}px)`,
                }}
              >
                {tag}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );

  // 横屏用：图片下方的标签行（与竖屏同一套胶囊样式，但不压图）。
  const tagRow = overlayTags ? (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        flexWrap: "wrap",
        gap: L.s(16),
      }}
    >
      {overlayTags.map((tag, index) => {
        const progress = p(frame, 30 + index * 7, 14);
        return (
          <div
            key={tag}
            style={{
              backgroundColor: t.colors.surface,
              color: t.colors.ink,
              borderRadius: 999,
              padding: `${L.s(16)}px ${L.s(30)}px`,
              fontSize: L.s(34),
              fontWeight: 600,
              opacity: progress,
              transform: `translateY(${(1 - progress) * L.s(10)}px)`,
            }}
          >
            {tag}
          </div>
        );
      })}
    </div>
  ) : null;

  const pointRows = points.map((point, index) => {
    const progress = p(frame, 46 + index * 10, 16);
    return (
      <div
        key={point}
        style={{
          display: "flex",
          alignItems: "center",
          gap: L.s(18),
          opacity: progress,
          transform: `translateX(${(1 - progress) * L.s(28)}px)`,
        }}
      >
        <div
          style={{
            width: L.s(16),
            height: L.s(16),
            borderRadius: L.s(8),
            backgroundColor: t.colors.accent,
          }}
        />
        <div
          style={{
            fontSize: L.s(44),
            fontWeight: 600,
            color: t.colors.ink,
            lineHeight: 1.2,
          }}
        >
          {point}
        </div>
      </div>
    );
  });

  const captionBlock = (style: React.CSSProperties) => (
    <div
      style={{
        marginTop: L.s(22),
        backgroundColor: t.colors.surface,
        borderRadius: L.s(26),
        padding: `${L.s(28)}px ${L.s(36)}px`,
        textAlign: "center",
        fontSize: L.s(44),
        fontWeight: 600,
        color: t.colors.ink,
        opacity: p(frame, 82, 18),
        transform: `translateY(${(1 - p(frame, 82, 18)) * L.s(14)}px)`,
        ...style,
      }}
    >
      {caption}
    </div>
  );

  if (L.portrait) {
    // 竖屏：原稿结构（标题区 / 图片 / 要点 + 解说条），仅数值画幅化。
    return (
      <WindowShell
        padding={`${L.s(60)}px ${L.s(64)}px ${L.s(76)}px`}
      >
        <div
          style={{
            width: "100%",
            opacity: headerProgress,
            transform: `translateY(${(1 - headerProgress) * L.s(20)}px)`,
          }}
        >
          {headerRow}
          {titleBlock}
        </div>
        {imageBlock({ height: L.s(600), marginTop: L.s(34) })}
        <div
          style={{
            marginTop: L.s(36),
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: L.s(20),
          }}
        >
          {pointRows}
          {captionBlock({ marginTop: L.s(22) })}
        </div>
      </WindowShell>
    );
  }

  // 横屏：图文并排——标题区/要点在左，图片在右占满剩余高度，解说条全宽收底。
  return (
    <WindowShell padding={`${L.s(60)}px ${L.s(64)}px ${L.s(76)}px`}>
      <div
        style={{
          width: "100%",
          height: bodyAvail,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flexShrink: 0 }}>{headerRow}</div>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            gap: L.s(24),
            marginTop: L.s(8),
          }}
        >
          <div
            style={{
              flex: "1 1 0",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {titleBlock}
            <div
              style={{
                marginTop: L.s(24),
                display: "flex",
                flexDirection: "column",
                gap: L.s(20),
              }}
            >
              {pointRows}
            </div>
          </div>
          <div
            style={{
              flex: "0 0 42%",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: L.s(16),
            }}
          >
            {imageBlock({ flex: 1, minHeight: 0 }, false)}
            {tagRow}
          </div>
        </div>
        {captionBlock({ marginTop: L.s(24), flexShrink: 0 })}
      </div>
    </WindowShell>
  );
};
