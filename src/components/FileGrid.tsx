import React from 'react';
import { FileItem, FolderItem } from '../types';
import { FileCard, FolderCard } from './FileCard';
import { Folder, FileText } from 'lucide-react';

interface FileGridProps {
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

export const FileGrid: React.FC<FileGridProps> = ({
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
  return (
    <div className="space-y-6">
      {/* Folders Section if any exist */}
      {folders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <Folder size={14} className="text-olive-primary" />
            <span>Folders ({folders.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onOpenFolder={onOpenFolder}
                onRenameFolder={onRenameFolder}
                onDeleteFolder={onDeleteFolder}
                onInfoFolder={onInfoFolder}
              />
            ))}
          </div>
        </div>
      )}

      {/* Files Section if any exist */}
      {files.length > 0 && (
        <div className="space-y-3">
          {folders.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pt-2">
              <FileText size={14} className="text-olive-primary" />
              <span>Files ({files.length})</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onStarToggle={onStarToggle}
                onPreview={onPreview}
                onShare={onShare}
                onRename={onRename}
                onDelete={onDeleteFile}
                onDownload={onDownload}
                onInfo={onInfoFile}
                onMoveFile={onMoveFile}
                onCopyFile={onCopyFile}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
