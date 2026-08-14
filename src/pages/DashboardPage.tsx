import React, { useState, useMemo, useEffect } from 'react';
import { getFileContentLocal, saveFileContentLocal } from '../services/vaultService';
import { auth } from '../firebase';
import {
  FileItem,
  FolderItem,
  UserProfile,
  CategoryType,
  SortOption,
  ViewMode,
  PageRoute,
  AppBranding,
  DEFAULT_BRANDING
} from '../types';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AdminDashboardPage } from './AdminDashboardPage';
import { StorageBar } from '../components/StorageBar';
import { CategoryTabs, EmptyCategoryNotice } from '../components/CategoryTabs';
import { FileGrid } from '../components/FileGrid';
import { FileTable } from '../components/FileTable';
import { FileCard } from '../components/FileCard';
import { FABModal } from '../components/FABModal';
import { FilePreviewModal, ShareModal } from '../components/FilePreviewModal';
import { SettingsModal, HelpModal } from '../components/SettingsHelpModal';
import { RenameModal } from '../components/RenameModal';
import { DeactivateConfirmModal } from '../components/DeactivateConfirmModal';
import { ItemInfoModal } from '../components/ItemInfoModal';
import { MoveItemModal } from '../components/MoveItemModal';
import { ChevronRight, ChevronLeft, Folder, Home, ArrowLeft, Clock, AlertTriangle } from 'lucide-react';
import { generateHashHex, formatBytes } from '../utils/formatters';
import {
  getCurrentUserId,
  subscribeToUserFolders,
  subscribeToUserFiles,
  addFolderToFirestore,
  addFileToFirestore,
  toggleFileStarInFirestore,
  renameFileInFirestore,
  renameFolderInFirestore,
  softDeleteFileInFirestore,
  softDeleteFolderInFirestore,
  restoreFileInFirestore,
  restoreFolderInFirestore,
  permanentDeleteFileFromFirestore,
  permanentDeleteFolderFromFirestore,
  moveFileInFirestore,
} from '../services/vaultService';

interface DashboardPageProps {
  user: UserProfile;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onNavigate: (route: PageRoute) => void;
  showToast: (msg: string) => void;
  initialFolders: FolderItem[];
  initialFiles: FileItem[];
  branding?: AppBranding;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  darkMode,
  onToggleDarkMode,
  onLogout,
  onNavigate,
  showToast,
  initialFolders,
  initialFiles,
  branding = DEFAULT_BRANDING,
}) => {
  // Active user identifiers for Firestore scoping
  const activeUserId = useMemo(() => getCurrentUserId(user.email, user.id), [user]);
  const userIdentifiers = useMemo(() => {
    return Array.from(new Set([
      auth.currentUser?.uid,
      user.id,
      user.email,
      user.email?.toLowerCase(),
      user.id?.toLowerCase()
    ].filter(Boolean))) as string[];
  }, [user]);

  // Main data states
  const [userProfile, setUserProfile] = useState<UserProfile>(user);
  const [folders, setFolders] = useState<FolderItem[]>(initialFolders);
  const [files, setFiles] = useState<FileItem[]>(initialFiles);

  // Subscribe to user's real-time Firestore data
  useEffect(() => {
    const unsubFolders = subscribeToUserFolders(userIdentifiers, (remoteFolders) => {
      setFolders(remoteFolders);
    });

    const unsubFiles = subscribeToUserFiles(userIdentifiers, (remoteFiles) => {
      setFiles(remoteFiles);
    });

    return () => {
      unsubFolders();
      unsubFiles();
    };
  }, [userIdentifiers]);

  // Filter & Navigation states
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<CategoryType>('All');
  const [sortOption, setSortOption] = useState<SortOption>('date-newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customCategories, setCustomCategories] = useState<string[]>(['Code', 'Archives']);

  // Modal states
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [moveTargetFile, setMoveTargetFile] = useState<FileItem | null>(null);

  // Recent Files Tracking
  const [recentAccessedIds, setRecentAccessedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`recent_accessed_${activeUserId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const recordFileAccess = (fileId: string) => {
    setRecentAccessedIds((prev) => {
      const filtered = prev.filter((id) => id !== fileId);
      const updated = [fileId, ...filtered].slice(0, 5);
      try {
        localStorage.setItem(`recent_accessed_${activeUserId}`, JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving recent accessed files', err);
      }
      return updated;
    });
  };

  const recentFiles = useMemo(() => {
    const active = files.filter((f) => !f.isDeleted && !f.isDeactivated);
    if (active.length === 0) return [];

    // Map recently accessed IDs to actual active files
    const accessedFiles = recentAccessedIds
      .map((id) => active.find((f) => f.id === id))
      .filter((f): f is FileItem => !!f);

    // Get recently uploaded files (sorted by createdAt)
    const uploadedFiles = [...active]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Combine both sets (accessed first, then newly uploaded) avoiding duplicates
    const combined: FileItem[] = [];
    const seenIds = new Set<string>();

    for (const f of accessedFiles) {
      if (!seenIds.has(f.id)) {
        combined.push(f);
        seenIds.add(f.id);
      }
    }

    for (const f of uploadedFiles) {
      if (!seenIds.has(f.id)) {
        combined.push(f);
        seenIds.add(f.id);
      }
    }

    return combined.slice(0, 5);
  }, [files, recentAccessedIds]);

  const handleCreateCategory = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    if (!customCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCustomCategories((prev) => [...prev, trimmed]);
      showToast(`Created new category "${trimmed}"`);
    }
  };

  const handleMoveFile = (file: FileItem) => {
    setMoveTargetFile(file);
  };

  const handleConfirmMoveFile = async (
    targetFile: FileItem,
    targetFolderId: string | null,
    targetCategory?: string
  ) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === targetFile.id
          ? { ...f, parentFolderId: targetFolderId, category: targetCategory || f.category }
          : f
      )
    );

    const targetFolderName = targetFolderId
      ? folders.find((f) => f.id === targetFolderId)?.name || 'Folder'
      : 'Root Vault';

    showToast(`Moved "${targetFile.name}" to ${targetFolderName}`);

    try {
      await moveFileInFirestore(targetFile.id, targetFolderId, targetCategory);
    } catch (err) {
      console.error('Firestore move file error:', err);
    }
  };

  const handleCopyFile = async (fileToCopy: FileItem) => {
    const totalLimitBytes = userProfile.storageLimitMB * 1024 * 1024;
    const currentUsedBytes = files.reduce((acc, f) => acc + f.size, 0);

    if (currentUsedBytes + fileToCopy.size > totalLimitBytes) {
      showToast(`Error: Cannot duplicate file. Storage quota of ${userProfile.storageLimitMB} MB exceeded!`);
      return;
    }

    const nameParts = fileToCopy.name.split('.');
    let copyName = '';
    if (nameParts.length > 1) {
      const ext = nameParts.pop();
      copyName = `${nameParts.join('.')} (Duplicate).${ext}`;
    } else {
      copyName = `${fileToCopy.name} (Duplicate)`;
    }

    const newId = `dup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newCopy: FileItem = {
      ...fileToCopy,
      id: newId,
      name: copyName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      encryptedHash: generateHashHex(copyName + Date.now()),
    };

    // Duplicate local binary/blob content if it exists
    try {
      const originalBlob = await getFileContentLocal(fileToCopy.id);
      if (originalBlob) {
        await saveFileContentLocal(newId, originalBlob);
      }
    } catch (e) {
      console.error('Error duplicating local content:', e);
    }

    setFiles((prev) => [newCopy, ...prev]);
    showToast(`Created duplicate "${copyName}"`);

    try {
      await addFileToFirestore(newCopy, activeUserId);
    } catch (err) {
      console.error('Firestore duplicate file error:', err);
    }
  };

  // Rename & Deactivate dialog states
  const [renameTarget, setRenameTarget] = useState<{
    item: FileItem | FolderItem;
    type: 'file' | 'folder';
  } | null>(null);

  const [deactivateTarget, setDeactivateTarget] = useState<{
    item: FileItem | FolderItem;
    type: 'file' | 'folder';
  } | null>(null);

  const [infoTarget, setInfoTarget] = useState<{
    item: FileItem | FolderItem;
    type: 'file' | 'folder';
  } | null>(null);

  const handleInfoFile = (file: FileItem) => {
    setInfoTarget({ item: file, type: 'file' });
  };

  const handleInfoFolder = (folder: FolderItem) => {
    setInfoTarget({ item: folder, type: 'folder' });
  };

  // Active vs Deactivated items separation
  const activeFolders = useMemo(() => folders.filter((f) => !f.isDeleted), [folders]);
  const activeFiles = useMemo(() => files.filter((f) => !f.isDeleted && !f.isDeactivated), [files]);
  const deactivatedFolders = useMemo(() => folders.filter((f) => Boolean(f.isDeleted)), [folders]);
  const deactivatedFiles = useMemo(() => files.filter((f) => Boolean(f.isDeleted)), [files]);

  // Compute current folder hierarchy breadcrumbs
  const currentFolder = useMemo(() => {
    return activeFolders.find((f) => f.id === currentFolderId) || null;
  }, [activeFolders, currentFolderId]);

  // Filter & Sort Engine logic
  const filteredFolders = useMemo(() => {
    // Show folders ONLY when viewing 'All' category and not in category tabs like Starred/Documents
    if (activeCategory !== 'All') return [];

    let result = activeFolders.filter((f) => f.parentFolderId === currentFolderId);

    if (searchQuery.trim()) {
      result = activeFolders.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
    }

    return result;
  }, [activeFolders, currentFolderId, activeCategory, searchQuery]);

  const filteredFiles = useMemo(() => {
    let result = activeFiles;

    // 1. Folder location filter (only when browsing 'All' category without search query)
    if (!searchQuery.trim() && activeCategory === 'All') {
      result = result.filter((f) => f.parentFolderId === currentFolderId);
    }

    // 2. Category tab filter
    if (activeCategory === 'Starred') {
      result = result.filter((f) => f.isStarred);
    } else if (activeCategory === 'Documents') {
      result = result.filter((f) => f.category === 'document');
    } else if (activeCategory === 'Images') {
      result = result.filter((f) => f.category === 'image');
    } else if (activeCategory === 'Videos') {
      result = result.filter((f) => f.category === 'video');
    } else if (activeCategory === 'Audios') {
      result = result.filter((f) => f.category === 'audio');
    } else if (activeCategory === 'Other') {
      result = result.filter((f) => f.category === 'other');
    } else if (activeCategory !== 'All') {
      result = result.filter((f) => f.category.toLowerCase() === activeCategory.toLowerCase());
    }

    // 3. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.extension.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
      );
    }

    // 4. Sorting engine
    return [...result].sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'date-newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'size-desc':
          return b.size - a.size;
        default:
          return 0;
      }
    });
  }, [activeFiles, currentFolderId, activeCategory, searchQuery, sortOption]);

  // File action handlers with Firestore synchronization
  const handleStarToggle = async (id: string) => {
    const target = files.find((f) => f.id === id);
    if (!target) return;
    const updated = !target.isStarred;
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, isStarred: updated } : f)));
    showToast(updated ? `Starred "${target.name}"` : `Unstarred "${target.name}"`);
    try {
      await toggleFileStarInFirestore(id, updated);
    } catch (err) {
      console.error('Firestore star toggle error:', err);
    }
  };

  const handleRenameFile = (file: FileItem) => {
    setRenameTarget({ item: file, type: 'file' });
  };

  const handleRenameFolder = (folder: FolderItem) => {
    setRenameTarget({ item: folder, type: 'folder' });
  };

  const handleDeleteFile = (id: string) => {
    const target = files.find((f) => f.id === id);
    if (target) setDeactivateTarget({ item: target, type: 'file' });
  };

  const handleDeleteFolder = (id: string) => {
    const target = folders.find((f) => f.id === id);
    if (target) setDeactivateTarget({ item: target, type: 'folder' });
  };

  const executeSaveRename = async (newName: string) => {
    if (!renameTarget) return;
    const { item, type } = renameTarget;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === item.name) return;

    if (type === 'file') {
      setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, name: trimmed } : f)));
      showToast(`Renamed file to "${trimmed}"`);
      try {
        await renameFileInFirestore(item.id, trimmed);
      } catch (err) {
        console.error('Firestore rename file error:', err);
      }
    } else {
      setFolders((prev) => prev.map((f) => (f.id === item.id ? { ...f, name: trimmed } : f)));
      showToast(`Renamed folder to "${trimmed}"`);
      try {
        await renameFolderInFirestore(item.id, trimmed);
      } catch (err) {
        console.error('Firestore rename folder error:', err);
      }
    }
    setRenameTarget(null);
  };

  const executeDeactivate = async () => {
    if (!deactivateTarget) return;
    const { item, type } = deactivateTarget;

    if (type === 'file') {
      setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, isDeleted: true } : f)));
      showToast(`Deleted "${item.name}". Moved to Backup Bin.`);
      try {
        await softDeleteFileInFirestore(item.id);
      } catch (err) {
        console.error('Firestore soft delete file error:', err);
      }
    } else {
      setFolders((prev) => prev.map((f) => (f.id === item.id ? { ...f, isDeleted: true } : f)));
      if (currentFolderId === item.id) setCurrentFolderId(null);
      showToast(`Deleted folder "${item.name}". Moved to Backup Bin.`);
      try {
        await softDeleteFolderInFirestore(item.id);
      } catch (err) {
        console.error('Firestore soft delete folder error:', err);
      }
    }
    setDeactivateTarget(null);
  };

  const handleRestoreFile = async (id: string) => {
    const target = files.find((f) => f.id === id);
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, isDeleted: false } : f)));
    if (target) showToast(`Restored "${target.name}" to active vault.`);
    try {
      await restoreFileInFirestore(id);
    } catch (err) {
      console.error('Firestore restore file error:', err);
    }
  };

  const handleRestoreFolder = async (id: string) => {
    const target = folders.find((f) => f.id === id);
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, isDeleted: false } : f)));
    if (target) showToast(`Restored folder "${target.name}" to active vault.`);
    try {
      await restoreFolderInFirestore(id);
    } catch (err) {
      console.error('Firestore restore folder error:', err);
    }
  };

  const handlePermanentDeleteFile = async (id: string) => {
    const target = files.find((f) => f.id === id);
    if (target) {
      setFiles((prev) => prev.filter((f) => f.id !== id));
      showToast(`Permanently deleted "${target.name}".`);
      try {
        await permanentDeleteFileFromFirestore(id);
      } catch (err) {
        console.error('Firestore permanent delete file error:', err);
      }
    }
  };

  const handlePermanentDeleteFolder = async (id: string) => {
    const target = folders.find((f) => f.id === id);
    if (target) {
      setFolders((prev) => prev.filter((f) => f.id !== id));
      showToast(`Permanently deleted folder "${target.name}".`);
      try {
        await permanentDeleteFolderFromFirestore(id, activeUserId);
      } catch (err) {
        console.error('Firestore permanent delete folder error:', err);
      }
    }
  };

  const handleEmptyBin = async () => {
    const filesToPurge = deactivatedFiles;
    const foldersToPurge = deactivatedFolders;

    if (filesToPurge.length === 0 && foldersToPurge.length === 0) return;

    // Immediately update local React state
    setFiles((prev) => prev.filter((f) => !f.isDeleted));
    setFolders((prev) => prev.filter((f) => !f.isDeleted));

    showToast('Backup bin cleared permanently.');

    // Delete permanently from Firestore
    for (const file of filesToPurge) {
      try {
        await permanentDeleteFileFromFirestore(file.id);
      } catch (err) {
        console.error('Error emptying file from bin:', err);
      }
    }

    for (const folder of foldersToPurge) {
      try {
        await permanentDeleteFolderFromFirestore(folder.id, activeUserId);
      } catch (err) {
        console.error('Error emptying folder from bin:', err);
      }
    }
  };

  const handleDownloadFile = async (file: FileItem) => {
    if (file.isDeactivated) {
      showToast(`This archive "${file.name}" has been deactivated by the Admin and cannot be downloaded.`, 'error');
      return;
    }
    showToast(`Decrypting & downloading "${file.name}"...`);
    const blob = await getFileContentLocal(file.id);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } else if (file.url) {
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.name;
      a.click();
    } else {
      const fallbackBlob = new Blob([file.contentPreview || 'IFFL Encrypted Storage Content'], {
        type: file.mimeType,
      });
      const url = URL.createObjectURL(fallbackBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handlePreviewFile = (file: FileItem) => {
    if (file.isDeactivated) {
      showToast(`This archive "${file.name}" has been deactivated by the Admin and cannot be viewed.`, 'error');
      return;
    }
    recordFileAccess(file.id);
    setPreviewFile(file);
  };

  const handleUploadFile = async (newFile: FileItem) => {
    setFiles((prev) => [newFile, ...prev]);
    try {
      await addFileToFirestore(newFile, activeUserId);
    } catch (err) {
      console.error('Firestore upload file error:', err);
    }
  };

  const handleCreateFolder = async (newFolder: FolderItem) => {
    setFolders((prev) => [newFolder, ...prev]);
    try {
      await addFolderToFirestore(newFolder, activeUserId);
    } catch (err) {
      console.error('Firestore create folder error:', err);
    }
  };

  const isEmpty = filteredFolders.length === 0 && filteredFiles.length === 0;

  const totalLimitBytes = userProfile.storageLimitMB * 1024 * 1024;
  const totalUsedBytes = files.reduce((acc, f) => acc + f.size, 0);
  const usedPercentage = Math.min(100, (totalUsedBytes / totalLimitBytes) * 100);
  const isStorageFull = totalUsedBytes >= totalLimitBytes;

  return (
    <div className="min-h-screen bg-cream dark:bg-slate-950 text-slate-900 dark:text-cream transition-colors duration-300 flex flex-col relative pb-20">
      {/* Top Navigation Bar */}
      <Navbar
        user={userProfile}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onLogout={onLogout}
        onNavigate={onNavigate}
        isAdminView={isAdminView}
        onToggleAdminView={() => setIsAdminView(!isAdminView)}
        branding={branding}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {isAdminView && userProfile.role === 'Admin' ? (
          <AdminDashboardPage
            darkMode={darkMode}
            showToast={showToast}
            branding={branding}
          />
        ) : (
          <>
            {/* Storage Full Banner */}
            {isStorageFull && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex flex-col sm:flex-row items-start gap-3 shadow-sm animate-pulse">
            <div className="p-2 rounded-xl bg-red-500/10 shrink-0 self-start sm:self-center">
              <AlertTriangle size={18} />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Critical Alert: Encrypted Storage Quota Exceeded!
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed break-words">
                You have completely consumed your allocated free storage of{' '}
                <strong>{userProfile.storageLimitMB} MB</strong> ({formatBytes(totalUsedBytes)} used). New file uploads, note creations, and file duplications are blocked. Please free up space by permanently deleting items from your backup bin or removing unused active files.
              </p>
            </div>
          </div>
        )}

        {/* Storage Analytics Bar */}
        <StorageBar files={files} storageLimitMB={userProfile.storageLimitMB} />

        {/* Recent Files Section */}
        {recentFiles.length > 0 && !currentFolderId && !searchQuery && activeCategory === 'All' && (
          <div className="space-y-4 p-5 rounded-3xl bg-white/40 dark:bg-slate-900/40 border border-olive-sage/20 backdrop-blur-sm shadow-md animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-olive-primary/10 text-olive-primary dark:text-olive-sage">
                  <Clock size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-cream">
                  Recent Vault Files
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline mr-2">
                  Recently decrypted or uploaded
                </span>
                <button
                  onClick={() => {
                    const el = document.getElementById('recent-slider');
                    if (el) el.scrollBy({ left: -260, behavior: 'smooth' });
                  }}
                  className="p-1 rounded-lg hover:bg-olive-primary/10 text-slate-500 hover:text-olive-primary active:scale-95 transition-all border border-olive-sage/20 cursor-pointer"
                  title="Scroll Left"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('recent-slider');
                    if (el) el.scrollBy({ left: 260, behavior: 'smooth' });
                  }}
                  className="p-1 rounded-lg hover:bg-olive-primary/10 text-slate-500 hover:text-olive-primary active:scale-95 transition-all border border-olive-sage/20 cursor-pointer"
                  title="Scroll Right"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            
            {/* Horizontal Scroll Slider of File Cards */}
            <div 
              id="recent-slider"
              className="flex gap-4 overflow-x-auto pb-3 scroll-smooth snap-x snap-mandatory scrollbar-thin scrollbar-thumb-olive-primary/10 scrollbar-track-transparent select-none"
              style={{ scrollbarWidth: 'thin' }}
            >
              {recentFiles.map((file) => (
                <div 
                  key={`recent-${file.id}`} 
                  className="w-full sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] min-w-[220px] shrink-0 snap-start"
                >
                  <FileCard
                    file={file}
                    onStarToggle={handleStarToggle}
                    onPreview={(f) => {
                      recordFileAccess(f.id);
                      setPreviewFile(f);
                    }}
                    onShare={setShareFile}
                    onRename={handleRenameFile}
                    onDelete={handleDeleteFile}
                    onDownload={(f) => {
                      recordFileAccess(f.id);
                      handleDownloadFile(f);
                    }}
                    onInfo={handleInfoFile}
                    onMoveFile={handleMoveFile}
                    onCopyFile={handleCopyFile}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Breadcrumb Navigation if inside folder or searching */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <button
              onClick={() => {
                setCurrentFolderId(null);
                setSearchQuery('');
              }}
              className="flex items-center gap-1.5 hover:text-olive-primary transition-colors"
            >
              <Home size={14} />
              <span>Root Vault</span>
            </button>

            {currentFolder && (
              <>
                <ChevronRight size={14} className="text-slate-400" />
                <span className="flex items-center gap-1.5 text-olive-primary dark:text-olive-sage font-bold">
                  <Folder size={14} />
                  <span>{currentFolder.name}</span>
                </span>
              </>
            )}

            {searchQuery && (
              <>
                <ChevronRight size={14} className="text-slate-400" />
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  Search: "{searchQuery}"
                </span>
              </>
            )}
          </div>

          {currentFolderId && (
            <button
              onClick={() => setCurrentFolderId(null)}
              className="px-3 py-1 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-olive-sage/30 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-olive-light dark:hover:bg-slate-700 flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              <span>Back to Root</span>
            </button>
          )}
        </div>

        {/* Category Tabs & Sorting Bar */}
        <CategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          sortOption={sortOption}
          onSortChange={setSortOption}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalItemsCount={files.length}
          filteredItemsCount={filteredFiles.length + filteredFolders.length}
          customCategories={customCategories}
          onCreateCategory={handleCreateCategory}
        />

        {/* Content Display: Grid vs Table vs Empty State */}
        {isEmpty ? (
          <EmptyCategoryNotice
            categoryName={
              searchQuery
                ? `Search: "${searchQuery}"`
                : activeCategory
            }
            onClearFilters={
              activeCategory !== 'All' || searchQuery
                ? () => {
                    setActiveCategory('All');
                    setSearchQuery('');
                  }
                : undefined
            }
          />
        ) : viewMode === 'grid' ? (
          <FileGrid
            folders={filteredFolders}
            files={filteredFiles}
            onOpenFolder={(id) => setCurrentFolderId(id)}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onInfoFolder={handleInfoFolder}
            onStarToggle={handleStarToggle}
            onPreview={handlePreviewFile}
            onShare={(file) => setShareFile(file)}
            onRename={handleRenameFile}
            onDeleteFile={handleDeleteFile}
            onDownload={(file) => {
              recordFileAccess(file.id);
              handleDownloadFile(file);
            }}
            onInfoFile={handleInfoFile}
            onMoveFile={handleMoveFile}
            onCopyFile={handleCopyFile}
          />
        ) : (
          <FileTable
            folders={filteredFolders}
            files={filteredFiles}
            onOpenFolder={(id) => setCurrentFolderId(id)}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onInfoFolder={handleInfoFolder}
            onStarToggle={handleStarToggle}
            onPreview={handlePreviewFile}
            onShare={(file) => setShareFile(file)}
            onRename={handleRenameFile}
            onDeleteFile={handleDeleteFile}
            onDownload={(file) => {
              recordFileAccess(file.id);
              handleDownloadFile(file);
            }}
            onInfoFile={handleInfoFile}
            onMoveFile={handleMoveFile}
            onCopyFile={handleCopyFile}
          />
        )}
          </>
        )}

        {/* Global Footer */}
        <Footer branding={branding} />
      </main>

      {/* Floating Action Button (FAB) at Fixed Bottom-Left */}
      {!isAdminView && (
        <FABModal
          currentFolderId={currentFolderId}
          onUploadFile={handleUploadFile}
          onCreateFolder={handleCreateFolder}
          showToast={showToast}
          files={files}
          storageLimitMB={userProfile.storageLimitMB}
        />
      )}

      {/* Security Status Sub-Overlay at Bottom Right */}
      {!isAdminView && (
        <div className="fixed bottom-6 right-6 hidden sm:flex items-center gap-2 bg-[#1E241E] text-white px-4 py-2 rounded-full text-xs font-semibold tracking-wide shadow-xl border border-white/10 z-30">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span>AES-256 ENCRYPTION ACTIVE</span>
        </div>
      )}

      {/* Modals */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onShare={(file) => {
          setPreviewFile(null);
          setShareFile(file);
        }}
        onDownload={handleDownloadFile}
        showToast={showToast}
      />

      <ShareModal
        file={shareFile}
        onClose={() => setShareFile(null)}
        showToast={showToast}
      />

      <SettingsModal
        user={userProfile}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateUser={(updated) => setUserProfile((prev) => ({ ...prev, ...updated }))}
        showToast={showToast}
        deletedFiles={deactivatedFiles}
        deletedFolders={deactivatedFolders}
        onRestoreFile={handleRestoreFile}
        onRestoreFolder={handleRestoreFolder}
        onPermanentDeleteFile={handlePermanentDeleteFile}
        onPermanentDeleteFolder={handlePermanentDeleteFolder}
        onEmptyBin={handleEmptyBin}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <RenameModal
        item={renameTarget?.item || null}
        itemType={renameTarget?.type || null}
        onClose={() => setRenameTarget(null)}
        onSave={executeSaveRename}
      />

      <DeactivateConfirmModal
        item={deactivateTarget?.item || null}
        itemType={deactivateTarget?.type || null}
        onClose={() => setDeactivateTarget(null)}
        onConfirmDeactivate={executeDeactivate}
      />

      <ItemInfoModal
        item={infoTarget?.item || null}
        itemType={infoTarget?.type || null}
        allFiles={files}
        allFolders={folders}
        onClose={() => setInfoTarget(null)}
        onRename={(item, type) => setRenameTarget({ item, type })}
        onDelete={(id, type) => {
          const target =
            type === 'file' ? files.find((f) => f.id === id) : folders.find((f) => f.id === id);
          if (target) setDeactivateTarget({ item: target, type });
        }}
        onPreviewFile={handlePreviewFile}
        onMoveFile={handleMoveFile}
        onCopyFile={handleCopyFile}
      />

      <MoveItemModal
        file={moveTargetFile}
        folders={activeFolders}
        customCategories={customCategories}
        onClose={() => setMoveTargetFile(null)}
        onConfirmMove={handleConfirmMoveFile}
      />
    </div>
  );
};
