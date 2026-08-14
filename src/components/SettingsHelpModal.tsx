import React, { useState } from 'react';
import { UserProfile, FileItem, FolderItem } from '../types';
import { X, Shield, Key, HardDrive, HelpCircle, Check, Info, Lock, Zap, RotateCcw, Trash2, Folder, FileText, RefreshCw } from 'lucide-react';
import { formatBytes } from '../utils/formatters';

interface SettingsModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  showToast: (msg: string) => void;
  deletedFiles?: FileItem[];
  deletedFolders?: FolderItem[];
  onRestoreFile?: (id: string) => void;
  onRestoreFolder?: (id: string) => void;
  onPermanentDeleteFile?: (id: string) => void;
  onPermanentDeleteFolder?: (id: string) => void;
  onEmptyBin?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdateUser,
  showToast,
  deletedFiles = [],
  deletedFolders = [],
  onRestoreFile,
  onRestoreFolder,
  onPermanentDeleteFile,
  onPermanentDeleteFolder,
  onEmptyBin,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'restore'>('profile');
  const [name, setName] = useState(user.name);
  const [twoFactor, setTwoFactor] = useState(user.twoFactorEnabled);
  const [isConfirmingEmpty, setIsConfirmingEmpty] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ name, twoFactorEnabled: twoFactor });
    showToast('Account settings updated successfully!');
    onClose();
  };

  const totalDeletedCount = deletedFiles.length + deletedFolders.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-xl rounded-3xl p-6 shadow-2xl border border-olive-sage/30 space-y-4 relative text-slate-800 dark:text-cream max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-olive-sage/20 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-olive-primary text-white">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Vault Settings & Backup
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                IFFL Encrypted Vault Profile & Data Recovery
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-cream"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-cream/80 dark:bg-slate-800/80 p-1 border border-olive-sage/30 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'profile'
                ? 'bg-olive-primary text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-cream'
            }`}
          >
            <Shield size={15} />
            <span>Profile & Security</span>
          </button>
          <button
            onClick={() => setActiveTab('restore')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'restore'
                ? 'bg-olive-primary text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-cream'
            }`}
          >
            <RotateCcw size={15} />
            <span>Backup & Restore ({totalDeletedCount})</span>
          </button>
        </div>

        {/* Tab 1: Profile & Security */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSave} className="space-y-4 overflow-y-auto pr-1">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl text-base md:text-sm bg-white/70 dark:bg-slate-800/70 border border-olive-sage/40 text-slate-900 dark:text-cream focus:ring-2 focus:ring-olive-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-4 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-900/60 border border-olive-sage/20 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-olive-light/40 dark:bg-slate-800/40 border border-olive-sage/30 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-cream">
                    Encryption Architecture
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {user.encryptionMethod}
                  </p>
                </div>
                <Lock size={18} className="text-emerald-600" />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-olive-sage/30">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-cream">
                  Two-Factor Authentication (2FA)
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Require security verification on sign-in
                </p>
              </div>
              <input
                type="checkbox"
                checked={twoFactor}
                onChange={(e) => setTwoFactor(e.target.checked)}
                className="w-5 h-5 accent-olive-primary rounded cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-semibold text-sm bg-olive-primary hover:bg-olive-dark text-white shadow-lg shadow-olive-primary/20 transition-all flex items-center justify-center gap-2"
            >
              <Check size={18} />
              <span>Save Settings</span>
            </button>
          </form>
        )}

        {/* Tab 2: Backup & Restore (Deleted Items / Bin) */}
        {activeTab === 'restore' && (
          <div className="space-y-3 overflow-y-auto pr-1 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Deleted files and folders are safely stored here. You can restore them to your main vault anytime or delete them permanently from database.
              </p>
              {totalDeletedCount > 0 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {isConfirmingEmpty ? (
                    <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/30 p-1.5 rounded-xl border border-red-200 dark:border-red-900/50">
                      <span className="text-[10px] font-bold text-red-600 dark:text-red-400 px-1">Clear all?</span>
                      <button
                        onClick={() => {
                          setIsConfirmingEmpty(false);
                          if (onEmptyBin) {
                            onEmptyBin();
                          } else {
                            deletedFiles.forEach((f) => onPermanentDeleteFile && onPermanentDeleteFile(f.id));
                            deletedFolders.forEach((fld) => onPermanentDeleteFolder && onPermanentDeleteFolder(fld.id));
                          }
                          showToast('Backup bin cleared permanently.');
                        }}
                        className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 transition-colors cursor-pointer"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setIsConfirmingEmpty(false)}
                        className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsConfirmingEmpty(true)}
                      className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-bold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Empty Bin</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {totalDeletedCount === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2 border border-dashed border-olive-sage/40 rounded-2xl bg-white/40 dark:bg-slate-900/40">
                <RotateCcw size={36} className="mx-auto text-olive-sage opacity-70" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Backup Bin is Empty</p>
                <p className="text-xs text-slate-400">Files and folders you delete will appear here for recovery or permanent deletion.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Deleted Folders */}
                {deletedFolders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-olive-sage/30"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <Folder size={18} className="text-olive-primary shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 dark:text-cream truncate">
                          {folder.name}
                        </p>
                        <p className="text-[10px] text-slate-400">Folder (In Bin)</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onRestoreFolder && onRestoreFolder(folder.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                        title="Restore Folder"
                      >
                        <RotateCcw size={13} />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => onPermanentDeleteFolder && onPermanentDeleteFolder(folder.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1"
                        title="Delete Permanently from DB"
                      >
                        <Trash2 size={13} />
                        <span>Permanent Delete</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Deleted Files */}
                {deletedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-olive-sage/30"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <FileText size={18} className="text-slate-500 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 dark:text-cream truncate">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-slate-400">{formatBytes(file.size)} • In Bin</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onRestoreFile && onRestoreFile(file.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                        title="Restore File"
                      >
                        <RotateCcw size={13} />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => onPermanentDeleteFile && onPermanentDeleteFile(file.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1"
                        title="Delete Permanently from DB"
                      >
                        <Trash2 size={13} />
                        <span>Permanent Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-olive-sage/30 space-y-4 relative text-slate-800 dark:text-cream">
        <div className="flex items-center justify-between border-b border-olive-sage/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-olive-primary text-white">
              <HelpCircle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Help & Support Center
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                IFFL Cloud Storage Platform v2.0 FAQ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-cream"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
          <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-olive-sage/20 space-y-1">
            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Zap size={14} className="text-olive-primary" />
              How does the 4-Digit Captcha work?
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              The captcha canvas on the login screen dynamically generates a 4-digit code with noise lines. Use the refresh button to re-roll code anytime.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-olive-sage/20 space-y-1">
            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Key size={14} className="text-olive-primary" />
              What is the test Forgot Password OTP?
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Use test verification code <strong className="font-mono text-olive-primary">1234</strong> during the 3-step reset workflow.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-olive-sage/20 space-y-1">
            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <HardDrive size={14} className="text-olive-primary" />
              What is my Free Tier storage limit?
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Every user receives 985 MB of free end-to-end encrypted cloud storage space.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-semibold text-xs bg-olive-primary hover:bg-olive-dark text-white shadow-md transition-all"
        >
          Close Help Center
        </button>
      </div>
    </div>
  );
};
