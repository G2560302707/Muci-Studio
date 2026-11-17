const INTENT_COLORS = {
  开场: '#ff8a3d',
  列表: '#5b8def',
  强调: '#a78bfa',
  收尾: '#34d399',
  对比: '#f472b6',
  计数: '#38bdf8',
  字幕: '#fbbf24',
  数据: '#2dd4bf',
  转场: '#94a3b8',
  素材: '#fb7185',
  通用: '#a3a3a3',
};

const INTENT_LABELS = {
  开场: '开场钩子',
  列表: '要点列表',
  强调: '强调金句',
  收尾: '收尾提醒',
  对比: '对比说明',
  计数: '数字计数',
  字幕: '字幕花字',
  数据: '数据展示',
  转场: '转场',
  素材: '素材呈现',
  通用: '画面卡',
};

const PLACEHOLDERS = ['占位', 'TODO', 'TBD', '测试文案', 'lorem', 'asdf'];

export function intentColor(intent) {
  return INTENT_COLORS[intent] || INTENT_COLORS['通用'];
}

export function friendlyCardName(card, index) {
  if (card?.params?.title) return String(card.params.title);
  if (card?.intent && INTENT_LABELS[card.intent]) return INTENT_LABELS[card.intent];
  if (card?.intent) return String(card.intent);
  return `第 ${index + 1} 张卡`;
}

export function fpsOf(config) {
  const fps = Number(config?.meta?.fps);
  return fps > 0 ? fps : 30;
}

export function totalFramesOf(config) {
  if (!config) return 180;
  const fromScenes = (config.scenes || []).reduce(
    (sum, s) => sum + (Number(s.durationInFrames) || 0),
    0,
  );
  const fromCues = (config.cues || []).reduce(
    (max, c) => Math.max(max, (Number(c.from) || 0) + (Number(c.duration) || 0)),
    0,
  );
  const fromCards = (config.cards || []).reduce(
    (max, c) => Math.max(max, (Number(c.from) || 0) + (Number(c.duration) || 0)),
    0,
  );
  return Math.max(30, fromScenes || fromCues || fromCards || 180);
}

export function totalSecondsOf(config) {
  return totalFramesOf(config) / fpsOf(config);
}

export function formatTime(sec) {
  const s = Math.max(0, Number(sec) || 0);
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${m}:${r.toFixed(1).padStart(4, '0')}`;
}

export function frameToSec(frame, fps) {
  return (Number(frame) || 0) / (fps || 30);
}

export function secToFrame(sec, fps) {
  return Math.max(0, Math.round((Number(sec) || 0) * (fps || 30)));
}

export function activeAt(config, frame) {
  const cards = config?.cards || [];
  const cues = config?.cues || [];
  const card = cards.find((c) => {
    const from = Number(c.from) || 0;
    const dur = Number(c.duration) || 0;
    return dur > 0 && frame >= from && frame < from + dur;
  });
  const cue = cues.find((c) => {
    const from = Number(c.from) || 0;
    const dur = Number(c.duration) || 0;
    return dur > 0 && frame >= from && frame < from + dur && String(c.text || '').trim();
  });
  return { card, cue };
}

export function densityLabel(config) {
  const totalSec = totalSecondsOf(config);
  const n = (config?.cards || []).length;
  if (!n || totalSec <= 0) return { text: '—', tip: '还没有卡片' };
  const perMin = (n / totalSec) * 60;
  if (perMin < 8) return { text: '偏疏', tip: `约 ${perMin.toFixed(1)} 张/分钟` };
  if (perMin > 16) return { text: '偏密', tip: `约 ${perMin.toFixed(1)} 张/分钟` };
  return { text: '刚好', tip: `约 ${perMin.toFixed(1)} 张/分钟` };
}

export function lintConfigFriendly(config) {
  const issues = [];
  if (!config) return issues;
  const fps = fpsOf(config);
  const durationFrames = totalFramesOf(config);

  (config.cues || []).forEach((cue, i) => {
    const text = String(cue.text || '');
    for (const pat of PLACEHOLDERS) {
      if (text.includes(pat)) {
        issues.push({
          severity: 'error',
          message: `第 ${i + 1} 句字幕里有「${pat}」，看起来像还没写完`,
        });
      }
    }
    if ((Number(cue.duration) || 0) < 12) {
      issues.push({
        severity: 'warn',
        message: `第 ${i + 1} 句字幕太短，观众可能看不清`,
      });
    }
    const end = (Number(cue.from) || 0) + (Number(cue.duration) || 0);
    if (end > durationFrames + 1) {
      issues.push({
        severity: 'error',
        message: `第 ${i + 1} 句字幕超出片子结尾了`,
      });
    }
  });

  (config.scenes || []).forEach((scene, i) => {
    if ((Number(scene.durationInFrames) || 0) < 15) {
      issues.push({
        severity: 'warn',
        message: `镜头 ${scene.id || i + 1} 太短（不到半秒）`,
      });
    }
  });

  (config.cards || []).forEach((card, i) => {
    const from = Number(card.from) || 0;
    const dur = Number(card.duration) || 0;
    if (dur <= 0) {
      issues.push({
        severity: 'error',
        message: `第 ${i + 1} 张卡没有有效时长`,
      });
    }
    if (from + dur > durationFrames + 1) {
      issues.push({
        severity: 'error',
        message: `「${friendlyCardName(card, i)}」超出片子结尾`,
      });
    }
  });

  const bgm = Number(config.audio?.bgmGain);
  if (Number.isFinite(bgm) && bgm > 1) {
    issues.push({
      severity: 'error',
      message: '背景音乐太大，容易盖过人声',
    });
  }

  // 时间倒挂：后卡起点早于前卡
  const sorted = [...(config.cards || [])].sort(
    (a, b) => (Number(a.from) || 0) - (Number(b.from) || 0),
  );
  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = (Number(sorted[i - 1].from) || 0) + (Number(sorted[i - 1].duration) || 0);
    const curFrom = Number(sorted[i].from) || 0;
    if (curFrom + 1 < (Number(sorted[i - 1].from) || 0)) {
      issues.push({
        severity: 'warn',
        message: '有的卡片时间顺序看起来乱了，建议检查「什么时候出现」',
      });
      break;
    }
    void prevEnd;
    void fps;
  }

  return issues;
}

export async function api(path, options) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}
