import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  subscribeToAllUsers,
  subscribeToAllFiles,
  subscribeToAllFolders,
  updateUserStatusInFirestore,
  updateUserPasswordInFirestore,
  updateUserStorageLimitInFirestore,
  deleteUserFromFirestore,
  adminDeactivateFileInFirestore,
  permanentDeleteFileFromFirestore,
  permanentDeleteFolderFromFirestore,
  renameFileInFirestore,
  renameFolderInFirestore,
  moveFileInFirestore,
  toggleFileStarInFirestore,
  softDeleteFileInFirestore,
  restoreFileInFirestore,
  softDeleteFolderInFirestore,
  restoreFolderInFirestore,
  updateFolderColorInFirestore,
  getFileContentLocal
} from '../services/vaultService';
import { UserProfile, FileItem, FolderItem, AppBranding, DEFAULT_BRANDING } from '../types';
import { FilePreviewModal } from '../components/FilePreviewModal';
import { AdminBrandingSettings } from '../components/AdminBrandingSettings';
import {
  Users,
  HardDrive,
  Folder,
  FileText,
  Search,
  KeyRound,
  Trash2,
  Ban,
  CheckCircle,
  TrendingUp,
  Settings,
  X,
  Lock,
  ChevronDown,
  Eye,
  AlertCircle,
  ArrowLeft,
  Info,
  Star,
  Edit3,
  ExternalLink,
  ChevronRight,
  FolderPlus,
  Palette
} from 'lucide-react';
import { formatBytes } from '../utils/formatters';

interface AdminDashboardPageProps {
  darkMode: boolean;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  branding?: AppBranding;
}

interface UserListItem {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: 'Admin' | 'User';
  status: 'active' | 'deactivated';
  password?: string;
  storageLimitMB: number;
  createdAt: string;
}

const isItemOwner = (itemUserId: string, user: UserListItem | null) => {
  if (!user || !itemUserId) return false;
  return (
    itemUserId === user.id ||
    itemUserId === user.email ||
    itemUserId === user.uid ||
    itemUserId.toLowerCase() === user.email?.toLowerCase() ||
    itemUserId.toLowerCase() === user.id?.toLowerCase() ||
    itemUserId.toLowerCase() === user.uid?.toLowerCase()
  );
};

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  darkMode,
  showToast,
  branding = DEFAULT_BRANDING,
}) => {
  // Real-time states
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'files' | 'folders' | 'branding'>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Password reset modal state
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<UserListItem | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');

  // Confirmation modal state
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserListItem | null>(null);
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<any | null>(null);
  const [deleteConfirmFolder, setDeleteConfirmFolder] = useState<any | null>(null);

  // Selected user profile view state
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserListItem | null>(null);

  // Selected item (file/folder) for info icon modal in admin view
  const [adminSelectedInfoItem, setAdminSelectedInfoItem] = useState<{
    item: any;
    type: 'file' | 'folder';
  } | null>(null);

  // Admin preview modal state
  const [adminPreviewFile, setAdminPreviewFile] = useState<FileItem | null>(null);

  // Bulk selection states
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [bulkStorageModalOpen, setBulkStorageModalOpen] = useState<boolean>(false);
  const [bulkStorageLimitValue, setBulkStorageLimitValue] = useState<number>(1000);

  // Form states for customizing info inside the Admin Item Info Modal
  const [editItemName, setEditItemName] = useState<string>('');
  const [editItemStarred, setEditItemStarred] = useState<boolean>(false);
  const [editFolderColor, setEditFolderColor] = useState<string>('');
  const [editFileCategory, setEditFileCategory] = useState<string>('');
  const [editFileParentFolderId, setEditFileParentFolderId] = useState<string | null>(null);
  const [editFileDeleted, setEditFileDeleted] = useState<boolean>(false);
  const [editFileDeactivated, setEditFileDeactivated] = useState<boolean>(false);

  // Initializing info customization form
  const handleOpenInfoModal = (item: any, type: 'file' | 'folder') => {
    setAdminSelectedInfoItem({ item, type });
    setEditItemName(item.name || '');
    setEditItemStarred(Boolean(item.isStarred));
    setEditFileDeleted(Boolean(item.isDeleted));
    if (type === 'folder') {
      setEditFolderColor(item.color || '#556B2F');
    } else {
      setEditFileCategory(item.category || 'other');
      setEditFileParentFolderId(item.parentFolderId || null);
      setEditFileDeactivated(Boolean(item.isDeactivated));
    }
  };

  // Submit customization changes to Firestore
  const handleSaveInfoCustomization = async () => {
    if (!adminSelectedInfoItem) return;
    const { item, type } = adminSelectedInfoItem;
    try {
      if (type === 'folder') {
        // Update folder name in Firestore
        if (editItemName.trim() && editItemName !== item.name) {
          await renameFolderInFirestore(item.id, editItemName.trim());
        }
        // Update folder color
        if (editFolderColor !== item.color) {
          await updateFolderColorInFirestore(item.id, editFolderColor);
        }
        // Update isDeleted
        if (editFileDeleted !== Boolean(item.isDeleted)) {
          if (editFileDeleted) {
            await softDeleteFolderInFirestore(item.id);
          } else {
            await restoreFolderInFirestore(item.id);
          }
        }
        showToast('Folder configuration updated successfully!', 'success');
      } else {
        // Update file name
        if (editItemName.trim() && editItemName !== item.name) {
          await renameFileInFirestore(item.id, editItemName.trim());
        }
        // Update isStarred
        if (editItemStarred !== Boolean(item.isStarred)) {
          await toggleFileStarInFirestore(item.id, editItemStarred);
        }
        // Update file parent folder and category
        if (editFileParentFolderId !== item.parentFolderId || editFileCategory !== item.category) {
          await moveFileInFirestore(item.id, editFileParentFolderId, editFileCategory);
        }
        // Update deactivated status
        if (editFileDeactivated !== Boolean(item.isDeactivated)) {
          await adminDeactivateFileInFirestore(item.id, editFileDeactivated);
        }
        // Update isDeleted
        if (editFileDeleted !== Boolean(item.isDeleted)) {
          if (editFileDeleted) {
            await softDeleteFileInFirestore(item.id);
          } else {
            await restoreFileInFirestore(item.id);
          }
        }
        showToast('File configuration updated successfully!', 'success');
      }
      setAdminSelectedInfoItem(null);
    } catch (err) {
      console.error('Failed to customize item in Firestore:', err);
      showToast('Failed to apply folder/file customizations.', 'error');
    }
  };

  // Open file in new tab (decrypted preview or cloud fallback)
  const handleOpenAdminFile = async (file: any) => {
    try {
      showToast('Decrypting archive tunnel...', 'info');
      const blob = await getFileContentLocal(file.id);
      if (blob) {
        const ext = file.extension?.toLowerCase() || '';
        let mimeType = file.mimeType || 'application/octet-stream';
        
        if (ext === 'pdf' || mimeType.includes('pdf')) mimeType = 'application/pdf';
        else if (ext === 'txt' || ext === 'md' || ext === 'csv' || mimeType.startsWith('text/')) mimeType = 'text/plain';
        else if (ext === 'json') mimeType = 'application/json';
        else if (ext === 'mp3') mimeType = 'audio/mpeg';
        else if (ext === 'wav') mimeType = 'audio/wav';
        else if (ext === 'ogg') mimeType = 'audio/ogg';
        else if (ext === 'm4a') mimeType = 'audio/mp4';
        else if (ext === 'aac') mimeType = 'audio/aac';
        else if (ext === 'flac') mimeType = 'audio/flac';
        else if (ext === 'mp4') mimeType = 'video/mp4';
        else if (ext === 'webm') mimeType = 'video/webm';
        else if (ext === 'mkv') mimeType = 'video/x-matroska';
        else if (ext === 'mov') mimeType = 'video/quicktime';
        else if (ext === 'avi') mimeType = 'video/x-msvideo';
        else if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
        else if (ext === 'webp') mimeType = 'image/webp';
        else if (ext === 'gif') mimeType = 'image/gif';
        else if (ext === 'svg') mimeType = 'image/svg+xml';
        else if (ext === 'bmp') mimeType = 'image/bmp';
        else if (ext === 'ico') mimeType = 'image/x-icon';
        
        const typedBlob = new Blob([blob], { type: mimeType });
        const objectUrl = URL.createObjectURL(typedBlob);
        
        // Open in a new tab
        const win = window.open(objectUrl, '_blank');
        if (win) {
          win.focus();
          showToast(`File "${file.name}" opened successfully!`, 'success');
        } else {
          // Fallback: dynamic link click if popups are blocked
          const a = document.createElement('a');
          a.href = objectUrl;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          showToast(`File "${file.name}" opened in new tab!`, 'success');
        }
      } else if (file.url) {
        // Fallback: cloud URL
        const win = window.open(file.url, '_blank');
        if (win) {
          win.focus();
          showToast(`Opened resource for "${file.name}"`, 'success');
        } else {
          const a = document.createElement('a');
          a.href = file.url;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } else if (file.contentPreview) {
        // Fallback: preview content text file
        const textBlob = new Blob([file.contentPreview], { type: 'text/plain' });
        const objectUrl = URL.createObjectURL(textBlob);
        const win = window.open(objectUrl, '_blank');
        if (win) {
          win.focus();
          showToast(`Opened preview of "${file.name}"`, 'success');
        } else {
          const a = document.createElement('a');
          a.href = objectUrl;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } else {
        showToast('This file is encrypted and no local backup is cached in this browser.', 'error');
      }
    } catch (err) {
      console.error('Error opening file:', err);
      showToast('Could not open file secure tunnel.', 'error');
    }
  };

  // Load real-time admin datasets
  useEffect(() => {
    const unsubUsers = subscribeToAllUsers((remoteUsers) => {
      setUsers(remoteUsers);
    });

    const unsubFiles = subscribeToAllFiles((remoteFiles) => {
      setFiles(remoteFiles);
    });

    const unsubFolders = subscribeToAllFolders((remoteFolders) => {
      setFolders(remoteFolders);
    });

    return () => {
      unsubUsers();
      unsubFiles();
      unsubFolders();
    };
  }, []);

  // Filter query matches
  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const filteredFiles = useMemo(() => {
    return files.filter(f =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.userId && f.userId.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [files, searchQuery]);

  const filteredFolders = useMemo(() => {
    return folders.filter(fol =>
      fol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fol.userId && fol.userId.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [folders, searchQuery]);

  // Calculations for analytics
  const analytics = useMemo(() => {
    const totalUsers = users.length;
    const totalFiles = files.length;
    const totalFolders = folders.length;
    const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
    const activeFiles = files.filter(f => !f.isDeleted && !f.isDeactivated).length;
    const deactivatedFiles = files.filter(f => f.isDeactivated).length;

    // Categorization
    const docSize = files.filter(f => f.category === 'document').reduce((acc, f) => acc + (f.size || 0), 0);
    const imgSize = files.filter(f => f.category === 'image').reduce((acc, f) => acc + (f.size || 0), 0);
    const videoSize = files.filter(f => f.category === 'video').reduce((acc, f) => acc + (f.size || 0), 0);
    const audioSize = files.filter(f => f.category === 'audio').reduce((acc, f) => acc + (f.size || 0), 0);
    const otherSize = files.filter(f => f.category === 'other').reduce((acc, f) => acc + (f.size || 0), 0);

    return {
      totalUsers,
      totalFiles,
      totalFolders,
      totalBytes,
      activeFiles,
      deactivatedFiles,
      categories: [
        { name: 'Documents', size: docSize, color: '#3B82F6' },
        { name: 'Images', size: imgSize, color: '#10B981' },
        { name: 'Videos', size: videoSize, color: '#F59E0B' },
        { name: 'Audios', size: audioSize, color: '#EC4899' },
        { name: 'Others', size: otherSize, color: '#6B7280' }
      ]
    };
  }, [users, files, folders]);

  // Actions
  const handleToggleUserStatus = async (user: UserListItem) => {
    const newStatus = user.status === 'active' ? 'deactivated' : 'active';
    try {
      await updateUserStatusInFirestore(user.id, newStatus);
      showToast(`User ${user.name} is now ${newStatus}.`, 'success');
    } catch (err) {
      showToast('Failed to update user status.', 'error');
    }
  };

  const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword) return;
    if (newPassword.trim().length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    try {
      await updateUserPasswordInFirestore(selectedUserForPassword.id, newPassword.trim());
      showToast(`Password updated successfully for ${selectedUserForPassword.name}.`, 'success');
      setSelectedUserForPassword(null);
      setNewPassword('');
    } catch (err) {
      showToast('Failed to reset user password.', 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    const u = deleteConfirmUser;
    setUsers((prev) => prev.filter((usr) => usr.id !== u.id));
    setFiles((prev) => prev.filter((f) => f.userId !== u.id && f.userId !== u.email));
    setFolders((prev) => prev.filter((fol) => fol.userId !== u.id && fol.userId !== u.email));
    if (selectedUserProfile?.id === u.id) {
      setSelectedUserProfile(null);
    }
    setDeleteConfirmUser(null);
    try {
      await deleteUserFromFirestore(u.id, u.email);
      showToast(`User profile "${u.name}" and all associated files hard-deleted.`, 'success');
    } catch (err) {
      showToast('Failed to delete user profile.', 'error');
    }
  };

  const handleToggleFileDeactivation = async (file: any) => {
    const newDeactivatedState = !file.isDeactivated;
    try {
      await adminDeactivateFileInFirestore(file.id, newDeactivatedState);
      showToast(
        `File "${file.name}" has been ${newDeactivatedState ? 'deactivated' : 'reactivated'}.`,
        'success'
      );
    } catch (err) {
      showToast('Failed to update file state.', 'error');
    }
  };

  const handlePermanentDeleteFile = async () => {
    if (!deleteConfirmFile) return;
    const targetId = deleteConfirmFile.id;
    const targetName = deleteConfirmFile.name;
    setFiles((prev) => prev.filter((f) => f.id !== targetId));
    setSelectedFileIds((prev) => prev.filter((id) => id !== targetId));
    setDeleteConfirmFile(null);
    try {
      await permanentDeleteFileFromFirestore(targetId);
      showToast(`Permanently deleted file "${targetName}" from database.`, 'success');
    } catch (err) {
      console.error('Failed to delete file from database:', err);
      showToast('Failed to delete file from database.', 'error');
    }
  };

  const handlePermanentDeleteFolder = async () => {
    if (!deleteConfirmFolder) return;
    const targetId = deleteConfirmFolder.id;
    const targetName = deleteConfirmFolder.name;
    setFolders((prev) => prev.filter((fol) => fol.id !== targetId));
    setFiles((prev) => prev.filter((f) => f.parentFolderId !== targetId));
    setDeleteConfirmFolder(null);
    try {
      await permanentDeleteFolderFromFirestore(targetId, deleteConfirmFolder.userId || 'unknown');
      showToast(`Permanently deleted folder "${targetName}" from database.`, 'success');
    } catch (err) {
      console.error('Failed to delete folder from database:', err);
      showToast('Failed to delete folder from database.', 'error');
    }
  };

  // Bulk User Handlers
  const handleBulkToggleUserStatus = async (status: 'active' | 'deactivated') => {
    if (selectedUserIds.length === 0) return;
    try {
      await Promise.all(
        selectedUserIds.map((id) => {
          const u = users.find(user => user.id === id);
          if (u && u.email !== 'admin@t.co') {
            return updateUserStatusInFirestore(id, status);
          }
          return Promise.resolve();
        })
      );
      showToast(`Successfully set ${selectedUserIds.length} users to ${status}.`, 'success');
      setSelectedUserIds([]);
    } catch (err) {
      showToast('Failed to perform bulk user status update.', 'error');
    }
  };

  const handleBulkUpdateStorage = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      await Promise.all(
        selectedUserIds.map((id) => updateUserStorageLimitInFirestore(id, bulkStorageLimitValue))
      );
      showToast(`Updated storage limit to ${bulkStorageLimitValue} MB for ${selectedUserIds.length} users.`, 'success');
      setSelectedUserIds([]);
      setBulkStorageModalOpen(false);
    } catch (err) {
      showToast('Failed to update storage limits in bulk.', 'error');
    }
  };

  const handleBulkDeleteUsers = async () => {
    if (selectedUserIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedUserIds.length} selected user profile(s)?`)) return;
    const targetIds = [...selectedUserIds];
    const targetUsers = users.filter((u) => targetIds.includes(u.id) && u.email !== 'admin@t.co');

    setUsers((prev) => prev.filter((u) => !targetIds.includes(u.id) || u.email === 'admin@t.co'));
    setFiles((prev) => prev.filter((f) => !targetUsers.some((u) => f.userId === u.id || f.userId === u.email)));
    setFolders((prev) => prev.filter((fol) => !targetUsers.some((u) => fol.userId === u.id || fol.userId === u.email)));
    setSelectedUserIds([]);

    try {
      await Promise.all(
        targetUsers.map((u) => deleteUserFromFirestore(u.id, u.email))
      );
      showToast(`Successfully deleted ${targetUsers.length} user profile(s) and their files.`, 'success');
    } catch (err) {
      showToast('Failed to perform bulk user deletion.', 'error');
    }
  };

  const handleBulkExportUsersCSV = () => {
    const selectedUsersList = users.filter(u => selectedUserIds.includes(u.id));
    const csvContent = [
      ['ID', 'Name', 'Email', 'Role', 'Status', 'Storage Limit (MB)', 'Created At'].join(','),
      ...selectedUsersList.map(u => [u.id, `"${u.name}"`, u.email, u.role, u.status, u.storageLimitMB, u.createdAt].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${selectedUsersList.length} users to CSV.`, 'success');
  };

  // Bulk File Handlers
  const handleBulkToggleFileDeactivation = async (isDeactivated: boolean) => {
    if (selectedFileIds.length === 0) return;
    try {
      await Promise.all(
        selectedFileIds.map((id) => adminDeactivateFileInFirestore(id, isDeactivated))
      );
      showToast(`Successfully ${isDeactivated ? 'deactivated' : 'reactivated'} ${selectedFileIds.length} files.`, 'success');
      setSelectedFileIds([]);
    } catch (err) {
      showToast('Failed to perform bulk file deactivation.', 'error');
    }
  };

  const handleBulkPermanentDeleteFiles = async () => {
    if (selectedFileIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedFileIds.length} selected file(s) from the database?`)) return;
    const targetIds = [...selectedFileIds];
    setFiles((prev) => prev.filter((f) => !targetIds.includes(f.id)));
    setSelectedFileIds([]);

    try {
      await Promise.all(
        targetIds.map((id) => permanentDeleteFileFromFirestore(id))
      );
      showToast(`Permanently deleted ${targetIds.length} file(s) from database.`, 'success');
    } catch (err) {
      console.error('Failed to permanently delete selected files:', err);
      showToast('Failed to delete selected files from database.', 'error');
    }
  };

  const handleBulkExportFilesCSV = () => {
    const selectedFilesList = files.filter(f => selectedFileIds.includes(f.id));
    const csvContent = [
      ['ID', 'Name', 'Owner', 'Size (Bytes)', 'Category', 'Status', 'Created At'].join(','),
      ...selectedFilesList.map(f => [
        f.id,
        `"${f.name}"`,
        f.userId || 'unknown',
        f.size,
        f.category,
        f.isDeactivated ? 'Deactivated' : f.isDeleted ? 'Bin' : 'Active',
        f.createdAt
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `files_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${selectedFilesList.length} files to CSV.`, 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Admin Title & Description */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4 border-b border-olive-sage/20 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-cream">
              Vault Platform Administration
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
            System-wide directory analytics, secure credential overrides, and file-access audits.
          </p>
        </div>

        {/* Global tab Switchers (Hidden when inspecting a specific profile) */}
        {!selectedUserProfile && (
          <div className="flex items-center gap-1.5 bg-white/60 dark:bg-slate-900/60 p-1 rounded-xl border border-olive-sage/20 shadow-sm shrink-0 overflow-x-auto">
            <button
              onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-olive-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-olive-light/40'}`}
            >
              Overview
            </button>
            <button
              onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-olive-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-olive-light/40'}`}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => { setActiveTab('files'); setSearchQuery(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'files' ? 'bg-olive-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-olive-light/40'}`}
            >
              Files ({files.length})
            </button>
            <button
              onClick={() => { setActiveTab('folders'); setSearchQuery(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'folders' ? 'bg-olive-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-olive-light/40'}`}
            >
              Folders ({folders.length})
            </button>
            <button
              onClick={() => { setActiveTab('branding'); setSearchQuery(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'branding' ? 'bg-olive-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-olive-light/40'}`}
            >
              <Palette size={13} />
              Branding & Customization
            </button>
          </div>
        )}
      </div>

      {/* CONDITIONAL SUB-VIEW: SELECTED USER PROFILE EXPLORER */}
      {selectedUserProfile ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
          {/* Breadcrumb & Back Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedUserProfile(null);
                setSearchQuery('');
              }}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-white hover:bg-olive-primary dark:hover:bg-olive-primary bg-white dark:bg-[#1E241E] border border-olive-sage/20 px-3.5 py-2 rounded-xl shadow-sm transition-all"
            >
              <ArrowLeft size={14} />
              Back to User Directory
            </button>

            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 font-mono">
              DB IDENTIFIER: {selectedUserProfile.id}
            </span>
          </div>

          {/* User Profile Card */}
          <div className="bg-white dark:bg-[#1E241E] border border-olive-sage/20 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-olive-primary to-olive-dark text-white flex items-center justify-center font-extrabold text-xl shadow-md border border-olive-sage/20">
                  {selectedUserProfile.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-cream flex items-center gap-2">
                    {selectedUserProfile.name}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${selectedUserProfile.status === 'active' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'}`}>
                      {selectedUserProfile.status === 'active' ? 'Active' : 'Deactivated'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{selectedUserProfile.email}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Directory Profile Created: {new Date(selectedUserProfile.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Profile Override Actions */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => {
                    setSelectedUserForPassword(selectedUserProfile);
                    setNewPassword('');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-olive-primary dark:text-olive-sage border border-olive-sage/20 rounded-xl hover:bg-olive-light/20 transition-all shadow-sm"
                >
                  <KeyRound size={13} />
                  Reset Credential
                </button>

                {selectedUserProfile.email !== 'admin@t.co' && (
                  <button
                    onClick={async () => {
                      const newStatus = selectedUserProfile.status === 'active' ? 'deactivated' : 'active';
                      try {
                        await updateUserStatusInFirestore(selectedUserProfile.id, newStatus);
                        setSelectedUserProfile({ ...selectedUserProfile, status: newStatus });
                        showToast(`User status set to ${newStatus}.`, 'success');
                      } catch (err) {
                        showToast('Failed to update status.', 'error');
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border rounded-xl transition-all shadow-sm ${selectedUserProfile.status === 'active' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'}`}
                  >
                    <Ban size={13} />
                    {selectedUserProfile.status === 'active' ? 'Deactivate' : 'Reactivate'}
                  </button>
                )}

                {selectedUserProfile.email !== 'admin@t.co' && (
                  <button
                    onClick={() => {
                      setDeleteConfirmUser(selectedUserProfile);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-600 border border-red-500/20 rounded-xl transition-all shadow-sm"
                  >
                    <Trash2 size={13} />
                    Hard Delete
                  </button>
                )}
              </div>
            </div>

            {/* Storage Quota Progress Bar */}
            {(() => {
              const userFiles = files.filter(f => isItemOwner(f.userId, selectedUserProfile));
              const storageUsed = userFiles.reduce((acc, f) => acc + (f.size || 0), 0);
              const limitBytes = selectedUserProfile.storageLimitMB * 1024 * 1024;
              const percentage = Math.min(100, (storageUsed / limitBytes) * 100);

              return (
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5"><HardDrive size={14} className="text-olive-primary" /> Active Storage Allocation</span>
                    <span>{formatBytes(storageUsed)} / {selectedUserProfile.storageLimitMB} MB ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-amber-500' : 'bg-olive-primary'}`}
                      style={{ width: `${Math.max(3, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Two Column File & Folder Hierarchy Explorer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Folder browser */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white dark:bg-[#1E241E] border border-olive-sage/20 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <h3 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Folder size={15} className="text-olive-primary" />
                    Vault Folders ({folders.filter(fol => isItemOwner(fol.userId, selectedUserProfile)).length})
                  </h3>
                </div>

                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {(() => {
                    const userFolders = folders.filter(fol => isItemOwner(fol.userId, selectedUserProfile));
                    if (userFolders.length === 0) {
                      return (
                        <p className="text-xs text-slate-400 py-8 text-center font-medium">No custom folders found.</p>
                      );
                    }
                    return userFolders.map(fol => (
                      <div
                        key={fol.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 hover:border-olive-sage/30 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Folder size={14} style={{ color: fol.color || '#556B2F' }} className="fill-current/10 shrink-0" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={fol.name}>
                            {fol.name}
                          </span>
                          {fol.isDeleted && (
                            <span className="px-1 py-0.2 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-bold">Bin</span>
                          )}
                        </div>

                        {/* Info / Customizer button */}
                        <button
                          onClick={() => handleOpenInfoModal(fol, 'folder')}
                          className="p-1 text-slate-400 hover:text-olive-primary dark:hover:text-olive-sage hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="View and Edit Folder Configuration"
                        >
                          <Info size={13} />
                        </button>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* File explorer */}
            <div className="lg:col-span-8 space-y-4">
              {/* Bulk Action Toolbar for User Vault Files */}
              {selectedFileIds.length > 0 && (
                <div className="p-4 bg-olive-light/20 dark:bg-slate-800/80 border border-olive-primary/30 rounded-2xl flex items-center justify-between animate-fade-in shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs bg-olive-primary text-white px-2.5 py-0.5 rounded-full">
                      {selectedFileIds.length}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-cream">Files Selected</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleBulkToggleFileDeactivation(true)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                    >
                      Deactivate
                    </button>
                    <button
                      onClick={() => handleBulkToggleFileDeactivation(false)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                    >
                      Reactivate
                    </button>
                    <button
                      onClick={handleBulkExportFilesCSV}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={handleBulkPermanentDeleteFiles}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                    >
                      Permanently Delete
                    </button>
                    <button
                      onClick={() => setSelectedFileIds([])}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold ml-2"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-[#1E241E] border border-olive-sage/20 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 gap-2">
                  <h3 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText size={15} className="text-olive-primary" />
                    Vault Files ({files.filter(f => isItemOwner(f.userId, selectedUserProfile)).length})
                  </h3>

                  {/* Search filter inside the active inspection vault */}
                  <div className="relative max-w-xs w-full">
                    <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
                    <input
                      type="text"
                      placeholder="Search files in user vault..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-olive-sage/20 rounded-lg py-1 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-olive-primary text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                        <th className="pb-2 w-8">
                          {(() => {
                            const userFiles = files.filter(f => {
                              const isOwner = isItemOwner(f.userId, selectedUserProfile);
                              if (!isOwner) return false;
                              if (searchQuery) return f.name.toLowerCase().includes(searchQuery.toLowerCase());
                              return true;
                            });
                            return (
                              <input
                                type="checkbox"
                                checked={userFiles.length > 0 && userFiles.every(f => selectedFileIds.includes(f.id))}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const allIds = userFiles.map(f => f.id);
                                    setSelectedFileIds(Array.from(new Set([...selectedFileIds, ...allIds])));
                                  } else {
                                    const userFileIds = userFiles.map(f => f.id);
                                    setSelectedFileIds(selectedFileIds.filter(id => !userFileIds.includes(id)));
                                  }
                                }}
                                className="rounded border-slate-300 text-olive-primary focus:ring-olive-primary"
                              />
                            );
                          })()}
                        </th>
                        <th className="pb-2">File Name</th>
                        <th className="pb-2">Size</th>
                        <th className="pb-2">Category</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                      {(() => {
                        const userFiles = files.filter(f => {
                          const isOwner = isItemOwner(f.userId, selectedUserProfile);
                          if (!isOwner) return false;
                          if (searchQuery) {
                            return f.name.toLowerCase().includes(searchQuery.toLowerCase());
                          }
                          return true;
                        });

                        if (userFiles.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                                No files matching search query.
                              </td>
                            </tr>
                          );
                        }

                        return userFiles.map(file => (
                          <tr key={file.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                            <td className="py-3 w-8" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedFileIds.includes(file.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedFileIds([...selectedFileIds, file.id]);
                                  } else {
                                    setSelectedFileIds(selectedFileIds.filter(id => id !== file.id));
                                  }
                                }}
                                className="rounded border-slate-300 text-olive-primary focus:ring-olive-primary"
                              />
                            </td>
                            <td className="py-3 pr-2 font-semibold">
                              <div className="flex items-center gap-2 max-w-xs sm:max-w-md">
                                <FileText size={14} className="text-slate-400 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 dark:text-cream truncate" title={file.name}>
                                    {file.name}
                                  </p>
                                  <p className="text-[9px] text-slate-400 truncate">
                                    Folder: {file.parentFolderId ? (folders.find(fol => fol.id === file.parentFolderId)?.name || 'Unknown') : 'Root'}
                                  </p>
                                </div>
                                {file.isStarred && <Star size={10} className="text-amber-500 fill-amber-500 shrink-0" />}
                              </div>
                            </td>
                            <td className="py-3 text-slate-500 dark:text-slate-300 font-mono text-[11px]">
                              {formatBytes(file.size)}
                            </td>
                            <td className="py-3 text-slate-500">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[9px] font-bold">
                                {file.category}
                              </span>
                            </td>
                            <td className="py-3">
                              {file.isDeactivated ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-red-500/10 text-red-600 border border-red-500/20 text-[9px] font-bold">
                                  Deactivated
                                </span>
                              ) : file.isDeleted ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-bold">
                                  Bin
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-bold">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Preview Modal Button */}
                                <button
                                  onClick={() => setAdminPreviewFile(file)}
                                  className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors border border-emerald-500/20 shadow-sm"
                                  title="Preview File"
                                >
                                  <Eye size={12} />
                                </button>

                                {/* View/Open in New Tab Button */}
                                <button
                                  onClick={() => handleOpenAdminFile(file)}
                                  className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors border border-blue-500/20 shadow-sm"
                                  title="Open File in New Tab"
                                >
                                  <ExternalLink size={12} />
                                </button>

                                {/* Deactivate / Reactivate */}
                                <button
                                  onClick={() => handleToggleFileDeactivation(file)}
                                  className={`p-1.5 rounded-lg border transition-colors shadow-sm ${file.isDeactivated ? 'text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10' : 'text-amber-600 border-amber-500/20 hover:bg-amber-500/10'}`}
                                  title={file.isDeactivated ? 'Reactivate File' : 'Deactivate File'}
                                >
                                  <Ban size={12} />
                                </button>

                                {/* Permanent Delete */}
                                <button
                                  onClick={() => setDeleteConfirmFile(file)}
                                  className="p-1.5 text-red-600 border border-red-500/20 hover:bg-red-500/10 rounded-lg transition-colors shadow-sm"
                                  title="Permanently Delete File"
                                >
                                  <Trash2 size={12} />
                                </button>

                                {/* Info Icon */}
                                <button
                                  onClick={() => handleOpenInfoModal(file, 'file')}
                                  className="p-1.5 text-olive-primary dark:text-olive-sage hover:bg-olive-light/20 rounded-lg transition-colors border border-olive-sage/20 shadow-sm"
                                  title="Customize File Metadata"
                                >
                                  <Info size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Analytics widgets */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Widget 1 */}
                <div className="bg-white dark:bg-[#1E241E] border border-olive-sage/20 p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                      <Users size={20} />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Registered Accounts</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold mt-3 text-slate-900 dark:text-cream">
                    {analytics.totalUsers}
                  </p>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                    <TrendingUp size={12} />
                    <span>100% cloud-synced directory</span>
                  </div>
                </div>

                {/* Widget 2 */}
                <div className="bg-white dark:bg-[#1E241E] border border-olive-sage/20 p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                      <HardDrive size={20} />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Encrypted Space</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold mt-3 text-slate-900 dark:text-cream">
                    {formatBytes(analytics.totalBytes)}
                  </p>
                  <div className="text-[11px] text-slate-400 font-semibold mt-1.5">
                    Across all accounts
                  </div>
                </div>

                {/* Widget 3 */}
                <div className="bg-white dark:bg-[#1E241E] border border-olive-sage/20 p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                      <FileText size={20} />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Secure File Vaults</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold mt-3 text-slate-900 dark:text-cream">
                    {analytics.totalFiles}
                  </p>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5">
                    {analytics.activeFiles} active archives
                  </div>
                </div>

                {/* Widget 4 */}
                <div className="bg-white dark:bg-[#1E241E] border border-olive-sage/20 p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                      <Folder size={20} />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Directories</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold mt-3 text-slate-900 dark:text-cream">
                    {analytics.totalFolders}
                  </p>
                  <div className="text-[11px] text-slate-400 font-semibold mt-1.5">
                    Hierarchical folders
                  </div>
                </div>
              </div>

              {/* Interactive SVG Graph Area */}
              <div className="bg-white dark:bg-[#1E241E] border border-olive-sage/20 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1.5">
                  System Storage Breakdown & Storage Density
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">
                  Real-time space visualization by encrypted category.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  {/* Left Side: Dynamic Custom Bars */}
                  <div className="space-y-4">
                    {analytics.categories.map((cat) => {
                      const percentage = analytics.totalBytes > 0 
                        ? (cat.size / analytics.totalBytes) * 100 
                        : 0;

                      return (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-300">
                            <span>{cat.name}</span>
                            <span>{formatBytes(cat.size)} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                backgroundColor: cat.color,
                                width: `${Math.max(3, percentage)}%`
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Side: Interactive SVG Donut/Area Visualizer */}
                  <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-olive-sage/10">
                    <svg width="220" height="220" viewBox="0 0 220 220" className="rotate-[-90deg]">
                      <circle
                        cx="110"
                        cy="110"
                        r="85"
                        fill="transparent"
                        stroke={darkMode ? '#1E293B' : '#E2E8F0'}
                        strokeWidth="20"
                      />
                      {/* Dynamic Pie Slices based on cumulative size */}
                      {(() => {
                        let cumulativePercentage = 0;
                        return analytics.categories.map((cat, idx) => {
                          const percentage = analytics.totalBytes > 0 ? (cat.size / analytics.totalBytes) * 100 : 0;
                          if (percentage === 0) return null;

                          const radius = 85;
                          const circumference = 2 * Math.PI * radius;
                          const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                          const strokeDashoffset = -((cumulativePercentage / 100) * circumference);

                          cumulativePercentage += percentage;

                          return (
                            <circle
                              key={cat.name}
                              cx="110"
                              cy="110"
                              r={radius}
                              fill="transparent"
                              stroke={cat.color}
                              strokeWidth="20"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              className="transition-all duration-500 hover:stroke-[24px]"
                              style={{ transformOrigin: 'center' }}
                            />
                          );
                        });
                      })()}
                    </svg>

                    {/* Micro Legend */}
                    <div className="flex flex-wrap justify-center gap-3 mt-4">
                      {analytics.categories.map(c => (
                        <div key={c.name} className="flex items-center gap-1.5 text-[11px] font-bold">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="text-slate-600 dark:text-slate-300">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEARCH BAR (For Users / Files / Folders views) */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-3 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab === 'users' ? 'directory by name or email...' : activeTab === 'files' ? 'files by name or uploader email...' : 'folders by name or creator...'}`}
              className="w-full bg-white dark:bg-[#1E241E] border border-olive-sage/20 rounded-xl py-2.5 pl-11 pr-4 text-sm text-slate-900 dark:text-cream placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-olive-primary transition-all shadow-sm"
            />
          </div>

          {/* USER DIRECTORY TAB */}
          {activeTab === 'users' && (
        <div>
          {/* Bulk Action Toolbar for Users */}
          {selectedUserIds.length > 0 && (
            <div className="mb-4 p-4 bg-olive-light/20 dark:bg-slate-800/80 border border-olive-primary/30 rounded-2xl flex items-center justify-between animate-fade-in shadow-md">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs bg-olive-primary text-white px-2.5 py-0.5 rounded-full">
                  {selectedUserIds.length}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-cream">Users Selected</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleBulkToggleUserStatus('active')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Activate Selected
                </button>
                <button
                  onClick={() => handleBulkToggleUserStatus('deactivated')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Deactivate Selected
                </button>
                <button
                  onClick={() => setBulkStorageModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Set Storage Limit
                </button>
                <button
                  onClick={handleBulkExportUsersCSV}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Export CSV
                </button>
                <button
                  onClick={handleBulkDeleteUsers}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedUserIds([])}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold ml-2"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-[#1E241E] border border-olive-sage/20 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-olive-sage/10">
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUserIds(filteredUsers.map(u => u.id));
                          } else {
                            setSelectedUserIds([]);
                          }
                        }}
                        className="rounded border-slate-300 text-olive-primary focus:ring-olive-primary"
                      />
                    </th>
                    <th className="p-4">Uploader / User</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Encryption Code</th>
                    <th className="p-4">Created At</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-olive-sage/10 text-xs font-semibold">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        No registered users found matching "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      // Filter this user's files to estimate total storage
                      const userFiles = files.filter(f => f.userId === u.id || f.userId === u.email);
                      const storageUsed = userFiles.reduce((acc, f) => acc + (f.size || 0), 0);

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="p-4 w-10" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedUserIds.includes(u.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUserIds([...selectedUserIds, u.id]);
                                } else {
                                  setSelectedUserIds(selectedUserIds.filter(id => id !== u.id));
                                }
                              }}
                              className="rounded border-slate-300 text-olive-primary focus:ring-olive-primary"
                            />
                          </td>
                          <td 
                            onClick={() => {
                              setSelectedUserProfile(u);
                              setSearchQuery('');
                            }}
                            className="p-4 cursor-pointer hover:bg-olive-light/10 group/user"
                            title="Click to drill-down and inspect user profile & vault"
                          >
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-sm group-hover/user:text-olive-primary transition-colors flex items-center gap-1.5">
                                {u.name}
                                <ChevronRight size={14} className="opacity-0 group-hover/user:opacity-100 transition-all text-olive-primary translation-x-[-4px] group-hover/user:translate-x-0" />
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {u.email}
                              </p>
                              <div className="text-[10px] text-olive-dark dark:text-olive-sage font-medium mt-1 flex items-center gap-1">
                                <HardDrive size={10} />
                                <span>{formatBytes(storageUsed)} / {u.storageLimitMB} MB</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${u.status === 'active' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'}`}>
                              {u.status === 'active' ? <CheckCircle size={10} /> : <Ban size={10} />}
                              {u.status === 'active' ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${u.role === 'Admin' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                              {u.role || 'User'}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                            AES-256 + RSA-4096
                          </td>
                          <td className="p-4 text-slate-400">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Override Password Button */}
                              <button
                                onClick={() => {
                                  setSelectedUserForPassword(u);
                                  setNewPassword('');
                                }}
                                className="p-1.5 text-olive-primary dark:text-olive-sage hover:bg-olive-light/40 rounded-lg transition-colors border border-olive-sage/20 shadow-sm"
                                title="Reset Password directly"
                              >
                                <KeyRound size={13} />
                              </button>

                              {/* Deactivate/Activate Toggle Button */}
                              {u.email !== 'admin@t.co' && (
                                <button
                                  onClick={() => handleToggleUserStatus(u)}
                                  className={`p-1.5 rounded-lg border transition-colors shadow-sm ${u.status === 'active' ? 'text-amber-600 border-amber-500/20 hover:bg-amber-500/10' : 'text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10'}`}
                                  title={u.status === 'active' ? 'Deactivate User Account' : 'Reactivate User Account'}
                                >
                                  <Ban size={13} />
                                </button>
                              )}

                              {/* Hard-Delete Button */}
                              {u.email !== 'admin@t.co' && (
                                <button
                                  onClick={() => setDeleteConfirmUser(u)}
                                  className="p-1.5 text-red-600 border border-red-500/20 hover:bg-red-500/10 rounded-lg transition-colors shadow-sm"
                                  title="Delete user profile"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MASTER FILE AUDIT TAB */}
      {activeTab === 'files' && (
        <div>
          {/* Bulk Action Toolbar for Files */}
          {selectedFileIds.length > 0 && (
            <div className="mb-4 p-4 bg-olive-light/20 dark:bg-slate-800/80 border border-olive-primary/30 rounded-2xl flex items-center justify-between animate-fade-in shadow-md">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs bg-olive-primary text-white px-2.5 py-0.5 rounded-full">
                  {selectedFileIds.length}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-cream">Files Selected</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleBulkToggleFileDeactivation(true)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Deactivate Files
                </button>
                <button
                  onClick={() => handleBulkToggleFileDeactivation(false)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Reactivate Files
                </button>
                <button
                  onClick={handleBulkExportFilesCSV}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Export CSV
                </button>
                <button
                  onClick={handleBulkPermanentDeleteFiles}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Permanently Delete
                </button>
                <button
                  onClick={() => setSelectedFileIds([])}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold ml-2"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-[#1E241E] border border-olive-sage/20 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-olive-sage/10">
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={filteredFiles.length > 0 && selectedFileIds.length === filteredFiles.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFileIds(filteredFiles.map(f => f.id));
                          } else {
                            setSelectedFileIds([]);
                          }
                        }}
                        className="rounded border-slate-300 text-olive-primary focus:ring-olive-primary"
                      />
                    </th>
                    <th className="p-4">File Name</th>
                    <th className="p-4">Owner Email</th>
                    <th className="p-4">Size</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-olive-sage/10 text-xs font-semibold">
                  {filteredFiles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        No files uploaded matching "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="p-4 w-10" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedFileIds.includes(file.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFileIds([...selectedFileIds, file.id]);
                              } else {
                                setSelectedFileIds(selectedFileIds.filter(id => id !== file.id));
                              }
                            }}
                            className="rounded border-slate-300 text-olive-primary focus:ring-olive-primary"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-olive-primary" />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white max-w-xs truncate">
                                {file.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                Hash: {file.encryptedHash?.substring(0, 16) || 'N/A'}...
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">
                          {file.userId || 'unknown'}
                        </td>
                        <td className="p-4 text-slate-800 dark:text-slate-300">
                          {formatBytes(file.size)}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase text-[9px] font-bold">
                            {file.category}
                          </span>
                        </td>
                        <td className="p-4">
                          {file.isDeactivated ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-600 border border-red-500/20 font-bold text-[10px]">
                              <Ban size={10} /> Deactivated
                            </span>
                          ) : file.isDeleted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold text-[10px]">
                              <AlertCircle size={10} /> In Backup Bin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold text-[10px]">
                              <CheckCircle size={10} /> Active
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Preview Modal Button */}
                            <button
                              onClick={() => setAdminPreviewFile(file)}
                              className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors border border-emerald-500/20 shadow-sm"
                              title="Preview File"
                            >
                              <Eye size={12} />
                            </button>

                            {/* Deactivate/Reactivate button */}
                            <button
                              onClick={() => handleToggleFileDeactivation(file)}
                              className={`p-1.5 rounded-lg border transition-colors shadow-sm ${file.isDeactivated ? 'text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10' : 'text-red-600 border-red-500/20 hover:bg-emerald-500/10'}`}
                              title={file.isDeactivated ? 'Reactivate File' : 'Deactivate File'}
                            >
                              <Ban size={13} />
                            </button>

                            {/* Permanently Delete file button */}
                            <button
                              onClick={() => setDeleteConfirmFile(file)}
                              className="p-1.5 text-red-600 border border-red-500/20 hover:bg-red-500/10 rounded-lg transition-colors shadow-sm"
                              title="Permanently Delete File"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MASTER FOLDER AUDIT TAB */}
      {activeTab === 'folders' && (
        <div className="bg-white dark:bg-[#1E241E] border border-olive-sage/20 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-olive-sage/10">
                  <th className="p-4">Folder Name</th>
                  <th className="p-4">Creator ID / Email</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-olive-sage/10 text-xs font-semibold">
                {filteredFolders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                      No folders created matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredFolders.map((fol) => (
                    <tr key={fol.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Folder size={16} style={{ color: fol.color || '#556B2F' }} className="fill-current/10" />
                          <span className="font-bold text-slate-900 dark:text-white truncate max-w-xs">
                            {fol.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {fol.userId || 'unknown'}
                      </td>
                      <td className="p-4 text-slate-400">
                        {fol.createdAt ? new Date(fol.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4">
                        {fol.isDeleted ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold text-[10px]">
                            Bin
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold text-[10px]">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setDeleteConfirmFolder(fol)}
                          className="p-1.5 text-red-600 border border-red-500/20 hover:bg-red-500/10 rounded-lg transition-colors shadow-sm"
                          title="Permanently Delete Folder"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BRANDING & THEME SETTINGS TAB */}
      {activeTab === 'branding' && (
        <AdminBrandingSettings branding={branding} showToast={showToast} />
      )}
        </>
      )}

      {/* MODAL 1: Password reset directly (without old password) */}
      {selectedUserForPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#1E241E] rounded-3xl p-6 border border-olive-sage/20 shadow-2xl animate-in scale-in duration-200">
            <div className="flex items-center justify-between border-b border-olive-sage/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-amber-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Credential Override
                </h3>
              </div>
              <button
                onClick={() => setSelectedUserForPassword(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium leading-relaxed">
              Reset login credentials for <strong className="text-slate-800 dark:text-white">{selectedUserForPassword.name}</strong> ({selectedUserForPassword.email}). This change takes effect immediately without needing the old password.
            </p>

            <form onSubmit={handleUpdatePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Plain Password
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-olive-sage/20 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-olive-primary text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-olive-sage/10">
                <button
                  type="button"
                  onClick={() => setSelectedUserForPassword(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-olive-primary text-white shadow-md shadow-olive-primary/15 hover:opacity-95"
                >
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: User confirmation delete */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-[#1E241E] rounded-3xl p-6 border border-red-500/20 shadow-2xl animate-in scale-in duration-200">
            <h3 className="font-extrabold text-base text-red-600 flex items-center gap-2 mb-2">
              <AlertCircle size={18} /> Confirm Profile Deletion
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-5 leading-relaxed">
              Are you absolutely sure you want to permanently delete user <strong className="text-slate-800 dark:text-white">{deleteConfirmUser.name}</strong> ({deleteConfirmUser.email}) from the platform? This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/15"
              >
                Delete Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: File delete confirm */}
      {deleteConfirmFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-[#1E241E] rounded-3xl p-6 border border-red-500/20 shadow-2xl animate-in scale-in duration-200">
            <h3 className="font-extrabold text-base text-red-600 flex items-center gap-2 mb-2">
              <AlertCircle size={18} /> Permanently Delete File
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-5 leading-relaxed">
              Are you absolutely sure you want to permanently delete <strong className="text-slate-800 dark:text-white">{deleteConfirmFile.name}</strong>? This action bypasses the bin and permanently removes the file from the database.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmFile(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDeleteFile}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/15"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Folder delete confirm */}
      {deleteConfirmFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-[#1E241E] rounded-3xl p-6 border border-red-500/20 shadow-2xl animate-in scale-in duration-200">
            <h3 className="font-extrabold text-base text-red-600 flex items-center gap-2 mb-2">
              <AlertCircle size={18} /> Permanently Delete Folder
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-5 leading-relaxed">
              Are you absolutely sure you want to permanently delete folder <strong className="text-slate-800 dark:text-white">{deleteConfirmFolder.name}</strong>? All files and subfolders inside will be permanently deleted from the database.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmFolder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDeleteFolder}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/15"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Admin Info & Customizer Modal for File/Folder */}
      {adminSelectedInfoItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-[#1E241E] rounded-3xl p-6 border border-olive-sage/20 shadow-2xl animate-in scale-in duration-200">
            <div className="flex items-center justify-between border-b border-olive-sage/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Info size={18} className="text-olive-primary" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Inspect & Customize {adminSelectedInfoItem.type === 'folder' ? 'Folder' : 'File'}
                </h3>
              </div>
              <button
                onClick={() => setAdminSelectedInfoItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Read-Only Meta Information */}
            <div className="mb-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-olive-sage/10 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Database ID:</span>
                <span className="font-mono">{adminSelectedInfoItem.item.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Owner User:</span>
                <span>{selectedUserProfile?.name || adminSelectedInfoItem.item.userId || 'System'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Registered On:</span>
                <span>{adminSelectedInfoItem.item.createdAt ? new Date(adminSelectedInfoItem.item.createdAt).toLocaleString() : 'N/A'}</span>
              </div>
              {adminSelectedInfoItem.type === 'file' && (
                <>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">File Size:</span>
                    <span className="font-mono">{formatBytes(adminSelectedInfoItem.item.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">MIME Type:</span>
                    <span>{adminSelectedInfoItem.item.mimeType || 'unknown'}</span>
                  </div>
                </>
              )}
            </div>

            {/* Customization Controls Form */}
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {/* Rename Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Rename {adminSelectedInfoItem.type === 'folder' ? 'Folder' : 'File'}
                </label>
                <input
                  type="text"
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-olive-sage/20 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-olive-primary text-slate-900 dark:text-white"
                />
              </div>

              {/* Folder Specific: Color Preset Picker */}
              {adminSelectedInfoItem.type === 'folder' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <Palette size={13} /> Color Palette Preset
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['#556B2F', '#4682B4', '#9370DB', '#D2691E', '#CD5C5C', '#2E8B57', '#4B0082'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditFolderColor(color)}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${editFolderColor === color ? 'border-slate-800 scale-110 shadow-md dark:border-white' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* File Specific: Category, Folder move and Star Toggle */}
              {adminSelectedInfoItem.type === 'file' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Category Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Category Designation
                      </label>
                      <select
                        value={editFileCategory}
                        onChange={(e) => setEditFileCategory(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-olive-sage/20 rounded-xl px-2.5 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-olive-primary text-slate-900 dark:text-white"
                      >
                        <option value="document">Document</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="code">Code</option>
                        <option value="archive">Archive</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Move to Folder */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Parent Location
                      </label>
                      <select
                        value={editFileParentFolderId || ''}
                        onChange={(e) => setEditFileParentFolderId(e.target.value || null)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-olive-sage/20 rounded-xl px-2.5 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-olive-primary text-slate-900 dark:text-white"
                      >
                        <option value="">Root / Unsorted</option>
                        {folders
                          .filter(fol => isItemOwner(fol.userId, selectedUserProfile))
                          .map(fol => (
                            <option key={fol.id} value={fol.id}>
                              {fol.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Starred / Favorite toggle */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Star size={13} className="text-amber-500 fill-amber-500" /> Starred File Status
                    </span>
                    <input
                      type="checkbox"
                      checked={editItemStarred}
                      onChange={(e) => setEditItemStarred(e.target.checked)}
                      className="h-4 w-4 rounded text-olive-primary focus:ring-olive-primary border-slate-300 bg-transparent"
                    />
                  </div>
                </>
              )}

              {/* Status Toggles: soft deleted (Bin) and admin deactivation status */}
              <div className="space-y-2">
                {/* Trash/Bin toggle */}
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Trash2 size={13} className="text-amber-500" /> Soft Deleted (Sent to Bin)
                  </span>
                  <input
                    type="checkbox"
                    checked={editFileDeleted}
                    onChange={(e) => setEditFileDeleted(e.target.checked)}
                    className="h-4 w-4 rounded text-olive-primary focus:ring-olive-primary border-slate-300 bg-transparent"
                  />
                </div>

                {/* File Specific Deactivation status */}
                {adminSelectedInfoItem.type === 'file' && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Ban size={13} className="text-red-500" /> Admin Deactivated (Access Suspended)
                    </span>
                    <input
                      type="checkbox"
                      checked={editFileDeactivated}
                      onChange={(e) => setEditFileDeactivated(e.target.checked)}
                      className="h-4 w-4 rounded text-olive-primary focus:ring-olive-primary border-slate-300 bg-transparent"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-olive-sage/10">
              {/* Optional View/Open trigger if it is a file */}
              {adminSelectedInfoItem.type === 'file' ? (
                <button
                  type="button"
                  onClick={() => handleOpenAdminFile(adminSelectedInfoItem.item)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-xs font-bold text-blue-600 border border-blue-500/20 rounded-xl transition-all shadow-sm"
                >
                  <ExternalLink size={13} />
                  Open Secure Tunnel
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAdminSelectedInfoItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveInfoCustomization}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-olive-primary text-white hover:opacity-95 shadow-md shadow-olive-primary/10"
                >
                  Apply Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {adminPreviewFile && (
        <FilePreviewModal
          file={adminPreviewFile}
          onClose={() => setAdminPreviewFile(null)}
          onShare={(file) => {
            navigator.clipboard.writeText(file.url || window.location.href);
            showToast(`Share link copied for "${file.name}"`, 'success');
          }}
          onDownload={async (file) => {
            showToast(`Downloading "${file.name}"...`);
            const blob = await getFileContentLocal(file.id);
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = file.name;
              a.click();
              URL.revokeObjectURL(url);
            }
          }}
          showToast={(msg) => showToast(msg, 'success')}
        />
      )}

      {/* MODAL 6: Bulk Storage Limit Modal */}
      {bulkStorageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#1E241E] rounded-3xl p-6 border border-olive-sage/20 shadow-2xl animate-in scale-in duration-200">
            <div className="flex items-center justify-between border-b border-olive-sage/10 pb-4 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <HardDrive size={18} className="text-olive-primary" /> Set Storage Limit (Bulk)
              </h3>
              <button onClick={() => setBulkStorageModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              Updating storage quota for <strong className="text-slate-800 dark:text-white">{selectedUserIds.length}</strong> selected user account(s).
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Quota Limit (MB)
                </label>
                <input
                  type="number"
                  min="50"
                  max="50000"
                  value={bulkStorageLimitValue}
                  onChange={(e) => setBulkStorageLimitValue(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-olive-sage/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-olive-primary"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {[250, 500, 1000, 5000, 10000, 25000].map(mb => (
                  <button
                    key={mb}
                    type="button"
                    onClick={() => setBulkStorageLimitValue(mb)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${bulkStorageLimitValue === mb ? 'bg-olive-primary text-white border-olive-primary shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-olive-sage/20 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    {mb >= 1000 ? `${mb / 1000} GB` : `${mb} MB`}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-olive-sage/10">
              <button
                onClick={() => setBulkStorageModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpdateStorage}
                className="px-4 py-2 bg-olive-primary hover:bg-olive-dark text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-olive-primary/15"
              >
                Apply Quota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
