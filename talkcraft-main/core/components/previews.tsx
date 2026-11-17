import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { getFrameLayout } from "../style/layout";
import { useTheme } from "../style/ThemeContext";
import { Backdrop } from "./Backdrop";
import { BulletList } from "./BulletList";
import { ChapterCard } from "./ChapterCard";
import { FlashIntro } from "./FlashIntro";
import { LightStage } from "./LightStage";
import { MaskText } from "./MaskText";
import { NumberRoll } from "./NumberRoll";
import { OutroCard } from "./OutroCard";
import { PillTags } from "./PillTags";
import { ProjectCard } from "./ProjectCard";
import { RankingIntro } from "./RankingIntro";
import { ScreenCard } from "./ScreenCard";
import { Subtitle } from "./Subtitle";
import { WindowShell } from "./WindowShell";

const rankingItems = [
  { title: "agent-browser", org: "vercel-labs", weeklyStars: 3606 },
  { title: "Zed", org: "zed-industries", weeklyStars: 2262 },
  { title: "Herdr", org: "herdrdev", weeklyStars: 2196 },
  { title: "Google Skills", org: "google", weeklyStars: 2024 },
  { title: "MuJoCo", org: "google-deepmind", weeklyStars: 1130 },
];

const flashItems = [...rankingItems]
  .reverse()
  .map((item, index) => ({
    image: staticFile(
      `media/ep03/${
        [
          "05-mujoco",
          "04-google-skills",
          "03-herdr",
          "02-zed",
          "01-agent-browser",
        ][index]
      }.png`,
    ),
    title: item.title,
    rank: 5 - index,
    stars: item.weeklyStars,
  }));

// 预览包裹层：竖屏沿用字面量 80（保持已入档预览不变）；横屏归零，让窗体用满高度。
const usePreviewPad = () => {
  const { width, height } = useVideoConfig();
  return getFrameLayout(width, height).portrait ? 80 : 0;
};

const Centered: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pad = usePreviewPad();
  const t = useTheme();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: t.colors.stageBg,
        justifyContent: "center",
        alignItems: "center",
        padding: pad,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const ChapterCardPreview: React.FC = () => (
  <ChapterCard index={3} total={8} title="让 AI 帮你写周报" />
);

export const PillTagsPreview: React.FC = () => (
  <PillTags
    items={["自动截图", "点击填写", "网页快照", "Rust CLI"]}
    cues={[0, 8, 16, 24]}
  />
);

export const ScreenCardPreview: React.FC = () => (
  <ScreenCard
    src={staticFile("media/ep03/01-agent-browser.png")}
    title="真实 OG 卡 · 聚焦推拉"
    speedBadge="×2"
  />
);

export const FlashIntroPreview: React.FC = () => (
  <FlashIntro items={flashItems} framesPerCard={15} />
);

export const RankingIntroPreview: React.FC = () => (
  <RankingIntro title="本周 GitHub Top 5" items={rankingItems} />
);

export const ProjectCardPreview: React.FC = () => (
  <ProjectCard
    rank={1}
    title="agent-browser"
    org="vercel-labs"
    image={staticFile("media/ep03/01-agent-browser.png")}
    githubUrl="github.com/vercel-labs/agent-browser"
    points={["网页快照引用", "点击 / 填写 / 截图", "Rust CLI"]}
    stars={49900}
    weeklyStars={3606}
    overlayTags={["browser use", "CDP", "screenshots"]}
    caption="让 AI 帮你操控浏览器"
  />
);

export const OutroCardPreview: React.FC = () => (
  <OutroCard
    title="本周 GitHub Top 5"
    items={rankingItems}
    question="你最想试哪一个？"
    button="评论区告诉我"
  />
);

export const BulletListPreview: React.FC = () => {
  const pad = usePreviewPad();
  const t = useTheme();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: t.colors.stageBg,
        justifyContent: "center",
        alignItems: "center",
        padding: pad,
      }}
    >
    <BulletList
      title="制作规则"
      items={["浏览器自动化操作", "AI Agent 直接控制网页", "Vercel 官方出品"]}
      highlightIndex={1}
    />
  </AbsoluteFill>
  );
};

export const SubtitlePreview: React.FC = () => {
  const t = useTheme();
  return (
  <AbsoluteFill style={{ backgroundColor: t.colors.stageBg }}>
    <Backdrop />
    <Centered>
      <div style={{ color: "rgba(255,255,255,0.18)", fontSize: 72, fontWeight: 800 }}>
        （上层画面占位）
      </div>
    </Centered>
    <Subtitle
      cues={[
        { text: "这周涨星最快的是 agent-browser", from: 20, duration: 50 },
      ]}
    />
  </AbsoluteFill>
  );
};

export const MaskTextPreview: React.FC = () => (
  <Centered>
    <MaskText
      text="一周涨星 3606，速度惊人"
      style={{ fontSize: 72 }}
    />
  </Centered>
);

export const NumberRollPreview: React.FC = () => {
  const pad = usePreviewPad();
  const t = useTheme();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: t.colors.stageBg,
        justifyContent: "center",
        alignItems: "center",
        padding: pad,
      }}
    >
      <NumberRoll
        value={3606}
        duration={40}
        format={(value) => `+${value.toLocaleString()}`}
        label="本周涨星"
        caption="agent-browser"
      />
    </AbsoluteFill>
  );
};

export const BackdropPreview: React.FC = () => <Backdrop />;

export const LightStagePreview: React.FC = () => (
  <LightStage>
    <WindowShell>
      <div
        style={{
          color: "#111114",
          fontSize: 72,
          fontWeight: 600,
          lineHeight: 1.2,
          textAlign: "center",
        }}
      >
        白色舞台承载窗口
      </div>
    </WindowShell>
  </LightStage>
);

export const previewScenes: Array<{
  name: string;
  durationInFrames: number;
  component: React.FC;
}> = [
  { name: "ChapterCard", durationInFrames: 40, component: ChapterCardPreview },
  { name: "PillTags", durationInFrames: 90, component: PillTagsPreview },
  { name: "ScreenCard", durationInFrames: 60, component: ScreenCardPreview },
  { name: "FlashIntro", durationInFrames: 75, component: FlashIntroPreview },
  { name: "RankingIntro", durationInFrames: 110, component: RankingIntroPreview },
  { name: "ProjectCard", durationInFrames: 120, component: ProjectCardPreview },
  { name: "OutroCard", durationInFrames: 110, component: OutroCardPreview },
  { name: "BulletList", durationInFrames: 130, component: BulletListPreview },
  { name: "Subtitle", durationInFrames: 80, component: SubtitlePreview },
  { name: "MaskText", durationInFrames: 40, component: MaskTextPreview },
  { name: "NumberRoll", durationInFrames: 50, component: NumberRollPreview },
  { name: "Backdrop", durationInFrames: 30, component: BackdropPreview },
  { name: "LightStage", durationInFrames: 40, component: LightStagePreview },
];

export const previewShowcaseDurationInFrames = previewScenes.reduce(
  (total, scene) => total + scene.durationInFrames,
  0,
);

const PreviewLabel: React.FC<{ children: string }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      top: 48,
      left: 48,
      zIndex: 100,
      backgroundColor: "rgba(0,0,0,0.55)",
      border: "1px solid rgba(255,255,255,0.18)",
      borderRadius: 999,
      color: "white",
      padding: "12px 24px",
      fontSize: 30,
      fontWeight: 700,
      backdropFilter: "blur(8px)",
    }}
  >
    {children}
  </div>
);

export const PreviewShowcase: React.FC = () => {
  let cursor = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
      {previewScenes.map(({ name, durationInFrames, component: Scene }) => {
        const from = cursor;
        cursor += durationInFrames;

        return (
          <Sequence
            key={name}
            from={from}
            durationInFrames={durationInFrames}
            name={name}
          >
            <PreviewLabel>{name}</PreviewLabel>
            <Scene />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
