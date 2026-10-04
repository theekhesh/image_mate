/**
 * ImageMate Studio - Theme Definitions & Types
 * Universal theme compatibility (Tokyo Night, Dracula, Nord, Catppuccin, etc.)
 */

export interface ThemeColors {
  bgApp: string;           // Base root background
  bgSurface: string;       // Panels, docks, dropdowns, cards
  bgHeader: string;        // Top menu bar, options bar
  bgToolbar: string;       // Left tool strip
  bgCanvas: string;        // Canvas stage outer area
  bgTabActive: string;     // Active document tab
  bgTabInactive: string;   // Inactive document tab
  bgHover: string;         // Hover state on buttons & lists
  bgActive: string;        // Active selected tool or item
  border: string;          // Main borders and dividers
  borderSubtle: string;    // Inner borders
  textPrimary: string;     // Main text headings & titles
  textSecondary: string;   // Body text, tooltips, panel labels
  textMuted: string;       // Inactive labels, shortcuts
  accent: string;          // Primary brand & focus color
  accentHover: string;     // Accent hover
  accentGradient: string;  // For AI Enhance / Highlights
  selectionAnts: string;   // Marching ants / selection outline color
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  author?: string;
  category: 'Modern Dark' | 'Gothic & Neon' | 'Classic & Retro' | 'Nature & Soft';
  colors: ThemeColors;
}
