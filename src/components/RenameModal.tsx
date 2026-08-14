import React, { useState, useEffect } from 'react';
import { FileItem, FolderItem } from '../types';
import { Edit3, X, Check, FileText, Folder } from 'lucide-react';

interface RenameModalProps {
  item: FileItem | FolderItem | null;
  itemType: 'file' | 'folder' | null;
  onClose: () => void;
  onSave: (newName: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  item,
  itemType,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name);
    }
  }, [item]);

  if (!item || !itemType) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-md rounded-3xl p-6 shadow-2xl border border-olive-sage/30 space-y-5 relative text-slate-800 dark:text-cream">
        <div className="flex items-center justify-between border-b border-olive-sage/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-olive-primary text-white shadow-md">
              <Edit3 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Rename {itemType === 'folder' ? 'Folder' : 'File'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter a new display title for this vault {itemType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-cream hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {itemType === 'folder' ? 'Folder Name' : 'File Name'}
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400">
                {itemType === 'folder' ? <Folder size={18} /> : <FileText size={18} />}
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Enter new ${itemType} name...`}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white/80 dark:bg-slate-800/80 border border-olive-sage/40 text-slate-900 dark:text-cream focus:ring-2 focus:ring-olive-primary focus:outline-none"
                autoFocus
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || name.trim() === item.name}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-olive-primary hover:bg-olive-dark text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all flex items-center gap-1.5"
            >
              <Check size={16} />
              <span>Save Name</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
