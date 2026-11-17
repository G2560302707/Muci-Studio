import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { useMiSansFonts } from "../lib/fonts";
import { useTheme } from "../style/ThemeContext";
import { getFrameLayout } from "../style/layout";
import { shellOuterPad, shellWindowMaxWidth } from "../style/shell";

type WindowShellProps = {
  children: React.ReactNode;
  maxWidth?: number;
  padding?: string;
  bodyStyle?: React.CSSProperties;
  style?: React.CSSProperties;
};

export const WindowShell: React.FC<WindowShellProps> = ({
  children,
  maxWidth,
  padding,
  bodyStyle,
  style,
}) => {
  useMiSansFonts();
  const t = useTheme();
  const { width, height } = useVideoConfig();
  // 挂在 WindowShell 上的组件按 1080×1920 设计（两代基准见 layout.ts 头注释）。
  const L = getFrameLayout(width, height, { portraitHeight: 1920 });
  const resolvedMaxWidth =
    maxWidth !== undefined ? L.s(maxWidth) : shellWindowMaxWidth(width, L);
  const resolvedPadding = padding ?? `${L.s(64)}px ${L.s(72)}px ${L.s(84)}px`;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: t.colors.stageBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: shellOuterPad(L),
        fontFamily: t.fonts.body,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: resolvedMaxWidth,
          backgroundColor: t.colors.paper,
          borderRadius: L.s(36),
          border: `2px solid ${t.colors.line}`,
          overflow: "hidden",
          boxShadow: t.shadow.card,
          color: t.colors.ink,
          ...style,
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
          <div
            style={{
              width: L.s(18),
              height: L.s(18),
              borderRadius: L.s(9),
              backgroundColor: t.colors.dot1,
            }}
          />
          <div
            style={{
              width: L.s(18),
              height: L.s(18),
              borderRadius: L.s(9),
              backgroundColor: t.colors.dot2,
            }}
          />
          <div
            style={{
              width: L.s(18),
              height: L.s(18),
              borderRadius: L.s(9),
              backgroundColor: t.colors.dot3,
            }}
          />
        </div>

        <div
          style={{
            padding: resolvedPadding,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            ...bodyStyle,
          }}
        >
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};
