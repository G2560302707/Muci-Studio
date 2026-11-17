// 主题上下文：组件内 const t = useTheme() 取色，不再写颜色字面量（Phase 4 约定）。
// 缺省值 whiteWindow——所有既有调用点（Episode.tsx / 13 个 Preview）零改动即维持现状。
// Root.tsx 用 <ThemeProvider value={themes.blackGold}> 包一层即得黑金版本。
import { createContext, useContext } from "react";
import { themes, type Theme, type ThemeName } from "./themes";

const ThemeContext = createContext<Theme>(themes.whiteWindow);

export const ThemeProvider = ThemeContext.Provider;

export const useTheme = () => useContext(ThemeContext);

export const getTheme = (name: ThemeName): Theme => themes[name];
