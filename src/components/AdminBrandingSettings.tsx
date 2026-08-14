import React, { useState, useEffect } from 'react';
import { AppBranding, DEFAULT_BRANDING } from '../types';
import { updateAppBrandingInFirestore } from '../services/vaultService';
import { AppLogo } from './AppLogo';
import {
  Palette,
  Type,
  Image as ImageIcon,
  FileText,
  Save,
  Check,
  Shield,
  HardDrive,
  Lock,
  Cloud,
  Key,
  Cpu,
  RefreshCw
} from 'lucide-react';

interface AdminBrandingSettingsProps {
  branding: AppBranding;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const COLOR_PRESETS = [
  { name: 'Olive Green', hex: '#556B2F' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Deep Purple', hex: '#7C3AED' },
  { name: 'Rose Red', hex: '#E11D48' },
  { name: 'Amber Gold', hex: '#D97706' },
  { name: 'Dark Slate', hex: '#334155' },
];

export const AdminBrandingSettings: React.FC<AdminBrandingSettingsProps> = ({
  branding,
  showToast,
}) => {
  const [formState, setFormState] = useState<AppBranding>(branding);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    setFormState(branding);
  }, [branding]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.appName.trim()) {
      showToast('App Name cannot be empty.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await updateAppBrandingInFirestore(formState);
      showToast('App branding & theme customization updated in Firestore!', 'success');
    } catch (err) {
      console.error('Failed to update app branding:', err);
      showToast('Failed to save branding settings to database.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefault = () => {
    if (window.confirm('Reset app branding to default settings?')) {
      setFormState(DEFAULT_BRANDING);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-olive-primary/15 via-olive-sage/10 to-transparent border border-olive-sage/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-cream flex items-center gap-2">
            <Palette className="text-olive-primary" size={22} />
            App Branding & System Customization
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
            Customize the application title, logo, primary color palette, footer text, and terms & conditions.
            All changes are saved directly to Firestore and synced live across all user sessions.
          </p>
        </div>

        {/* Live Preview Badge */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-olive-sage/20 shadow-sm flex items-center gap-3 shrink-0">
          <div className="text-left">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
              Live Preview
            </span>
            <AppLogo branding={formState} iconSize={18} badgeSize="w-8 h-8" textSize="text-sm" />
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 1: Brand Name & Logo */}
          <div className="bg-white dark:bg-[#1E241E] p-6 rounded-3xl border border-olive-sage/20 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-olive-sage/15 pb-3">
              <Type size={18} className="text-olive-primary" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-cream uppercase tracking-wide">
                Application Name & Logo
              </h3>
            </div>

            {/* App Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Application Title
              </label>
              <input
                type="text"
                value={formState.appName}
                onChange={(e) => setFormState((prev) => ({ ...prev, appName: e.target.value }))}
                placeholder="e.g. VaultX Security"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-olive-sage/20 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-olive-primary"
              />
            </div>

            {/* Logo Type Switcher */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Logo Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormState((prev) => ({ ...prev, appLogoType: 'icon' }))}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    formState.appLogoType === 'icon'
                      ? 'bg-olive-primary text-white border-olive-primary shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-olive-sage/20'
                  }`}
                >
                  <Shield size={14} /> Preset Icon
                </button>
                <button
                  type="button"
                  onClick={() => setFormState((prev) => ({ ...prev, appLogoType: 'image' }))}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    formState.appLogoType === 'image'
                      ? 'bg-olive-primary text-white border-olive-primary shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-olive-sage/20'
                  }`}
                >
                  <ImageIcon size={14} /> Custom Image URL
                </button>
              </div>
            </div>

            {/* Icon Selector or Image URL */}
            {formState.appLogoType === 'icon' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Icon Symbol
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { id: 'HardDrive', icon: HardDrive, label: 'Drive' },
                    { id: 'Shield', icon: Shield, label: 'Shield' },
                    { id: 'Lock', icon: Lock, label: 'Lock' },
                    { id: 'Cloud', icon: Cloud, label: 'Cloud' },
                    { id: 'Key', icon: Key, label: 'Key' },
                    { id: 'Cpu', icon: Cpu, label: 'Cpu' },
                  ].map((item) => {
                    const IconComp = item.icon;
                    const isSelected = formState.appLogoIcon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormState((prev) => ({ ...prev, appLogoIcon: item.id }))}
                        className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-olive-primary/10 border-olive-primary text-olive-primary dark:text-white'
                            : 'bg-slate-50 dark:bg-slate-900 border-olive-sage/20 text-slate-600 dark:text-slate-400 hover:border-olive-primary/40'
                        }`}
                      >
                        <IconComp size={16} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formState.appLogoUrl || ''}
                  onChange={(e) => setFormState((prev) => ({ ...prev, appLogoUrl: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-olive-sage/20 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-olive-primary"
                />
              </div>
            )}
          </div>

          {/* Section 2: Color Palette */}
          <div className="bg-white dark:bg-[#1E241E] p-6 rounded-3xl border border-olive-sage/20 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-olive-sage/15 pb-3">
              <Palette size={18} className="text-olive-primary" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-cream uppercase tracking-wide">
                Primary Theme Accent & Color Palette
              </h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Choose Color Preset
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setFormState((prev) => ({ ...prev, primaryColor: preset.hex }))}
                    className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
                      formState.primaryColor === preset.hex
                        ? 'border-slate-900 dark:border-white ring-2 ring-olive-primary/40'
                        : 'border-olive-sage/20 hover:border-olive-primary/40'
                    }`}
                  >
                    <span
                      style={{ backgroundColor: preset.hex }}
                      className="w-4 h-4 rounded-full shadow-sm shrink-0"
                    />
                    <span className="truncate text-[11px] text-slate-700 dark:text-slate-300">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Custom Hex Color Code
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formState.primaryColor || '#556B2F'}
                  onChange={(e) => setFormState((prev) => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-olive-sage/20 bg-transparent"
                />
                <input
                  type="text"
                  value={formState.primaryColor}
                  onChange={(e) => setFormState((prev) => ({ ...prev, primaryColor: e.target.value }))}
                  placeholder="#556B2F"
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-olive-sage/20 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-olive-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Footer Customization */}
        <div className="bg-white dark:bg-[#1E241E] p-6 rounded-3xl border border-olive-sage/20 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-olive-sage/15 pb-3">
            <FileText size={18} className="text-olive-primary" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-cream uppercase tracking-wide">
              Footer Text & Subtext
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Footer Text
              </label>
              <input
                type="text"
                value={formState.footerText}
                onChange={(e) => setFormState((prev) => ({ ...prev, footerText: e.target.value }))}
                placeholder="e.g. © 2026 VaultX Systems. All Rights Reserved."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-olive-sage/20 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-olive-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Footer Subtext / Disclaimer
              </label>
              <input
                type="text"
                value={formState.footerSubtext || ''}
                onChange={(e) => setFormState((prev) => ({ ...prev, footerSubtext: e.target.value }))}
                placeholder="e.g. Built for high-security enterprise document management."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-olive-sage/20 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-olive-primary"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Terms & Conditions Customization */}
        <div className="bg-white dark:bg-[#1E241E] p-6 rounded-3xl border border-olive-sage/20 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-olive-sage/15 pb-3">
            <FileText size={18} className="text-olive-primary" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-cream uppercase tracking-wide">
              Terms & Conditions Agreement Content
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Terms Title
            </label>
            <input
              type="text"
              value={formState.termsTitle}
              onChange={(e) => setFormState((prev) => ({ ...prev, termsTitle: e.target.value }))}
              placeholder="e.g. Terms & Conditions of Service"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-olive-sage/20 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-olive-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Terms Content Text
            </label>
            <textarea
              rows={8}
              value={formState.termsContent}
              onChange={(e) => setFormState((prev) => ({ ...prev, termsContent: e.target.value }))}
              placeholder="Enter system terms & conditions..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-olive-sage/20 rounded-xl p-3.5 text-xs font-sans text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-olive-primary leading-relaxed"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleResetDefault}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <RefreshCw size={14} /> Reset Defaults
          </button>

          <button
            type="submit"
            disabled={isSaving}
            style={{ backgroundColor: formState.primaryColor || '#556B2F' }}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-extrabold text-xs shadow-lg transition-all hover:opacity-90 active:scale-98 disabled:opacity-50"
          >
            <Save size={16} />
            {isSaving ? 'Saving to Database...' : 'Save Branding to Firestore'}
          </button>
        </div>
      </form>
    </div>
  );
};
