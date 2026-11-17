import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { useTheme } from "../style/ThemeContext";
import { getFrameLayout } from "../style/layout";

type LightStageProps = {
  children?: React.ReactNode;
  padding?: React.CSSProperties["padding"];
};

export const LightStage: React.FC<LightStageProps> = ({
  children,
  padding,
}) => {
  const { width, height } = useVideoConfig();
  // 与 WindowShell 同代：按 1080×1920 设计。
  const L = getFrameLayout(width, height, { portraitHeight: 1920 });
  const t = useTheme();
  const resolvedPadding = padding ?? `${L.s(96)}px ${L.s(80)}px`;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: t.colors.stageBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: resolvedPadding,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
