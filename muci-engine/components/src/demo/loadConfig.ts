import raw from "./demo.config.json";

export type EpisodeTheme = "whiteWindow" | "blackGold";

export type EpisodeCue = {
  id?: string;
  sceneId?: string;
  text: string;
  from: number;
  duration: number;
};

export type EpisodeScene = {
  id: string;
  durationInFrames: number;
  label?: string;
};

export type EpisodeCardRef = {
  id: string;
  sceneId: string;
  cardId: string;
  intent?: string;
  params?: Record<string, unknown>;
  from?: number;
  duration?: number;
  confidence?: number;
  reason?: string;
};

export type EpisodeConfig = {
  schemaVersion: number;
  meta: {
    episode: string;
    slug?: string;
    width: number;
    height: number;
    fps: number;
    theme: EpisodeTheme | string;
    compositionId?: string;
  };
  scenes: EpisodeScene[];
  cues: EpisodeCue[];
  copy?: {
    title?: string;
    subtitle?: string;
    cards?: unknown;
    [key: string]: unknown;
  };
  media?: unknown[];
  audio?: {
    voiceGain?: number;
    sfxGain?: number;
    bgmGain?: number;
    sfxEnabled?: boolean;
  };
  cards?: EpisodeCardRef[];
};

export const demoConfig = raw as EpisodeConfig;

export function totalFramesFromConfig(config: EpisodeConfig): number {
  const fromScenes = (config.scenes || []).reduce(
    (sum, s) => sum + (Number(s.durationInFrames) || 0),
    0,
  );
  const fromCues = (config.cues || []).reduce(
    (max, c) => Math.max(max, (Number(c.from) || 0) + (Number(c.duration) || 0)),
    0,
  );
  return Math.max(30, fromScenes || fromCues || 180);
}

export const DEMO_TOTAL_FRAMES = totalFramesFromConfig(demoConfig);
