import React from 'react';
import { FileItem, FolderItem } from '../types';
import { formatBytes, formatDate, getFormatBadgeConfig } from '../utils/formatters';
import {
  Info,
  X,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  HardDrive,
  Folder,
  FileText,
  ShieldCheck,
  Eye,
  MapPin,
  Tag,
  ArrowRightLeft,
  Copy
} from 'lucide-react';

interface ItemInfoModalProps {
  item: FileItem | FolderItem | null;
  itemType: 'file' | 'folder' | null;
  allFiles?: FileItem[];
  allFolders?: FolderItem[];
  onClose: () => void;
  onRename: (item: FileItem | FolderItem, type: 'file' | 'folder') => void;
  onDelete: (id: string, type: 'file' | 'folder') => void;
  onPreviewFile?: (file: FileItem) => void;
  onMoveFile?: (file: FileItem) => void;
  onCopyFile?: (file: FileItem) => void;
}

export const ItemInfoModal: React.FC<ItemInfoModalProps> = ({
  item,
  itemType,
  allFiles = [],
  allFolders = [],
  onClose,
  onRename,
  onDelete,
  onPreviewFile,
  onMoveFile,
  onCopyFile,
}) => {
  if (!item || !itemType) return null;

  const isFile = itemType === 'file';
  const file = isFile ? (item as FileItem) : null;
  const folder = !isFile ? (item as FolderItem) : null;
  const fmtBadge = file ? getFormatBadgeConfig(file.extension, file.category, file.mimeType) : null;

  // Resolve Parent Folder Name
  const parentFolder = item.parentFolderId
    ? allFolders.find((f) => f.id === item.parentFolderId)
    : null;
  const parentLocationName = parentFolder ? parentFolder.name : 'Root Vault / Main Dashboard';

  // Calculate folder stats if item is folder
  let folderFilesCount = 0;
  let folderTotalSize = 0;
  if (folder) {
    const containedFiles = allFiles.filter((f) => f.parentFolderId === folder.id && !f.isDeleted);
    folderFilesCount = containedFiles.length;
    folderTotalSize = containedFiles.reduce((acc, curr) => acc + (curr.size || 0), 0);
  }

  // Formatting date and time
  const createdDateObj = new Date(item.createdAt);
  const formattedDate = createdDateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = createdDateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-olive-sage/30 space-y-5 relative text-slate-800 dark:text-cream">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-olive-sage/20 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl text-white shadow-md flex items-center justify-center ${
              isFile ? 'bg-olive-primary' : 'bg-amber-600'
            }`}>
              {isFile ? <FileText size={22} /> : <Folder size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-olive-light dark:bg-slate-800 text-olive-dark dark:text-olive-sage font-extrabold text-[10px] uppercase tracking-wider border border-olive-sage/30">
                  {isFile ? `${file?.category} File` : 'Folder'}
                </span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-snug break-all mt-0.5">
                {item.name}
              </h3>
              {fmtBadge && (
                <div className="mt-1">
                  <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${fmtBadge.bgClass} ${fmtBadge.borderClass} ${fmtBadge.textClass}`}>
                    {fmtBadge.label}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-cream hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 text-xs">
          {/* Main Info Box */}
          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-olive-sage/20 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Tag size={14} className="text-olive-primary" />
                <span>Name</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-white truncate max-w-[220px]">
                {item.name}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <HardDrive size={14} className="text-olive-primary" />
                <span>{isFile ? 'File Size' : 'Folder Contents & Size'}</span>
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-cream">
                {isFile
                  ? formatBytes(file?.size || 0)
                  : `${formatBytes(folderTotalSize)} (${folderFilesCount} files)`}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar size={14} className="text-olive-primary" />
                <span>Created Date</span>
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formattedDate}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock size={14} className="text-olive-primary" />
                <span>Created Time</span>
              </span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {formattedTime}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin size={14} className="text-olive-primary" />
                <span>Location</span>
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                {parentLocationName}
              </span>
            </div>

            {isFile && (
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FileText size={14} className="text-olive-primary" />
                  <span>Extension / Type</span>
                </span>
                <span className="font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">
                  .{file?.extension} ({file?.mimeType || 'binary/stream'})
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Vault Encryption</span>
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span>256-Bit AES Client Encrypted</span>
              </span>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons: Rename & Delete */}
        <div className="pt-3 border-t border-olive-sage/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {isFile && onPreviewFile && (
            <button
              onClick={() => {
                onClose();
                onPreviewFile(file);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-olive-light dark:bg-slate-800 text-olive-dark dark:text-cream hover:bg-olive-sage/40 transition-colors flex items-center justify-center gap-1.5 shrink-0"
            >
              <Eye size={15} />
              <span>Preview</span>
            </button>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:ml-auto w-full sm:w-auto">
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
              {isFile && file && onMoveFile && (
                <button
                  onClick={() => {
                    onClose();
                    onMoveFile(file);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-olive-light dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowRightLeft size={15} className="text-olive-primary shrink-0" />
                  <span className="truncate">Move</span>
                </button>
              )}

              {isFile && file && onCopyFile && (
                <button
                  onClick={() => {
                    onClose();
                    onCopyFile(file);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-olive-light dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy size={15} className="text-olive-primary shrink-0" />
                  <span className="truncate">Duplicate</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
              <button
                onClick={() => {
                  onClose();
                  onRename(item, itemType);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-olive-primary hover:bg-olive-dark text-white shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Edit3 size={15} className="shrink-0" />
                <span className="truncate">Rename</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onDelete(item.id, itemType);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 size={15} className="shrink-0" />
                <span className="truncate">Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
