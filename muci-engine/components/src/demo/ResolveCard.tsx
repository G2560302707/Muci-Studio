/**
 * cardId → core 组件装配。编排 params 宽松适配；缺字段时降级为可读白窗卡。
 */
import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { BulletList } from "../components/BulletList";
import { ChapterCard } from "../components/ChapterCard";
import { ChapterRail } from "../components/ChapterRail";
import { EvidenceStat } from "../components/EvidenceStat";
import { FlashIntro, type FlashItem } from "../components/FlashIntro";
import { FocusHost } from "../components/FocusHost";
import { LightStage } from "../components/LightStage";
import { MaskText } from "../components/MaskText";
import { NumberRoll } from "../components/NumberRoll";
import { OutroCard } from "../components/OutroCard";
import { PillTags } from "../components/PillTags";
import { RankingIntro } from "../components/RankingIntro";
import { ScreenCard } from "../components/ScreenCard";
import { Subtitle, type SubtitleCue } from "../components/Subtitle";
import { WindowShell } from "../components/WindowShell";
import { useTheme } from "../style/ThemeContext";
import { getFrameLayout } from "../style/layout";

export type ResolveCardProps = {
  cardId: string;
  params?: Record<string, unknown>;
  intent?: string;
  durationInFrames?: number;
  cues?: SubtitleCue[];
};

function str(v: unknown, fallback = ""): string {
  return v == null ? fallback : String(v);
}

function strList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
  if (typeof v === "string" && v.trim()) return [v];
  return [];
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const FallbackCard: React.FC<{
  cardId: string;
  title: string;
  caption: string;
  items: string[];
}> = ({ cardId, title, caption, items }) => {
  const t = useTheme();
  const { width, height } = useVideoConfig();
  const L = getFrameLayout(width, height);
  return (
    <AbsoluteFill style={{ backgroundColor: t.colors.stageBg }}>
      <Backdrop />
      <WindowShell padding={`${L.s(64)}px`}>
        <div style={{ fontSize: L.s(18), opacity: 0.45, marginBottom: L.s(12) }}>
          {cardId}
        </div>
        <div
          style={{
            fontSize: L.s(44),
            fontWeight: 700,
            color: t.colors.ink,
            marginBottom: L.s(16),
          }}
        >
          {title || "幕次卡片"}
        </div>
        {caption ? (
          <div style={{ fontSize: L.s(28), color: t.colors.inkMute, marginBottom: L.s(20) }}>
            {caption}
          </div>
        ) : null}
        {items.map((item) => (
          <div key={item} style={{ fontSize: L.s(26), marginBottom: L.s(10), color: t.colors.ink }}>
            · {item}
          </div>
        ))}
      </WindowShell>
    </AbsoluteFill>
  );
};

export const ResolveCard: React.FC<ResolveCardProps> = ({
  cardId,
  params = {},
  cues = [],
}) => {
  const title = str(params.title || params.text || params.headline);
  const caption = str(params.caption || params.subtitle || params.label);
  const items = strList(params.items || params.points || params.tags || params.chapters);
  const id = String(cardId || "").trim();

  if (id === "core:Backdrop") {
    return (
      <AbsoluteFill>
        <Backdrop />
      </AbsoluteFill>
    );
  }

  if (id === "core:BulletList") {
    return (
      <AbsoluteFill>
        <Backdrop />
        <BulletList items={items.length ? items : [caption || title || "要点"]} title={title} />
      </AbsoluteFill>
    );
  }

  if (id === "core:ChapterCard") {
    return (
      <AbsoluteFill>
        <Backdrop />
        <ChapterCard
          index={num(params.index, 1)}
          total={num(params.total, 3)}
          title={title || "章节"}
        />
      </AbsoluteFill>
    );
  }

  if (id === "core:ChapterRail") {
    return (
      <ChapterRail
        chapters={items.length ? items : ["开场", "展开", "收尾"]}
        activeIndex={num(params.activeIndex, 0)}
        caption={caption}
      />
    );
  }

  if (id === "core:EvidenceStat") {
    return (
      <AbsoluteFill>
        <Backdrop />
        <EvidenceStat
          value={num(params.value || params.number, 0)}
          label={str(params.label, title || "证据")}
          caption={caption}
          unit={str(params.unit)}
        />
      </AbsoluteFill>
    );
  }

  if (id === "core:FlashIntro") {
    const flashItems: FlashItem[] = Array.isArray(params.items)
      ? (params.items as FlashItem[])
      : [
          {
            image: str(params.image, ""),
            title: title || "项目",
            rank: num(params.rank, 1),
            stars: num(params.stars, 0),
          },
        ];
    return (
      <AbsoluteFill>
        <Backdrop />
        <FlashIntro items={flashItems} />
      </AbsoluteFill>
    );
  }

  if (id === "core:FocusHost") {
    return (
      <FocusHost
        title={title}
        items={items.length ? items : [caption || "要点"]}
        mediaSrc={str(params.mediaSrc || params.src)}
      />
    );
  }

  if (id === "core:LightStage") {
    return (
      <LightStage>
        <WindowShell>
          <div style={{ fontSize: 42, fontWeight: 700 }}>{title || caption || "舞台"}</div>
        </WindowShell>
      </LightStage>
    );
  }

  if (id === "core:MaskText") {
    return (
      <AbsoluteFill>
        <Backdrop />
        <MaskText text={title || caption || "重点"} />
      </AbsoluteFill>
    );
  }

  if (id === "core:NumberRoll") {
    return (
      <AbsoluteFill>
        <Backdrop />
        <NumberRoll
          value={num(params.value || params.number, 0)}
          label={str(params.label, title)}
          caption={caption}
        />
      </AbsoluteFill>
    );
  }

  if (id === "core:OutroCard") {
    return (
      <AbsoluteFill>
        <Backdrop />
        <OutroCard
          title={title || "本期回顾"}
          items={[]}
          question={caption || str(params.question, "下期想看什么？")}
          button={str(params.button, "关注")}
        />
      </AbsoluteFill>
    );
  }

  if (id === "core:PillTags") {
    return (
      <AbsoluteFill>
        <Backdrop />
        <PillTags items={items.length ? items : [title || "标签"]} />
      </AbsoluteFill>
    );
  }

  if (id === "core:RankingIntro") {
    return (
      <AbsoluteFill>
        <Backdrop />
        <RankingIntro title={title || "榜单"} items={[]} />
      </AbsoluteFill>
    );
  }

  if (id === "core:ScreenCard") {
    return (
      <AbsoluteFill>
        <Backdrop />
        <ScreenCard src={str(params.src || params.image)} title={title} speedBadge={str(params.speedBadge)} />
      </AbsoluteFill>
    );
  }

  if (id === "core:Subtitle") {
    return (
      <AbsoluteFill>
        <Backdrop />
        <Subtitle cues={cues.length ? cues : [{ text: caption || title, from: 0, duration: 90 }]} />
      </AbsoluteFill>
    );
  }

  // 非 core / 未接线的 autoPick：白窗参数壳，避免编排断片
  return <FallbackCard cardId={id || "unknown"} title={title} caption={caption} items={items} />;
};
