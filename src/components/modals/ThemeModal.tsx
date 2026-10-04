/**
 * ImageMate Studio - Universal Theme Selector & Customizer Modal
 * Allows switching between Tokyo Night, Dracula, Nord, Catppuccin, One Dark, Monokai, Cyberpunk, etc.
 * Supports custom theme creation and universal JSON import/export.
 */

import React, { useState } from 'react';
import {
  Palette,
  X,
  Check,
  Download,
  Upload,
  Sparkles,
  Sliders,
  Copy,
  Layers,
} from 'lucide-react';
import { Theme, ThemeColors } from '../../types/theme';
import { BUILTIN_THEMES, ThemeEngine } from '../../utils/themeEngine';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId: string;
  onThemeChange: (theme: Theme) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  currentThemeId,
  onThemeChange,
}) => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'custom' | 'import-export'>('gallery');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [themesList, setThemesList] = useState<Theme[]>(ThemeEngine.getAllThemes());
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Custom Theme state
  const currentTheme = themesList.find((t) => t.id === currentThemeId) || BUILTIN_THEMES[0];
  const [customName, setCustomName] = useState('My Custom Theme');
  const [customColors, setCustomColors] = useState<ThemeColors>({ ...currentTheme.colors });

  if (!isOpen) return null;

  const categories = ['All', 'Modern Dark', 'Gothic & Neon', 'Nature & Soft', 'Classic & Retro'];
  const filteredThemes =
    filterCategory === 'All'
      ? themesList
      : themesList.filter((t) => t.category === filterCategory);

  const handleSelectTheme = (theme: Theme) => {
    ThemeEngine.applyTheme(theme);
    onThemeChange(theme);
  };

  const handleSaveCustomTheme = () => {
    const newTheme: Theme = {
      id: `custom-${Date.now()}`,
      name: customName.trim() || 'Custom Palette',
      description: 'User-customized color theme',
      category: 'Modern Dark',
      colors: { ...customColors },
    };
    ThemeEngine.saveCustomTheme(newTheme);
    setThemesList(ThemeEngine.getAllThemes());
    onThemeChange(newTheme);
    setActiveTab('gallery');
  };

  const handleExportJSON = () => {
    const jsonStr = ThemeEngine.exportThemeJSON(currentTheme);
    navigator.clipboard.writeText(jsonStr);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  const handleImportJSON = () => {
    setImportError(null);
    try {
      if (!importJsonText.trim()) {
        setImportError('Please paste theme JSON text before importing.');
        return;
      }
      const imported = ThemeEngine.importThemeJSON(importJsonText);
      setThemesList(ThemeEngine.getAllThemes());
      onThemeChange(imported);
      setImportJsonText('');
      setActiveTab('gallery');
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse JSON. Ensure it is valid theme JSON.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 select-none backdrop-blur-xs">
      <div className="bg-[#24283b] border border-[#3e4451] rounded-xl shadow-2xl w-full max-w-4xl text-xs text-[#cccccc] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#1f2335] border-b border-[#2f3549] flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#7aa2f7]/15 text-[#7aa2f7]">
              <Palette size={18} />
            </div>
            <div>
              <span className="font-bold text-sm text-white">Color Themes & Visual Style</span>
              <p className="text-[11px] text-gray-400">
                Switch between universally popular themes or customize your creative workspace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-[#292e42] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 bg-[#1a1b26] border-b border-[#2f3549]">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-3.5 py-1.5 font-medium rounded-t-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'gallery'
                ? 'bg-[#24283b] text-white border-t-2 border-[#7aa2f7]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layers size={13} />
            <span>Theme Gallery</span>
          </button>
          <button
            onClick={() => {
              setCustomColors({ ...currentTheme.colors });
              setActiveTab('custom');
            }}
            className={`px-3.5 py-1.5 font-medium rounded-t-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'custom'
                ? 'bg-[#24283b] text-white border-t-2 border-[#7aa2f7]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sliders size={13} />
            <span>Customize Theme</span>
          </button>
          <button
            onClick={() => setActiveTab('import-export')}
            className={`px-3.5 py-1.5 font-medium rounded-t-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'import-export'
                ? 'bg-[#24283b] text-white border-t-2 border-[#7aa2f7]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Download size={13} />
            <span>Import / Export</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 bg-[#1a1b26]">
          {/* 1. Theme Gallery Tab */}
          {activeTab === 'gallery' && (
            <div className="flex flex-col gap-4">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                      filterCategory === cat
                        ? 'bg-[#7aa2f7] text-white shadow-xs'
                        : 'bg-[#24283b] text-gray-400 hover:text-white hover:bg-[#2f3549]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Theme Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredThemes.map((theme) => {
                  const isActive = theme.id === currentThemeId;
                  const c = theme.colors;

                  return (
                    <div
                      key={theme.id}
                      onClick={() => handleSelectTheme(theme)}
                      className={`group relative rounded-xl border p-3.5 flex flex-col justify-between gap-3 cursor-pointer transition-all duration-150 hover:scale-[1.01] ${
                        isActive
                          ? 'border-[#7aa2f7] ring-2 ring-[#7aa2f7]/40 shadow-lg'
                          : 'border-[#2f3549] hover:border-[#414868]'
                      }`}
                      style={{ backgroundColor: c.bgSurface }}
                    >
                      {/* Top Card Info */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="font-bold text-sm tracking-wide"
                              style={{ color: c.textPrimary }}
                            >
                              {theme.name}
                            </span>
                            {isActive && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-xs"
                                style={{ backgroundColor: c.accent, color: '#ffffff' }}
                              >
                                <Check size={10} strokeWidth={3} /> Active
                              </span>
                            )}
                          </div>
                          <p
                            className="text-[11px] line-clamp-2 mt-1 leading-snug"
                            style={{ color: c.textSecondary }}
                          >
                            {theme.description}
                          </p>
                        </div>
                      </div>

                      {/* Visual Color Palette Swatches */}
                      <div className="flex flex-col gap-1.5 pt-2 border-t" style={{ borderColor: c.borderSubtle }}>
                        <div className="flex items-center justify-between text-[10px]" style={{ color: c.textMuted }}>
                          <span>Palette Palette</span>
                          <span>{theme.author || 'ImageMate'}</span>
                        </div>
                        <div className="flex items-center h-5 w-full rounded-md overflow-hidden border shadow-inner" style={{ borderColor: c.border }}>
                          <div
                            className="flex-1 h-full"
                            style={{ backgroundColor: c.bgApp }}
                            title={`Base App: ${c.bgApp}`}
                          />
                          <div
                            className="flex-1 h-full"
                            style={{ backgroundColor: c.bgSurface }}
                            title={`Surface: ${c.bgSurface}`}
                          />
                          <div
                            className="flex-1 h-full"
                            style={{ backgroundColor: c.bgHeader }}
                            title={`Header: ${c.bgHeader}`}
                          />
                          <div
                            className="flex-1 h-full"
                            style={{ backgroundColor: c.accent }}
                            title={`Accent: ${c.accent}`}
                          />
                          <div
                            className="flex-1 h-full"
                            style={{ backgroundColor: c.selectionAnts }}
                            title={`Selection Outline: ${c.selectionAnts}`}
                          />
                        </div>

                        {/* Mini Theme Slider Preview */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-[10px]" style={{ color: c.textMuted }}>Theme Slider:</span>
                          <input
                            type="range"
                            defaultValue={60}
                            tabIndex={-1}
                            style={{ accentColor: c.accent }}
                            className="flex-1 h-1.5 rounded cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      {/* Apply button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTheme(theme);
                        }}
                        className={`w-full py-1.5 rounded-md font-medium text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                          isActive
                            ? 'opacity-90 cursor-default'
                            : 'hover:brightness-110'
                        }`}
                        style={{
                          backgroundColor: isActive ? c.bgActive : c.bgHeader,
                          color: isActive ? '#ffffff' : c.textPrimary,
                          border: `1px solid ${c.border}`,
                        }}
                      >
                        {isActive ? (
                          <>
                            <Check size={12} /> Currently Selected
                          </>
                        ) : (
                          'Use This Theme'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Custom Theme Tab */}
          {activeTab === 'custom' && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-white text-sm">Theme Personalization</span>
                <p className="text-gray-400 text-xs">
                  Fine-tune any color coordinate to match your workflow or monitor profile.
                </p>
              </div>

              {/* Theme Name Input */}
              <div className="flex items-center gap-3">
                <label className="text-gray-300 font-medium w-28 shrink-0">Theme Name:</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="bg-[#24283b] border border-[#3e4451] rounded-md px-3 py-1.5 text-xs text-white flex-1 max-w-sm focus:border-[#7aa2f7] outline-hidden"
                  placeholder="e.g. Midnight Cyberpunk"
                />
              </div>

              {/* Color Pickers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'bgApp', label: 'Base Background', desc: 'Main window backdrop' },
                  { key: 'bgSurface', label: 'Panel Surface', desc: 'Layers dock, panels, cards' },
                  { key: 'bgHeader', label: 'Menu & Options Bar', desc: 'Top bars and tool strips' },
                  { key: 'bgToolbar', label: 'Left Toolbox Strip', desc: 'Tool button palette' },
                  { key: 'bgCanvas', label: 'Canvas Stage', desc: 'Surrounding workspace canvas' },
                  { key: 'accent', label: 'Accent / Focus', desc: 'Active buttons & highlights' },
                  { key: 'textPrimary', label: 'Primary Text', desc: 'Headings, active labels' },
                  { key: 'textSecondary', label: 'Secondary Text', desc: 'Descriptions & values' },
                  { key: 'border', label: 'Borders & Lines', desc: 'Outer dividers and separators' },
                  { key: 'selectionAnts', label: 'Selection Ants', desc: 'Selection bounding outlines' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="p-3 rounded-lg bg-[#24283b] border border-[#2f3549] flex items-center justify-between gap-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-white text-xs">{item.label}</span>
                      <span className="text-[10px] text-gray-400">{item.desc}</span>
                      <span className="font-mono text-[10px] text-[#7aa2f7] mt-0.5">
                        {(customColors as any)[item.key]}
                      </span>
                    </div>
                    <input
                      type="color"
                      value={(customColors as any)[item.key]}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomColors((prev) => ({
                          ...prev,
                          [item.key]: val,
                          ...(item.key === 'accent' ? { bgActive: val, accentHover: val } : {}),
                        }));
                      }}
                      className="w-9 h-9 rounded cursor-pointer border border-[#3e4451] bg-transparent"
                    />
                  </div>
                ))}
              </div>

              {/* Live Preview Bar */}
              <div
                className="p-4 rounded-xl border flex items-center justify-between shadow-lg"
                style={{
                  backgroundColor: customColors.bgSurface,
                  borderColor: customColors.border,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-white shadow-xs"
                    style={{ backgroundColor: customColors.accent }}
                  >
                    IM
                  </div>
                  <div>
                    <span className="font-bold text-sm" style={{ color: customColors.textPrimary }}>
                      {customName || 'Live Preview'}
                    </span>
                    <p className="text-[11px]" style={{ color: customColors.textSecondary }}>
                      Previewing buttons, typography, and dynamic sliders
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/20 border border-white/10">
                    <span className="text-[10px] text-gray-300">Slider:</span>
                    <input
                      type="range"
                      defaultValue={65}
                      style={{ accentColor: customColors.accent }}
                      className="w-24 h-1.5 rounded cursor-pointer"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveCustomTheme}
                    className="px-4 py-2 rounded-lg font-medium text-white shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                    style={{ backgroundColor: customColors.accent }}
                  >
                    <Sparkles size={14} /> Save & Apply Custom Theme
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. Import / Export Tab */}
          {activeTab === 'import-export' && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-white text-sm">Universal Theme Compatibility</span>
                <p className="text-gray-400 text-xs">
                  Export your active theme configuration or import themes from standard ImageMate and VS Code color theme JSON definitions.
                </p>
              </div>

              {/* Export Active Theme */}
              <div className="p-4 rounded-xl bg-[#24283b] border border-[#2f3549] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download size={16} className="text-[#7aa2f7]" />
                    <span className="font-semibold text-white text-xs">
                      Export Active Theme ({currentTheme.name})
                    </span>
                  </div>
                  <button
                    onClick={handleExportJSON}
                    className="px-3 py-1.5 rounded bg-[#1f2335] hover:bg-[#292e42] border border-[#3e4451] text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedNotice ? (
                      <>
                        <Check size={13} className="text-green-400" /> Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy size={13} /> Copy Theme JSON
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  Copies the full color mapping specification to share or backup across devices.
                </p>
              </div>

              {/* Import Theme */}
              <div className="p-4 rounded-xl bg-[#24283b] border border-[#2f3549] flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Upload size={16} className="text-[#7aa2f7]" />
                  <span className="font-semibold text-white text-xs">
                    Import Theme JSON (ImageMate / VS Code compatible)
                  </span>
                </div>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="Paste theme JSON configuration here..."
                  rows={6}
                  className="w-full bg-[#1a1b26] border border-[#3e4451] rounded-lg p-3 text-xs font-mono text-[#c0caf5] outline-hidden focus:border-[#7aa2f7]"
                />
                {importError && (
                  <span className="text-red-400 text-xs font-medium">⚠️ {importError}</span>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={handleImportJSON}
                    className="px-4 py-1.5 rounded-lg bg-[#7aa2f7] hover:bg-[#89b4fa] text-white font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload size={13} /> Import & Apply Theme
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#1f2335] border-t border-[#2f3549] flex justify-between items-center">
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <span>Active:</span>
            <span className="font-semibold text-white">{currentTheme.name}</span>
            <span>•</span>
            <span>{currentTheme.category}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#292e42] hover:bg-[#343b58] text-white font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
