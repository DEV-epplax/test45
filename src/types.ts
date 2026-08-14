export type CategoryType = 'All' | 'Starred' | 'Documents' | 'Images' | 'Videos' | 'Audios' | 'Other' | string;

export type SortOption = 
  | 'name-asc' 
  | 'name-desc' 
  | 'date-newest' 
  | 'date-oldest' 
  | 'size-desc';

export type ViewMode = 'grid' | 'table';

export type FileTypeCategory = 'document' | 'image' | 'video' | 'audio' | 'other' | string;

export interface FileItem {
  id: string;
  name: string;
  size: number; // in bytes
  category: FileTypeCategory;
  mimeType: string;
  extension: string;
  isStarred: boolean;
  isDeleted?: boolean;
  isDeactivated?: boolean; // Deactivated by Admin
  parentFolderId: string | null;
  createdAt: string;
  updatedAt: string;
  url?: string;
  contentPreview?: string;
  encryptedHash: string;
}

export interface FolderItem {
  id: string;
  name: string;
  parentFolderId: string | null;
  color?: string;
  createdAt: string;
  isDeleted?: boolean;
  userId?: string; // Owner ID
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  storageLimitMB: number; // e.g. 1024 MB
  encryptionMethod: string;
  twoFactorEnabled: boolean;
  role?: 'Admin' | 'User';
  status?: 'active' | 'deactivated';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

export type PageRoute = 'login' | 'register' | 'dashboard';

export interface AppBranding {
  appName: string;
  appLogoType: 'icon' | 'image';
  appLogoIcon: 'Shield' | 'HardDrive' | 'Lock' | 'Cloud' | 'Key' | 'Cpu' | string;
  appLogoUrl?: string;
  primaryColor: string; // Hex color code
  footerText: string;
  footerSubtext?: string;
  termsTitle: string;
  termsContent: string;
  updatedAt?: string;
}

export const DEFAULT_BRANDING: AppBranding = {
  appName: 'VaultX',
  appLogoType: 'icon',
  appLogoIcon: 'HardDrive',
  appLogoUrl: '',
  primaryColor: '#556B2F',
  footerText: '© 2026 VaultX Enterprise Cloud. Bank-grade 256-bit AES end-to-end encrypted storage.',
  footerSubtext: 'Built for enterprise-grade data security and access control.',
  termsTitle: 'Terms & Conditions of Service',
  termsContent: `Welcome to VaultX Cloud Vault. By accessing or using our platform, you agree to the following terms and conditions:

1. Data Privacy & Encryption: All uploaded files are stored securely using encryption. Only authorized users can access or download file contents.
2. Quotas & Storage Limits: User accounts must operate within assigned storage quotas. System administrators reserve the right to prune deactivated files or enforce quotas.
3. Acceptable Use Policy: You agree not to upload malicious software, copyrighted materials without authorization, or illegal content.
4. Account Security: You are responsible for maintaining the confidentiality of your account credentials and two-factor keys.
5. System Administration: System administrators may suspend access or deactivate files violating system safety policies.`,
};

