import React, { useState } from 'react';
import { FileItem, FolderItem } from '../types';
import { Folder, ArrowRightLeft, X, Check, Home, Tag } from 'lucide-react';

interface MoveItemModalProps {
  file: FileItem | null;
  folders: FolderItem[];
  customCategories?: string[];
  onClose: () => void;
  onConfirmMove: (file: FileItem, targetFolderId: string | null, targetCategory?: string) => void;
}

export const MoveItemModal: React.FC<MoveItemModalProps> = ({
  file,
  folders,
  customCategories = [],
  onClose,
  onConfirmMove,
}) => {

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(file?.parentFolderId || null);
  const [selectedCategory, setSelectedCategory] = useState<string>(file?.category || 'other');

  const activeFolders = folders.filter((f) => !f.isDeleted);
  if (!file) return null;

  const categoriesList = Array.from(
    new Set(['document', 'image', 'video', 'audio', 'other', ...customCategories])
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmMove(file, selectedFolderId, selectedCategory);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1E241E] border border-olive-sage/30 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-slate-800 dark:text-cream">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-olive-sage/20 bg-olive-light/30 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-olive-primary text-white">
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Move / Recategorize</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
                {file.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Target Folder Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Select Destination Folder
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-olive-sage/20 rounded-xl p-2 bg-slate-50 dark:bg-slate-900/60">
              {/* Root Level Option */}
              <button
                type="button"
                onClick={() => setSelectedFolderId(null)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                  selectedFolderId === null
                    ? 'bg-olive-primary text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-olive-light/60 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Home size={15} />
                  <span>Root Vault (Main Level)</span>
                </div>
                {selectedFolderId === null && <Check size={15} />}
              </button>

              {/* Folders List */}
              {activeFolders.map((folder) => {
                const isSelected = selectedFolderId === folder.id;
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-olive-primary text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-olive-light/60 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder size={15} style={{ color: folder.color || '#556B2F' }} />
                      <span className="truncate">{folder.name}</span>
                    </div>
                    {isSelected && <Check size={15} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Assignment Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              File Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categoriesList.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize flex items-center gap-1.5 transition-all border ${
                      isSelected
                        ? 'bg-olive-primary text-white border-olive-primary shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-olive-primary'
                    }`}
                  >
                    <Tag size={12} />
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-olive-sage/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-olive-primary text-white hover:bg-olive-dark shadow-md shadow-olive-primary/20 transition-all flex items-center gap-1.5"
            >
              <ArrowRightLeft size={14} />
              <span>Confirm Move</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
