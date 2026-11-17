export const STUDIO_THEMES = {
  whiteWindow: {
    name: 'whiteWindow',
    label: '白窗紫',
    stageBg: '#ffffff',
    paper: '#f5f5f7',
    ink: '#111114',
    accent: '#7C3AED',
    onAccent: '#FFFFFF',
    subBubble: 'rgba(17,17,20,0.84)',
    subText: '#ffffff',
  },
  blackGold: {
    name: 'blackGold',
    label: '黑金',
    stageBg: '#000000',
    paper: '#1a1a20',
    ink: '#ffffff',
    accent: '#fbbf24',
    onAccent: '#0b0b0f',
    subBubble: 'rgba(0,0,0,0.72)',
    subText: '#ffffff',
  },
};

export function resolveStudioTheme(name) {
  return name === 'blackGold' ? STUDIO_THEMES.blackGold : STUDIO_THEMES.whiteWindow;
}
