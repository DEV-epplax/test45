import React from 'react';
import { FileItem, FolderItem } from '../types';
import { formatBytes, formatDate, getFormatBadgeConfig } from '../utils/formatters';
import {
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  File,
  Folder,
  Star,
  Eye,
  Share2,
  Download,
  Trash2,
  Edit3,
  ShieldCheck,
  Info,
  ArrowRightLeft,
  Copy
} from 'lucide-react';

interface FileTableProps {
  folders: FolderItem[];
  files: FileItem[];
  onOpenFolder: (id: string) => void;
  onRenameFolder: (folder: FolderItem) => void;
  onDeleteFolder: (id: string) => void;
  onInfoFolder?: (folder: FolderItem) => void;
  onStarToggle: (id: string) => void;
  onPreview: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onDeleteFile: (id: string) => void;
  onDownload: (file: FileItem) => void;
  onInfoFile?: (file: FileItem) => void;
  onMoveFile?: (file: FileItem) => void;
  onCopyFile?: (file: FileItem) => void;
}

export const FileTable: React.FC<FileTableProps> = ({
  folders,
  files,
  onOpenFolder,
  onRenameFolder,
  onDeleteFolder,
  onInfoFolder,
  onStarToggle,
  onPreview,
  onShare,
  onRename,
  onDeleteFile,
  onDownload,
  onInfoFile,
  onMoveFile,
  onCopyFile,
}) => {
  const getFileIcon = (category: string) => {
    switch (category) {
      case 'image':
        return <ImageIcon className="text-emerald-600 dark:text-emerald-400 shrink-0" size={18} />;
      case 'document':
        return <FileText className="text-blue-600 dark:text-blue-400 shrink-0" size={18} />;
      case 'video':
        return <Film className="text-amber-600 dark:text-amber-400 shrink-0" size={18} />;
      case 'audio':
        return <Music className="text-purple-600 dark:text-purple-400 shrink-0" size={18} />;
      default:
        return <File className="text-slate-600 dark:text-slate-400 shrink-0" size={18} />;
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-olive-sage/30 overflow-hidden shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-cream/80 dark:bg-slate-800/80 border-b border-olive-sage/30 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3.5 pl-4">Name</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Size</th>
              <th className="p-3.5">Security</th>
              <th className="p-3.5">Date Added</th>
              <th className="p-3.5 text-right pr-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-olive-sage/20 text-slate-800 dark:text-cream">
            {/* Render Folders First */}
            {folders.map((folder) => (
              <tr
                key={folder.id}
                onClick={() => onOpenFolder(folder.id)}
                className="hover:bg-olive-light/40 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
              >
                <td className="p-3 pl-4 font-semibold flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg text-white flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: folder.color || '#556B2F' }}
                  >
                    <Folder size={16} />
                  </div>
                  <span className="truncate max-w-xs">{folder.name}</span>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-olive-light dark:bg-slate-800 text-olive-dark dark:text-olive-sage font-medium text-[11px]">
                    Folder
                  </span>
                </td>
                <td className="p-3 font-mono text-slate-400">--</td>
                <td className="p-3">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
                    <ShieldCheck size={13} />
                    <span>Vault Folder</span>
                  </span>
                </td>
                <td className="p-3 text-slate-500">{formatDate(folder.createdAt)}</td>
                <td className="p-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {onInfoFolder && (
                      <button
                        onClick={() => onInfoFolder(folder)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-olive-primary hover:bg-olive-light dark:hover:bg-slate-800 transition-colors"
                        title="Folder Details & Info"
                      >
                        <Info size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => onRenameFolder(folder)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-olive-primary hover:bg-olive-light dark:hover:bg-slate-800 transition-colors"
                      title="Rename folder"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => onDeleteFolder(folder.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Delete folder"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* Render Files */}
            {files.map((file) => {
              const fmtBadge = getFormatBadgeConfig(file.extension, file.category, file.mimeType);
              return (
                <tr
                  key={file.id}
                  className="hover:bg-olive-light/40 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  {/* File Name + Star */}
                  <td className="p-3 pl-4 font-semibold">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => onStarToggle(file.id)}
                        className={`p-1 rounded transition-colors ${
                          file.isStarred ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'
                        }`}
                        title={file.isStarred ? 'Unstar file' : 'Star file'}
                      >
                        <Star size={15} className={file.isStarred ? 'fill-amber-500' : ''} />
                      </button>
                      {getFileIcon(file.category)}
                      <div className="flex flex-col min-w-0">
                        <span
                          onClick={() => onPreview(file)}
                          className="cursor-pointer hover:text-olive-primary transition-colors truncate max-w-xs font-bold text-slate-800 dark:text-cream"
                          title={file.name}
                        >
                          {file.name}
                        </span>
                        <div className="mt-0.5">
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider border ${fmtBadge.bgClass} ${fmtBadge.borderClass} ${fmtBadge.textClass}`}>
                            {fmtBadge.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category Badge */}
                  <td className="p-3 capitalize font-medium text-slate-600 dark:text-slate-400">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${fmtBadge.bgClass} ${fmtBadge.borderClass} ${fmtBadge.textClass}`}>
                      {fmtBadge.label}
                    </span>
                  </td>

                  {/* Size */}
                  <td className="p-3 font-mono font-medium text-xs">{formatBytes(file.size)}</td>

                  {/* Security Status */}
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <ShieldCheck size={12} />
                      <span>AES-256</span>
                    </span>
                  </td>

                  {/* Date */}
                  <td className="p-3 text-slate-500 text-xs">{formatDate(file.createdAt)}</td>

                  {/* Action buttons - Rename & Delete inside Info modal */}
                  <td className="p-3 text-right pr-4">
                    <div className="flex items-center justify-end gap-1">
                      {onInfoFile && (
                        <button
                          onClick={() => onInfoFile(file)}
                          className="p-1.5 rounded-lg text-olive-primary bg-olive-light/60 dark:bg-slate-800 hover:bg-olive-sage/30 transition-colors flex items-center gap-1 text-xs font-bold"
                          title="File Info & Actions"
                        >
                          <Info size={15} />
                          <span className="text-[11px]">Info</span>
                        </button>
                      )}

                      <button
                        onClick={() => onPreview(file)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-olive-primary hover:bg-olive-light dark:hover:bg-slate-800 transition-colors"
                        title="Preview"
                      >
                        <Eye size={15} />
                      </button>

                      {onMoveFile && (
                        <button
                          onClick={() => onMoveFile(file)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-olive-primary hover:bg-olive-light dark:hover:bg-slate-800 transition-colors"
                          title="Move file"
                        >
                          <ArrowRightLeft size={15} />
                        </button>
                      )}

                      {onCopyFile && (
                        <button
                          onClick={() => onCopyFile(file)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-olive-primary hover:bg-olive-light dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Duplicate file"
                        >
                          <Copy size={15} />
                        </button>
                      )}

                      <button
                        onClick={() => onShare(file)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-olive-primary hover:bg-olive-light dark:hover:bg-slate-800 transition-colors"
                        title="Share link"
                      >
                        <Share2 size={15} />
                      </button>

                      <button
                        onClick={() => onDownload(file)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-olive-primary hover:bg-olive-light dark:hover:bg-slate-800 transition-colors"
                        title="Download"
                      >
                        <Download size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
