/**
 * demo：成片装配层只读 demo.config.json；cardId 经 ResolveCard 挂到 core 组件。
 */
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Subtitle } from "../components/Subtitle";
import { useTheme } from "../style/ThemeContext";
import {
  demoConfig,
  DEMO_TOTAL_FRAMES,
  type EpisodeCardRef,
  type EpisodeConfig,
  type EpisodeCue,
} from "./loadConfig";
import { ResolveCard } from "./ResolveCard";

export { DEMO_TOTAL_FRAMES };

function activeCue(cues: EpisodeCue[], frame: number): EpisodeCue | undefined {
  return cues.find(
    (c) => frame >= c.from && frame < c.from + c.duration && String(c.text || "").trim(),
  );
}

export const EpisodeDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const config: EpisodeConfig = demoConfig;
  const cue = activeCue(config.cues || [], frame);
  const cards = (config.cards || []) as EpisodeCardRef[];

  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.stageBg, fontFamily: theme.fonts.body }}>
      <Backdrop />
      {cards.map((card) => {
        const from = Number(card.from) || 0;
        const dur = Math.max(1, Number(card.duration) || 30);
        return (
          <Sequence key={card.id} from={from} durationInFrames={dur} name={card.cardId}>
            <ResolveCard
              cardId={card.cardId}
              params={card.params}
              intent={card.intent}
              durationInFrames={dur}
              cues={(config.cues || []).map((c) => ({
                text: c.text,
                from: Math.max(0, (Number(c.from) || 0) - from),
                duration: Number(c.duration) || 30,
              }))}
            />
          </Sequence>
        );
      })}
      <Subtitle
        cues={(config.cues || []).map((c) => ({
          text: c.text,
          from: Number(c.from) || 0,
          duration: Number(c.duration) || 30,
        }))}
      />
      {cue ? (
        <div
          style={{
            position: "absolute",
            right: 28,
            top: 24,
            padding: "6px 12px",
            borderRadius: 8,
            background: "rgba(0,0,0,0.35)",
            color: "#fff",
            fontSize: 14,
            opacity: 0.55,
            pointerEvents: "none",
          }}
        >
          {config.meta.episode} · f{frame}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
