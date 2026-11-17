// Kinetic Distill 设计令牌 → antd 主题映射
// 产品壳身份:冷夜蓝黑 + Volt 柠绿;舞台内容主题(白窗紫/黑金)独立,不写在这里
import { theme as antdTheme } from 'antd';

export const KINETIC = {
  accent: '#B8F23A',
  onAccent: '#0A0F08',
  accentCyan: '#3EC7FF',
  textPrimary: '#E8EEF5',
  textSecondary: 'rgba(232, 238, 245, 0.58)',
  textFaint: 'rgba(232, 238, 245, 0.38)',
  info: '#3EC7FF',
  success: '#3DDC97',
  warning: '#F5C542',
  error: '#E88686',
  hairline: '#1E2833',
  hairlineStrong: '#2C3A4A',
  radiusInner: 2,
  radiusElement: 4,
  radiusContainer: 6,
  pageBg: '#070A0F',
  panelBg: '#0C1118',
  elevBg: '#141B24',
  canvasBg: '#05070B',
  fillSubtle: 'rgba(232, 238, 245, 0.05)',
  fillHover: 'rgba(232, 238, 245, 0.09)',
  accentSoft: 'rgba(184, 242, 58, 0.14)',
  fontSans: "'Noto Sans SC', 'Space Grotesk', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
  fontDisplay: "'Space Grotesk', 'Noto Sans SC', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
  light: {
    textPrimary: '#12161C',
    textSecondary: 'rgba(18, 22, 28, 0.62)',
    hairline: '#D5DCE6',
    hairlineStrong: '#B8C2D0',
    pageBg: '#F3F6FA',
    panelBg: '#FFFFFF',
    elevBg: '#E8EEF5',
    canvasBg: '#FFFFFF',
    fillSubtle: 'rgba(18, 22, 28, 0.04)',
    fillHover: 'rgba(18, 22, 28, 0.07)',
    accent: '#7AAD12',
    onAccent: '#0A0F08',
    accentSoft: 'rgba(122, 173, 18, 0.12)',
  },
};

export const kineticDarkTheme = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    colorPrimary: KINETIC.accent,
    colorInfo: KINETIC.info,
    colorSuccess: KINETIC.success,
    colorWarning: KINETIC.warning,
    colorError: KINETIC.error,
    colorText: KINETIC.textPrimary,
    colorTextSecondary: 'rgba(232, 238, 245, 0.62)',
    colorBorder: KINETIC.hairline,
    colorBorderSecondary: KINETIC.hairlineStrong,
    borderRadius: KINETIC.radiusElement,
    borderRadiusLG: KINETIC.radiusContainer,
    colorBgLayout: KINETIC.pageBg,
    colorBgContainer: KINETIC.elevBg,
    colorBgElevated: '#1A2330',
    fontFamily: KINETIC.fontSans,
    fontSize: 14,
  },
  components: {
    Layout: {
      headerBg: KINETIC.panelBg,
      bodyBg: KINETIC.pageBg,
      siderBg: KINETIC.panelBg,
    },
    Menu: { itemBg: 'transparent' },
    Table: { headerBg: KINETIC.elevBg },
    Button: { primaryColor: KINETIC.onAccent },
  },
};

export const kineticLightTheme = {
  token: {
    colorPrimary: KINETIC.light.accent,
    colorInfo: '#1A9FD6',
    colorSuccess: '#1FAE6C',
    colorWarning: '#C99712',
    colorError: '#C44B4B',
    colorText: KINETIC.light.textPrimary,
    colorTextSecondary: 'rgba(18, 22, 28, 0.62)',
    colorBorder: KINETIC.light.hairline,
    colorBorderSecondary: KINETIC.light.hairlineStrong,
    borderRadius: KINETIC.radiusElement,
    borderRadiusLG: KINETIC.radiusContainer,
    colorBgLayout: KINETIC.light.pageBg,
    colorBgContainer: KINETIC.light.canvasBg,
    colorBgElevated: KINETIC.light.panelBg,
    fontFamily: KINETIC.fontSans,
    fontSize: 14,
  },
  components: {
    Layout: {
      headerBg: KINETIC.light.panelBg,
      bodyBg: KINETIC.light.pageBg,
      siderBg: KINETIC.light.panelBg,
    },
    Menu: { itemBg: 'transparent' },
    Table: { headerBg: '#EEF2F7' },
    Button: { primaryColor: KINETIC.light.onAccent },
  },
};

export function themeByMode(mode) {
  return mode === 'light' ? kineticLightTheme : kineticDarkTheme;
}
