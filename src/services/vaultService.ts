import localforage from "localforage";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  getDocs,
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { FileItem, FolderItem, AppBranding, DEFAULT_BRANDING } from '../types';

/**
 * Gets the active user identifier for scoping files & folders in Firestore.
 */
export const getCurrentUserId = (fallbackUserEmail?: string, fallbackUserId?: string): string => {
  return auth.currentUser?.uid || fallbackUserEmail || fallbackUserId || 'guest_user';
};

/**
 * Real-time listener for user's folders in Firestore.
 */
export const subscribeToUserFolders = (
  userIdOrIdentifiers: string | string[],
  onUpdate: (folders: FolderItem[]) => void,
  onError?: (err: any) => void
) => {
  const foldersRef = collection(db, 'folders');
  const ids = Array.isArray(userIdOrIdentifiers) ? userIdOrIdentifiers : [userIdOrIdentifiers];
  const cleanIds = Array.from(new Set(ids.filter(Boolean)));
  
  let q;
  if (cleanIds.length > 1) {
    q = query(foldersRef, where('userId', 'in', cleanIds.slice(0, 10)));
  } else if (cleanIds.length === 1) {
    q = query(foldersRef, where('userId', '==', cleanIds[0]));
  } else {
    q = query(foldersRef, where('userId', '==', 'guest_user'));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const items: FolderItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || 'Untitled Folder',
          parentFolderId: data.parentFolderId || null,
          color: data.color || '#556B2F',
          createdAt: data.createdAt || new Date().toISOString(),
          isDeleted: Boolean(data.isDeleted),
        };
      });
      onUpdate(items);
    },
    (err) => {
      console.warn('Firestore Folders subscription error:', err);
      if (onError) onError(err);
    }
  );
};

/**
 * Real-time listener for user's files in Firestore.
 */
export const subscribeToUserFiles = (
  userIdOrIdentifiers: string | string[],
  onUpdate: (files: FileItem[]) => void,
  onError?: (err: any) => void
) => {
  const filesRef = collection(db, 'files');
  const ids = Array.isArray(userIdOrIdentifiers) ? userIdOrIdentifiers : [userIdOrIdentifiers];
  const cleanIds = Array.from(new Set(ids.filter(Boolean)));

  let q;
  if (cleanIds.length > 1) {
    q = query(filesRef, where('userId', 'in', cleanIds.slice(0, 10)));
  } else if (cleanIds.length === 1) {
    q = query(filesRef, where('userId', '==', cleanIds[0]));
  } else {
    q = query(filesRef, where('userId', '==', 'guest_user'));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const items: FileItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || 'Untitled File',
          size: data.size || 0,
          category: data.category || 'other',
          mimeType: data.mimeType || 'application/octet-stream',
          extension: data.extension || 'bin',
          isStarred: Boolean(data.isStarred),
          isDeleted: Boolean(data.isDeleted),
          isDeactivated: Boolean(data.isDeactivated),
          parentFolderId: data.parentFolderId || null,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          url: data.url,
          contentPreview: data.contentPreview,
          encryptedHash: data.encryptedHash || 'hash_placeholder',
        };
      }).filter((item) => !item.isDeactivated);
      onUpdate(items);
    },
    (err) => {
      console.warn('Firestore Files subscription error:', err);
      if (onError) onError(err);
    }
  );
};

/**
 * Creates a new folder in Firestore scoped to userId.
 */
export const addFolderToFirestore = async (
  folder: FolderItem,
  userId: string
): Promise<string> => {
  await setDoc(doc(db, 'folders', folder.id), {
    name: folder.name,
    parentFolderId: folder.parentFolderId,
    color: folder.color,
    createdAt: folder.createdAt || new Date().toISOString(),
    isDeleted: Boolean(folder.isDeleted),
    userId,
  });
  return folder.id;
};

/**
 * Creates a new file in Firestore scoped to userId.
 */
export const addFileToFirestore = async (
  file: FileItem,
  userId: string
): Promise<string> => {
  await setDoc(doc(db, 'files', file.id), {
    name: file.name,
    size: file.size,
    category: file.category,
    mimeType: file.mimeType,
    extension: file.extension,
    isStarred: Boolean(file.isStarred),
    isDeleted: Boolean(file.isDeleted),
    parentFolderId: file.parentFolderId,
    createdAt: file.createdAt || new Date().toISOString(),
    updatedAt: file.updatedAt || new Date().toISOString(),
    url: file.url || '',
    contentPreview: file.contentPreview || '',
    encryptedHash: file.encryptedHash || '',
    userId,
  });
  return file.id;
};

/**
 * Toggles starred status for a file in Firestore.
 */
export const toggleFileStarInFirestore = async (fileId: string, isStarred: boolean) => {
  const fileRef = doc(db, 'files', fileId);
  await updateDoc(fileRef, { isStarred });
};

/**
 * Renames a file in Firestore.
 */
export const renameFileInFirestore = async (fileId: string, newName: string) => {
  const fileRef = doc(db, 'files', fileId);
  await updateDoc(fileRef, {
    name: newName,
    updatedAt: new Date().toISOString(),
  });
};

/**
 * Renames a folder in Firestore.
 */
export const renameFolderInFirestore = async (folderId: string, newName: string) => {
  const folderRef = doc(db, 'folders', folderId);
  await updateDoc(folderRef, {
    name: newName,
  });
};

/**
 * Updates folder color in Firestore.
 */
export const updateFolderColorInFirestore = async (folderId: string, color: string) => {
  const folderRef = doc(db, 'folders', folderId);
  await updateDoc(folderRef, { color });
};

/**
 * Moves a file to a new parent folder or changes its category in Firestore.
 */
export const moveFileInFirestore = async (
  fileId: string,
  parentFolderId: string | null,
  category?: string
) => {
  const fileRef = doc(db, 'files', fileId);
  const updateData: Record<string, any> = {
    parentFolderId,
    updatedAt: new Date().toISOString(),
  };
  if (category) {
    updateData.category = category;
  }
  await updateDoc(fileRef, updateData);
};

/**
 * Soft-deletes (deactivates) a single file in Firestore.
 */
export const softDeleteFileInFirestore = async (fileId: string) => {
  const fileRef = doc(db, 'files', fileId);
  await updateDoc(fileRef, { isDeleted: true });
};

/**
 * Restores (reactivates) a single file in Firestore.
 */
export const restoreFileInFirestore = async (fileId: string) => {
  const fileRef = doc(db, 'files', fileId);
  await updateDoc(fileRef, { isDeleted: false });
};

/**
 * Soft-deletes (deactivates) a folder in Firestore.
 */
export const softDeleteFolderInFirestore = async (folderId: string) => {
  const folderRef = doc(db, 'folders', folderId);
  await updateDoc(folderRef, { isDeleted: true });
};

/**
 * Restores (reactivates) a folder in Firestore.
 */
export const restoreFolderInFirestore = async (folderId: string) => {
  const folderRef = doc(db, 'folders', folderId);
  await updateDoc(folderRef, { isDeleted: false });
};

/**
 * Permanently deletes a single file from Firestore.
 */
export const permanentDeleteFileFromFirestore = async (fileId: string) => {
  const fileRef = doc(db, 'files', fileId);
  await deleteDoc(fileRef);
  try {
    await localforage.removeItem(`file_content_${fileId}`);
  } catch (err) {
    console.warn('Localforage item removal notice:', err);
  }
};

/**
 * Permanently deletes a folder and all its contents (subfolders and files) from Firestore.
 */
export const permanentDeleteFolderFromFirestore = async (folderId: string, userId: string) => {
  try {
    const batch = writeBatch(db);

    // 1. Delete folder doc itself
    const folderRef = doc(db, 'folders', folderId);
    batch.delete(folderRef);

    // 2. Query child files
    const filesQuery = query(
      collection(db, 'files'),
      where('userId', '==', userId),
      where('parentFolderId', '==', folderId)
    );
    const filesSnap = await getDocs(filesQuery);
    filesSnap.forEach((fileDoc) => {
      batch.delete(fileDoc.ref);
    });

    // 3. Query sub-folders
    const subFoldersQuery = query(
      collection(db, 'folders'),
      where('userId', '==', userId),
      where('parentFolderId', '==', folderId)
    );
    const subFoldersSnap = await getDocs(subFoldersQuery);
    subFoldersSnap.forEach((subDoc) => {
      batch.delete(subDoc.ref);
    });

    await batch.commit();
  } catch (err) {
    console.warn('Firestore permanent delete folder notice:', err);
  }
};

/**
 * Legacy alias for delete
 */
export const deleteFileFromFirestore = softDeleteFileInFirestore;
export const deleteFolderFromFirestore = softDeleteFolderInFirestore;

/**
 * Admin: Real-time subscription to ALL users in the system.
 */
export const subscribeToAllUsers = (
  onUpdate: (users: any[]) => void,
  onError?: (err: any) => void
) => {
  const usersRef = collection(db, 'users');
  return onSnapshot(
    usersRef,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          uid: data.uid || docSnap.id,
          name: data.name || 'Unknown',
          email: data.email || '',
          role: data.role || 'User',
          status: data.status || 'active',
          password: data.password || '',
          storageLimitMB: data.storageLimitMB || 985,
          createdAt: data.createdAt || new Date().toISOString(),
        };
      });
      onUpdate(items);
    },
    (err) => {
      console.warn('Firestore Admin subscribeToAllUsers error:', err);
      if (onError) onError(err);
    }
  );
};

/**
 * Admin: Real-time subscription to ALL files uploaded on the platform.
 */
export const subscribeToAllFiles = (
  onUpdate: (files: any[]) => void,
  onError?: (err: any) => void
) => {
  const filesRef = collection(db, 'files');
  return onSnapshot(
    filesRef,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || 'Untitled File',
          size: data.size || 0,
          category: data.category || 'other',
          mimeType: data.mimeType || 'application/octet-stream',
          extension: data.extension || 'bin',
          isStarred: Boolean(data.isStarred),
          isDeleted: Boolean(data.isDeleted),
          isDeactivated: Boolean(data.isDeactivated),
          parentFolderId: data.parentFolderId || null,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          url: data.url,
          contentPreview: data.contentPreview,
          encryptedHash: data.encryptedHash || '',
          userId: data.userId || 'unknown',
        };
      });
      onUpdate(items);
    },
    (err) => {
      console.warn('Firestore Admin subscribeToAllFiles error:', err);
      if (onError) onError(err);
    }
  );
};

/**
 * Admin: Real-time subscription to ALL folders created on the platform.
 */
export const subscribeToAllFolders = (
  onUpdate: (folders: any[]) => void,
  onError?: (err: any) => void
) => {
  const foldersRef = collection(db, 'folders');
  return onSnapshot(
    foldersRef,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || 'Untitled Folder',
          parentFolderId: data.parentFolderId || null,
          color: data.color || '#556B2F',
          createdAt: data.createdAt || new Date().toISOString(),
          isDeleted: Boolean(data.isDeleted),
          userId: data.userId || 'unknown',
        };
      });
      onUpdate(items);
    },
    (err) => {
      console.warn('Firestore Admin subscribeToAllFolders error:', err);
      if (onError) onError(err);
    }
  );
};

/**
 * Admin: Toggle user status (active <-> deactivated)
 */
export const updateUserStatusInFirestore = async (userId: string, status: 'active' | 'deactivated') => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { status });
};

/**
 * Admin: Update user storage limit in MB
 */
export const updateUserStorageLimitInFirestore = async (userId: string, storageLimitMB: number) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { storageLimitMB });
};

/**
 * Admin: Set a new password for any user directly in Firestore
 */
export const updateUserPasswordInFirestore = async (userId: string, newPassword: string) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { password: newPassword });
};

/**
 * Admin: Hard-delete a user profile document from Firestore, plus all associated files & folders.
 */
export const deleteUserFromFirestore = async (userId: string, userEmail?: string) => {
  const userRef = doc(db, 'users', userId);
  await deleteDoc(userRef);

  // Clean up user files
  try {
    const filesSnap = await getDocs(collection(db, 'files'));
    const batch = writeBatch(db);
    let count = 0;
    for (const docSnap of filesSnap.docs) {
      const data = docSnap.data();
      if (data.userId === userId || (userEmail && data.userId === userEmail)) {
        batch.delete(docSnap.ref);
        count++;
        try {
          await localforage.removeItem(`file_content_${docSnap.id}`);
        } catch (e) {}
      }
    }
    if (count > 0) {
      await batch.commit();
    }
  } catch (e) {
    console.warn('Notice purging user files on account deletion:', e);
  }

  // Clean up user folders
  try {
    const foldersSnap = await getDocs(collection(db, 'folders'));
    const batch = writeBatch(db);
    let count = 0;
    for (const docSnap of foldersSnap.docs) {
      const data = docSnap.data();
      if (data.userId === userId || (userEmail && data.userId === userEmail)) {
        batch.delete(docSnap.ref);
        count++;
      }
    }
    if (count > 0) {
      await batch.commit();
    }
  } catch (e) {
    console.warn('Notice purging user folders on account deletion:', e);
  }
};

/**
 * Admin: Soft-deactivate a file (blocking download/view access)
 */
export const adminDeactivateFileInFirestore = async (fileId: string, isDeactivated: boolean) => {
  const fileRef = doc(db, 'files', fileId);
  await updateDoc(fileRef, { isDeactivated });
};

export const saveFileContentLocal = async (fileId: string, blob: Blob) => {
  await localforage.setItem(`file_content_${fileId}`, blob);
};

export const getFileContentLocal = async (fileId: string): Promise<Blob | null> => {
  return await localforage.getItem(`file_content_${fileId}`);
};

/**
  * Subscribe to App Branding & Customization Settings in Firestore (system/branding doc)
  */
export const subscribeToAppBranding = (
  onUpdate: (branding: AppBranding) => void
) => {
  const brandingRef = doc(db, 'system', 'branding');
  return onSnapshot(
    brandingRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          appName: data.appName || DEFAULT_BRANDING.appName,
          appLogoType: data.appLogoType || DEFAULT_BRANDING.appLogoType,
          appLogoIcon: data.appLogoIcon || DEFAULT_BRANDING.appLogoIcon,
          appLogoUrl: data.appLogoUrl || '',
          primaryColor: data.primaryColor || DEFAULT_BRANDING.primaryColor,
          footerText: data.footerText || DEFAULT_BRANDING.footerText,
          footerSubtext: data.footerSubtext || DEFAULT_BRANDING.footerSubtext,
          termsTitle: data.termsTitle || DEFAULT_BRANDING.termsTitle,
          termsContent: data.termsContent || DEFAULT_BRANDING.termsContent,
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      } else {
        onUpdate(DEFAULT_BRANDING);
      }
    },
    (err) => {
      console.warn('App branding snapshot notice:', err);
      onUpdate(DEFAULT_BRANDING);
    }
  );
};

/**
  * Update App Branding & Customization Settings in Firestore
  */
export const updateAppBrandingInFirestore = async (branding: AppBranding) => {
  const brandingRef = doc(db, 'system', 'branding');
  const payload = {
    ...branding,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(brandingRef, payload, { merge: true });
};

