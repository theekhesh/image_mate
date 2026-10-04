/**
 * ImageMate Studio - Universal Theme Engine
 * Pre-configured with Tokyo Night, Dracula, Nord, Catppuccin, One Dark, Monokai, Cyberpunk, etc.
 * Supports live dynamic CSS variable injection and persistent user selection.
 */

import { Theme, ThemeColors } from '../types/theme';

export const BUILTIN_THEMES: Theme[] = [
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    description: 'A clean, dark theme celebrating the lights of Downtown Tokyo at night.',
    author: 'enkia',
    category: 'Modern Dark',
    colors: {
      bgApp: '#1a1b26',
      bgSurface: '#24283b',
      bgHeader: '#1f2335',
      bgToolbar: '#1a1b26',
      bgCanvas: '#16161e',
      bgTabActive: '#24283b',
      bgTabInactive: '#16161e',
      bgHover: '#292e42',
      bgActive: '#7aa2f7',
      border: '#2f3549',
      borderSubtle: '#24283b',
      textPrimary: '#c0caf5',
      textSecondary: '#a9b1d6',
      textMuted: '#565f89',
      accent: '#7aa2f7',
      accentHover: '#89b4fa',
      accentGradient: 'linear-gradient(135deg, #7aa2f7 0%, #bb9af7 100%)',
      selectionAnts: '#7dcfff',
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    description: 'The famous dark gothic theme crafted for vampires and screen ninjas.',
    author: 'Zeno Rocha',
    category: 'Gothic & Neon',
    colors: {
      bgApp: '#282a36',
      bgSurface: '#21222c',
      bgHeader: '#191a21',
      bgToolbar: '#282a36',
      bgCanvas: '#191a21',
      bgTabActive: '#44475a',
      bgTabInactive: '#21222c',
      bgHover: '#44475a',
      bgActive: '#bd93f9',
      border: '#6272a4',
      borderSubtle: '#44475a',
      textPrimary: '#f8f8f2',
      textSecondary: '#e2e2dc',
      textMuted: '#6272a4',
      accent: '#ff79c6',
      accentHover: '#ff92d0',
      accentGradient: 'linear-gradient(135deg, #ff79c6 0%, #bd93f9 100%)',
      selectionAnts: '#50fa7b',
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    description: 'An arctic, north-bluish clean and elegant minimalist color palette.',
    author: 'Arctic Ice Studio',
    category: 'Nature & Soft',
    colors: {
      bgApp: '#2e3440',
      bgSurface: '#3b4252',
      bgHeader: '#242933',
      bgToolbar: '#2e3440',
      bgCanvas: '#242933',
      bgTabActive: '#434c5e',
      bgTabInactive: '#2e3440',
      bgHover: '#4c566a',
      bgActive: '#88c0d0',
      border: '#434c5e',
      borderSubtle: '#3b4252',
      textPrimary: '#eceff4',
      textSecondary: '#e5e9f0',
      textMuted: '#7b88a1',
      accent: '#88c0d0',
      accentHover: '#81a1c1',
      accentGradient: 'linear-gradient(135deg, #88c0d0 0%, #81a1c1 100%)',
      selectionAnts: '#a3be8c',
    },
  },
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    description: 'Soothing pastel dark theme with gentle high-contrast hues.',
    author: 'Catppuccin Org',
    category: 'Nature & Soft',
    colors: {
      bgApp: '#1e1e2e',
      bgSurface: '#252538',
      bgHeader: '#181825',
      bgToolbar: '#1e1e2e',
      bgCanvas: '#11111b',
      bgTabActive: '#313244',
      bgTabInactive: '#181825',
      bgHover: '#45475a',
      bgActive: '#cba6f7',
      border: '#363a4f',
      borderSubtle: '#2a2b3d',
      textPrimary: '#cdd6f4',
      textSecondary: '#bac2de',
      textMuted: '#6c7086',
      accent: '#cba6f7',
      accentHover: '#f5c2e7',
      accentGradient: 'linear-gradient(135deg, #cba6f7 0%, #89b4fa 100%)',
      selectionAnts: '#a6e3a1',
    },
  },
  {
    id: 'one-dark-pro',
    name: 'One Dark Pro',
    description: 'Atom iconic balanced dark theme optimized for eye comfort.',
    author: 'binaryify',
    category: 'Modern Dark',
    colors: {
      bgApp: '#21252b',
      bgSurface: '#282c34',
      bgHeader: '#1e2227',
      bgToolbar: '#21252b',
      bgCanvas: '#181a1f',
      bgTabActive: '#282c34',
      bgTabInactive: '#1e2227',
      bgHover: '#353b45',
      bgActive: '#61afef',
      border: '#3e4451',
      borderSubtle: '#2c313a',
      textPrimary: '#abb2bf',
      textSecondary: '#9da5b4',
      textMuted: '#5c6370',
      accent: '#61afef',
      accentHover: '#528bff',
      accentGradient: 'linear-gradient(135deg, #61afef 0%, #c678dd 100%)',
      selectionAnts: '#98c379',
    },
  },
  {
    id: 'monokai-pro',
    name: 'Monokai Pro',
    description: 'Filter spectrum designed by Wimer Hazenberg for visual focus.',
    author: 'monokai',
    category: 'Gothic & Neon',
    colors: {
      bgApp: '#272822',
      bgSurface: '#34352f',
      bgHeader: '#1e1f1c',
      bgToolbar: '#272822',
      bgCanvas: '#191916',
      bgTabActive: '#3e3d32',
      bgTabInactive: '#272822',
      bgHover: '#49483e',
      bgActive: '#a6e22e',
      border: '#49483e',
      borderSubtle: '#3e3d32',
      textPrimary: '#f8f8f2',
      textSecondary: '#e6db74',
      textMuted: '#75715e',
      accent: '#a6e22e',
      accentHover: '#66d9ef',
      accentGradient: 'linear-gradient(135deg, #a6e22e 0%, #f92672 100%)',
      selectionAnts: '#fd971f',
    },
  },
  {
    id: 'cyberpunk-2077',
    name: 'Cyberpunk 2077',
    description: 'High-octane neon yellow, cyan, and hot magenta cyber theme.',
    author: 'Night City',
    category: 'Gothic & Neon',
    colors: {
      bgApp: '#121217',
      bgSurface: '#1a1a23',
      bgHeader: '#0b0b0e',
      bgToolbar: '#121217',
      bgCanvas: '#08080a',
      bgTabActive: '#262635',
      bgTabInactive: '#121217',
      bgHover: '#323246',
      bgActive: '#fcee0a',
      border: '#2e2e42',
      borderSubtle: '#1f1f2e',
      textPrimary: '#fcee0a',
      textSecondary: '#00f0ff',
      textMuted: '#71718f',
      accent: '#00f0ff',
      accentHover: '#ff003c',
      accentGradient: 'linear-gradient(135deg, #00f0ff 0%, #ff003c 100%)',
      selectionAnts: '#fcee0a',
    },
  },
  {
    id: 'gruvbox-dark',
    name: 'Gruvbox Dark',
    description: 'Retro groove warm earthy dark palette with amber and forest tones.',
    author: 'morhetz',
    category: 'Classic & Retro',
    colors: {
      bgApp: '#282828',
      bgSurface: '#32302f',
      bgHeader: '#1d2021',
      bgToolbar: '#282828',
      bgCanvas: '#191b1c',
      bgTabActive: '#3c3836',
      bgTabInactive: '#282828',
      bgHover: '#504945',
      bgActive: '#d79921',
      border: '#504945',
      borderSubtle: '#3c3836',
      textPrimary: '#ebdbb2',
      textSecondary: '#d5c4a1',
      textMuted: '#928374',
      accent: '#fabd2f',
      accentHover: '#fe8019',
      accentGradient: 'linear-gradient(135deg, #fabd2f 0%, #fb4934 100%)',
      selectionAnts: '#b8bb26',
    },
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    description: 'Ethan Schoonover scientific precision cyan-teal palette.',
    author: 'Ethan Schoonover',
    category: 'Classic & Retro',
    colors: {
      bgApp: '#002b36',
      bgSurface: '#073642',
      bgHeader: '#00212b',
      bgToolbar: '#002b36',
      bgCanvas: '#001b22',
      bgTabActive: '#094452',
      bgTabInactive: '#002b36',
      bgHover: '#0e5264',
      bgActive: '#268bd2',
      border: '#144d5c',
      borderSubtle: '#0a3f4e',
      textPrimary: '#93a1a1',
      textSecondary: '#839496',
      textMuted: '#586e75',
      accent: '#2aa198',
      accentHover: '#268bd2',
      accentGradient: 'linear-gradient(135deg, #2aa198 0%, #b58900 100%)',
      selectionAnts: '#859900',
    },
  },
  {
    id: 'dark-studio',
    name: 'Dark Studio (Default)',
    description: 'ImageMate Studio default professional slate-dark graphics workspace.',
    author: 'ImageMate Team',
    category: 'Modern Dark',
    colors: {
      bgApp: '#1e1e1e',
      bgSurface: '#252526',
      bgHeader: '#282828',
      bgToolbar: '#202020',
      bgCanvas: '#141414',
      bgTabActive: '#202020',
      bgTabInactive: '#141414',
      bgHover: '#333333',
      bgActive: '#007acc',
      border: '#333333',
      borderSubtle: '#2d2d2d',
      textPrimary: '#ffffff',
      textSecondary: '#cccccc',
      textMuted: '#888888',
      accent: '#007acc',
      accentHover: '#0098ff',
      accentGradient: 'linear-gradient(135deg, #007acc 0%, #00a8ff 100%)',
      selectionAnts: '#00c8ff',
    },
  },
];

const THEME_STORAGE_KEY = 'imagemate_selected_theme_id';
const CUSTOM_THEMES_KEY = 'imagemate_custom_themes_list';

export class ThemeEngine {
  /**
   * Retrieves all available themes (built-in + user custom)
   */
  public static getAllThemes(): Theme[] {
    const customJson = localStorage.getItem(CUSTOM_THEMES_KEY);
    if (!customJson) return BUILTIN_THEMES;
    try {
      const custom: Theme[] = JSON.parse(customJson);
      return [...BUILTIN_THEMES, ...custom];
    } catch {
      return BUILTIN_THEMES;
    }
  }

  /**
   * Finds a theme by ID
   */
  public static getThemeById(id: string): Theme {
    const all = this.getAllThemes();
    return all.find((t) => t.id === id) || BUILTIN_THEMES[0]; // fallback to Tokyo Night
  }

  /**
   * Gets the currently saved active theme ID
   */
  public static getActiveThemeId(): string {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'tokyo-night';
  }

  /**
   * Applies the theme's colors directly to :root CSS variables and sets data-theme attribute
   */
  public static applyTheme(themeOrId: Theme | string): Theme {
    const theme = typeof themeOrId === 'string' ? this.getThemeById(themeOrId) : themeOrId;
    const root = document.documentElement;
    const c = theme.colors;

    root.setAttribute('data-theme', theme.id);

    // Inject CSS Custom Properties
    root.style.setProperty('--theme-bg-app', c.bgApp);
    root.style.setProperty('--theme-bg-surface', c.bgSurface);
    root.style.setProperty('--theme-bg-header', c.bgHeader);
    root.style.setProperty('--theme-bg-toolbar', c.bgToolbar);
    root.style.setProperty('--theme-bg-canvas', c.bgCanvas);
    root.style.setProperty('--theme-bg-tab-active', c.bgTabActive);
    root.style.setProperty('--theme-bg-tab-inactive', c.bgTabInactive);
    root.style.setProperty('--theme-bg-hover', c.bgHover);
    root.style.setProperty('--theme-bg-active', c.bgActive);
    root.style.setProperty('--theme-border', c.border);
    root.style.setProperty('--theme-border-subtle', c.borderSubtle);
    root.style.setProperty('--theme-text-primary', c.textPrimary);
    root.style.setProperty('--theme-text-secondary', c.textSecondary);
    root.style.setProperty('--theme-text-muted', c.textMuted);
    root.style.setProperty('--theme-accent', c.accent);
    root.style.setProperty('--theme-accent-hover', c.accentHover);
    root.style.setProperty('--theme-accent-gradient', c.accentGradient);
    root.style.setProperty('--theme-selection-ants', c.selectionAnts);

    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
    return theme;
  }

  /**
   * Saves a new or edited custom theme
   */
  public static saveCustomTheme(theme: Theme): void {
    const customJson = localStorage.getItem(CUSTOM_THEMES_KEY);
    let custom: Theme[] = [];
    if (customJson) {
      try {
        custom = JSON.parse(customJson);
      } catch {
        custom = [];
      }
    }
    const idx = custom.findIndex((t) => t.id === theme.id);
    if (idx >= 0) {
      custom[idx] = theme;
    } else {
      custom.push(theme);
    }
    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(custom));
    this.applyTheme(theme);
  }

  /**
   * Exports a theme definition as a JSON string
   */
  public static exportThemeJSON(theme: Theme): string {
    return JSON.stringify(theme, null, 2);
  }

  /**
   * Imports a theme definition from a JSON string or VS Code theme schema
   */
  public static importThemeJSON(jsonString: string): Theme {
    const raw = JSON.parse(jsonString);

    // If it's an ImageMate Theme
    if (raw.colors && raw.colors.bgApp && raw.colors.accent) {
      const imported: Theme = {
        id: `custom-${Date.now()}`,
        name: raw.name || 'Imported Theme',
        description: raw.description || 'Custom imported color theme',
        author: raw.author || 'User',
        category: 'Modern Dark',
        colors: {
          bgApp: raw.colors.bgApp,
          bgSurface: raw.colors.bgSurface || raw.colors.bgApp,
          bgHeader: raw.colors.bgHeader || raw.colors.bgApp,
          bgToolbar: raw.colors.bgToolbar || raw.colors.bgApp,
          bgCanvas: raw.colors.bgCanvas || '#111116',
          bgTabActive: raw.colors.bgTabActive || raw.colors.bgSurface || '#252538',
          bgTabInactive: raw.colors.bgTabInactive || raw.colors.bgApp,
          bgHover: raw.colors.bgHover || '#353545',
          bgActive: raw.colors.bgActive || raw.colors.accent,
          border: raw.colors.border || '#383848',
          borderSubtle: raw.colors.borderSubtle || '#282838',
          textPrimary: raw.colors.textPrimary || '#ffffff',
          textSecondary: raw.colors.textSecondary || '#cccccc',
          textMuted: raw.colors.textMuted || '#888888',
          accent: raw.colors.accent,
          accentHover: raw.colors.accentHover || raw.colors.accent,
          accentGradient: raw.colors.accentGradient || `linear-gradient(135deg, ${raw.colors.accent} 0%, #89b4fa 100%)`,
          selectionAnts: raw.colors.selectionAnts || raw.colors.accent,
        },
      };
      this.saveCustomTheme(imported);
      return imported;
    }

    // If it's a VS Code standard theme json
    if (raw.colors) {
      const c = raw.colors;
      const bg = c['editor.background'] || c['activityBar.background'] || '#1e1e1e';
      const surface = c['sideBar.background'] || c['panel.background'] || '#252526';
      const header = c['titleBar.activeBackground'] || c['activityBar.background'] || '#282828';
      const accent = c['activityBarBadge.background'] || c['focusBorder'] || '#7aa2f7';
      const border = c['panel.border'] || c['sideBar.border'] || '#333333';
      const fg = c['editor.foreground'] || '#cccccc';

      const imported: Theme = {
        id: `vscode-${Date.now()}`,
        name: raw.name || 'VS Code Imported',
        description: 'Imported from VS Code color theme palette',
        author: raw.author || 'Imported',
        category: 'Modern Dark',
        colors: {
          bgApp: bg,
          bgSurface: surface,
          bgHeader: header,
          bgToolbar: bg,
          bgCanvas: '#111116',
          bgTabActive: surface,
          bgTabInactive: bg,
          bgHover: '#353548',
          bgActive: accent,
          border: border,
          borderSubtle: border,
          textPrimary: '#ffffff',
          textSecondary: fg,
          textMuted: '#777788',
          accent: accent,
          accentHover: accent,
          accentGradient: `linear-gradient(135deg, ${accent} 0%, #bb9af7 100%)`,
          selectionAnts: accent,
        },
      };
      this.saveCustomTheme(imported);
      return imported;
    }

    throw new Error('Unsupported theme JSON structure. Provide an ImageMate or VS Code theme JSON.');
  }
}
