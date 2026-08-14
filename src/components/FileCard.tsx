import React, { useState, useRef, useEffect } from 'react';
import { FileItem, FolderItem } from '../types';
import { getFileContentLocal } from '../services/vaultService';
import { formatBytes, formatDate, getFormatBadgeConfig } from '../utils/formatters';
import {
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  File,
  Folder,
  Star,
  MoreVertical,
  Eye,
  Share2,
  Download,
  ShieldCheck,
  Lock,
  Info,
  Edit3,
  Trash2,
  ArrowRightLeft,
  Copy
} from 'lucide-react';

interface FileCardProps {
  file: FileItem;
  onStarToggle: (id: string) => void;
  onPreview: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onDelete: (id: string) => void;
  onDownload: (file: FileItem) => void;
  onInfo?: (file: FileItem) => void;
  onMoveFile?: (file: FileItem) => void;
  onCopyFile?: (file: FileItem) => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  onStarToggle,
  onPreview,
  onShare,
  onRename,
  onDelete,
  onDownload,
  onInfo,
  onMoveFile,
  onCopyFile,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const [localThumb, setLocalThumb] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl = '';
    if (file.category === 'image') {
      getFileContentLocal(file.id).then((blob) => {
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setLocalThumb(objectUrl);
        }
      });
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.id, file.category]);


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fmtBadge = getFormatBadgeConfig(file.extension, file.category, file.mimeType);

  const getFileIcon = () => {
    switch (file.category) {
      case 'image':
        return <ImageIcon className="text-emerald-600 dark:text-emerald-400" size={24} />;
      case 'document':
        return <FileText className="text-blue-600 dark:text-blue-400" size={24} />;
      case 'video':
        return <Film className="text-amber-600 dark:text-amber-400" size={24} />;
      case 'audio':
        return <Music className="text-purple-600 dark:text-purple-400" size={24} />;
      default:
        return <File className="text-slate-600 dark:text-slate-400" size={24} />;
    }
  };

  return (
    <div
      onClick={() => onPreview(file)}
      className={`group glass-panel rounded-2xl p-4 border border-olive-sage/30 hover:border-olive-primary transition-all duration-300 shadow-sm hover:shadow-lg flex flex-col justify-between relative cursor-pointer ${menuOpen ? 'z-50' : ''}`}
    >
      {/* Top action row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 shadow-inner shrink-0">
          {getFileIcon()}
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Info Button */}
          {onInfo && (
            <button
              onClick={() => onInfo(file)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-olive-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="File Information"
            >
              <Info size={16} />
            </button>
          )}

          {/* Star Button */}
          <button
            onClick={() => onStarToggle(file.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              file.isStarred
                ? 'text-amber-500 hover:bg-amber-500/10'
                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={file.isStarred ? 'Unstar file' : 'Star file'}
          >
            <Star size={16} className={file.isStarred ? 'fill-amber-500' : ''} />
          </button>

          {/* Context Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-cream hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="More actions"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 w-48 rounded-xl shadow-xl bg-white dark:bg-[#1E241E] border border-olive-sage/30 p-1.5 z-50 text-xs font-medium space-y-0.5 text-slate-800 dark:text-cream">
                {onInfo && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onInfo(file);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-olive-light/60 dark:hover:bg-slate-800 flex items-center gap-2 text-olive-primary dark:text-olive-sage font-bold"
                  >
                    <Info size={15} />
                    <span>File Info & Actions</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onPreview(file);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-olive-light/60 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <Eye size={14} className="text-slate-500" />
                  <span>Preview File</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onShare(file);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-olive-light/60 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <Share2 size={14} className="text-slate-500" />
                  <span>Share Encrypted Link</span>
                </button>

                {onMoveFile && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onMoveFile(file);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-olive-light/60 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                  >
                    <ArrowRightLeft size={14} className="text-olive-primary" />
                    <span>Move File</span>
                  </button>
                )}

                {onCopyFile && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onCopyFile(file);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-olive-light/60 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <Copy size={14} className="text-olive-primary" />
                    <span>Duplicate File</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDownload(file);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-olive-light/60 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <Download size={14} className="text-slate-500" />
                  <span>Download File</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle preview thumbnail if image/video */}
      {file.category === 'image' && (
        <div
          onClick={() => onPreview(file)}
          className="w-full h-28 mb-3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer relative group/img border border-olive-sage/20"
        >
          <img
            src={localThumb || file.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop'}
            alt={file.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop';
            }}
            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
            <Eye size={20} />
          </div>
        </div>
      )}

      {/* Title & Format Badge */}
      <div className="space-y-1.5">
        <h4
          onClick={() => onPreview(file)}
          className="font-bold text-sm text-slate-800 dark:text-cream truncate cursor-pointer hover:text-olive-primary transition-colors"
          title={file.name}
        >
          {file.name}
        </h4>

        {/* Format Badge with distinct background color */}
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide border ${fmtBadge.bgClass} ${fmtBadge.borderClass} ${fmtBadge.textClass}`}>
            {fmtBadge.label}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-0.5">
          <span className="font-mono font-medium">{formatBytes(file.size)}</span>
          <span>{formatDate(file.createdAt).split(',')[0]}</span>
        </div>
      </div>

      {/* Security badge at bottom */}
      <div className="mt-3 pt-2 border-t border-olive-sage/20 flex items-center justify-between text-[11px] text-olive-dark dark:text-olive-sage font-medium">
        <div className="flex items-center gap-1">
          <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
          <span>Encrypted</span>
        </div>
        <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-cream/80 dark:bg-slate-800 border border-olive-sage/30">
          {file.extension}
        </span>
      </div>
    </div>
  );
};

interface FolderCardProps {
  folder: FolderItem;
  onOpenFolder: (id: string) => void;
  onRenameFolder: (folder: FolderItem) => void;
  onDeleteFolder: (id: string) => void;
  onInfoFolder?: (folder: FolderItem) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  onOpenFolder,
  onRenameFolder,
  onDeleteFolder,
  onInfoFolder,
}) => {
  return (
    <div
      onClick={() => onOpenFolder(folder.id)}
      className="group glass-panel rounded-2xl p-4 border border-olive-sage/30 hover:border-olive-primary transition-all duration-300 shadow-sm hover:shadow-lg cursor-pointer flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div
          className="p-2.5 rounded-xl text-white shadow-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: folder.color || '#556B2F' }}
        >
          <Folder size={22} className="fill-white/30" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-cream group-hover:text-olive-primary transition-colors truncate max-w-[140px]">
            {folder.name}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {formatDate(folder.createdAt).split(',')[0]}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
        {onInfoFolder ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInfoFolder(folder);
            }}
            className="p-1.5 rounded-lg text-olive-primary bg-olive-light/60 dark:bg-slate-800 hover:bg-olive-sage/40 transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Folder Info & Actions"
          >
            <Info size={15} />
            <span className="text-[11px]">Info</span>
          </button>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRenameFolder(folder);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-olive-primary hover:bg-olive-light/60 dark:hover:bg-slate-800 transition-colors"
              title="Rename Folder"
            >
              <Edit3 size={15} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFolder(folder.id);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
              title="Delete Folder"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
