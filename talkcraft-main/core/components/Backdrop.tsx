import React from "react";
import { AbsoluteFill } from "remotion";
import { useTheme } from "../style/ThemeContext";

export const Backdrop: React.FC = () => {
  const t = useTheme();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: t.colors.stageBg,
        backgroundImage: `radial-gradient(circle at 18% 22%, ${t.colors.glowA} 0%, rgba(255,255,255,0) 42%), radial-gradient(circle at 82% 78%, ${t.colors.glowB} 0%, rgba(255,255,255,0) 38%)`,
      }}
    />
  );
};
