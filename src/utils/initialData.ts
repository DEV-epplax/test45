import { FileItem, FolderItem, UserProfile } from '../types';

export const DEFAULT_USER: UserProfile = {
  id: 'usr_iffl_88392',
  name: 'Alex Rivera',
  email: 'alex.rivera@iffl.cloud',
  storageLimitMB: 985, // 985 MB Free Tier
  encryptionMethod: 'AES-256-GCM + RSA-4096',
  twoFactorEnabled: true,
};

export const INITIAL_FOLDERS: FolderItem[] = [];

export const INITIAL_FILES: FileItem[] = [];
