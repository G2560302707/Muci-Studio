import React from "react";
import { Composition, registerRoot } from "remotion";
import { EpisodeLab, type EpisodeLabProps, type LabCue } from "./EpisodeLab";

const FALLBACK: EpisodeLabProps = {
  meta: {
    episode: "demo",
    theme: "whiteWindow",
    fps: 30,
  },
  cues: [
    { id: "c1", text: "改这段字幕，保存后再点预览", from: 0, duration: 90 },
    { id: "c2", text: "主题色走 meta.theme：白窗紫 / 黑金", from: 90, duration: 90 },
  ],
  copy: {
    title: "幕次 Studio 预览",
    subtitle: "改字幕 / 主题 / 时长 / 音量",
  },
  audio: { bgmGain: 0.45 },
  scenes: [
    { id: "S1", durationInFrames: 90 },
    { id: "S2", durationInFrames: 90 },
  ],
  cards: [],
};

function totalFramesFromProps(props: EpisodeLabProps): number {
  const fromScenes = (props.scenes || []).reduce(
    (sum, s) => sum + (Number(s.durationInFrames) || 0),
    0,
  );
  const cues = props.cues || [];
  const fromCues = cues.reduce((max, c: LabCue) => Math.max(max, c.from + c.duration), 0);
  return Math.max(30, fromScenes || fromCues || 180);
}

const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="EpisodeLab"
        component={EpisodeLab}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={FALLBACK}
        calculateMetadata={async ({ props }) => {
          const fps = Number(props.meta?.fps) > 0 ? Number(props.meta?.fps) : 30;
          return {
            durationInFrames: totalFramesFromProps(props),
            fps,
            width: 1920,
            height: 1080,
            props,
          };
        }}
      />
    </>
  );
};

registerRoot(Root);
