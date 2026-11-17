import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { resolveLabTheme, type ThemeName } from "./themes-lite";

export type LabCue = {
  id?: string;
  text: string;
  from: number;
  duration: number;
};

export type LabCard = {
  id?: string;
  cardId?: string;
  intent?: string;
  params?: {
    title?: string;
    subtitle?: string;
    caption?: string;
    text?: string;
    items?: unknown[];
  };
  from?: number;
  duration?: number;
  reason?: string;
};

export type EpisodeLabProps = {
  meta?: {
    episode?: string;
    theme?: ThemeName | string;
    fps?: number;
  };
  cues?: LabCue[];
  copy?: {
    title?: string;
    subtitle?: string;
  };
  audio?: {
    bgmGain?: number;
    voiceGain?: number;
    sfxGain?: number;
    sfxEnabled?: boolean;
  };
  scenes?: Array<{ id: string; durationInFrames: number; label?: string }>;
  cards?: LabCard[];
};

export const EpisodeLab: React.FC<EpisodeLabProps> = ({
  meta,
  cues = [],
  copy,
  audio,
  cards = [],
}) => {
  const frame = useCurrentFrame();
  const theme = resolveLabTheme(meta?.theme);
  const active = cues.find(
    (c) => frame >= c.from && frame < c.from + c.duration && c.text.trim(),
  );
  const card = cards.find((c) => {
    const from = Number(c.from) || 0;
    const dur = Number(c.duration) || 0;
    return dur > 0 && frame >= from && frame < from + dur;
  });
  const gain = Number.isFinite(audio?.bgmGain) ? Number(audio?.bgmGain) : 0.45;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.stageBg, fontFamily: "Microsoft YaHei, sans-serif" }}>
      <Audio src={staticFile("tone.mp3")} volume={gain} />

      <div
        style={{
          position: "absolute",
          top: 64,
          left: 80,
          right: 80,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 18, color: theme.ink, opacity: 0.55, letterSpacing: 1 }}>
            {meta?.episode || "demo"}
          </div>
          <div style={{ marginTop: 8, fontSize: 48, fontWeight: 700, color: theme.ink }}>
            {copy?.title || "幕次 Studio 预览"}
          </div>
          <div style={{ marginTop: 10, fontSize: 22, color: theme.ink, opacity: 0.7 }}>
            {copy?.subtitle || "改字幕 / 主题 / 时长 / 音量 → 预览 → 导出"}
          </div>
        </div>
        <div
          style={{
            padding: "10px 18px",
            borderRadius: 999,
            backgroundColor: theme.accent,
            color: theme.onAccent,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {theme.label}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 280,
          bottom: 200,
          borderRadius: 28,
          backgroundColor: theme.paper,
          border: `2px solid ${theme.accent}33`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 48,
          gap: 16,
        }}
      >
        <div style={{ fontSize: 16, color: theme.ink, opacity: 0.5 }}>
          {card?.cardId ? `${card.cardId}${card.intent ? ` · ${card.intent}` : ""}` : "（当前帧无编排卡）"}
        </div>
        <div style={{ fontSize: 36, color: theme.ink, textAlign: "center", lineHeight: 1.5, maxWidth: 1200 }}>
          {card?.params?.title || active?.text || "（当前帧无字幕）"}
        </div>
        {Array.isArray(card?.params?.items) ? (
          <ul style={{ margin: 0, paddingLeft: 28, fontSize: 24, color: theme.ink, lineHeight: 1.55 }}>
            {card.params.items.map((item, i) => (
              <li key={i}>{String(item)}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {active ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 72,
            transform: "translateX(-50%)",
            maxWidth: "78%",
            padding: "14px 28px",
            borderRadius: 18,
            backgroundColor: theme.subBubble,
            color: theme.subText,
            fontSize: 28,
            lineHeight: 1.4,
            textAlign: "center",
          }}
        >
          {active.text}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
