import React from 'react';
import { FileItem, FolderItem } from '../types';
import { Trash2, X, AlertTriangle, RotateCcw } from 'lucide-react';

interface DeactivateModalProps {
  item: FileItem | FolderItem | null;
  itemType: 'file' | 'folder' | null;
  onClose: () => void;
  onConfirmDeactivate: () => void;
}

export const DeactivateConfirmModal: React.FC<DeactivateModalProps> = ({
  item,
  itemType,
  onClose,
  onConfirmDeactivate,
}) => {
  if (!item || !itemType) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-md rounded-3xl p-6 shadow-2xl border border-red-500/30 space-y-4 relative text-slate-800 dark:text-cream">
        <div className="flex items-start justify-between border-b border-olive-sage/20 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                Delete {itemType === 'folder' ? 'Folder' : 'File'}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Move to Backup Bin (Can be restored anytime)
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

        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <p>
            Are you sure you want to delete <strong className="text-slate-900 dark:text-white break-all">"{item.name}"</strong>?
          </p>
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2 text-amber-700 dark:text-amber-300">
            <RotateCcw size={16} className="shrink-0 mt-0.5 text-amber-500" />
            <span>
              This item will be hidden from your main screen, but you can restore it anytime or permanently purge it from <strong>Settings &gt; Backup & Restore</strong>.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-olive-sage/20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirmDeactivate();
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md transition-all flex items-center gap-1.5"
          >
            <Trash2 size={15} />
            <span>Delete {itemType === 'folder' ? 'Folder' : 'File'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
