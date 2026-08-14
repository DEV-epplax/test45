import { FileTypeCategory } from '../types';

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getCategoryFromExtension(ext: string, mimeType?: string): FileTypeCategory {
  const extension = ext.toLowerCase().replace('.', '');
  
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'];
  const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'md'];
  const videoExts = ['mp4', 'mkv', 'mov', 'avi', 'webm', 'wmv', 'flv'];
  const audioExts = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'];

  if (imageExts.includes(extension) || mimeType?.startsWith('image/')) return 'image';
  if (docExts.includes(extension) || mimeType?.includes('pdf') || mimeType?.includes('document') || mimeType?.includes('text/')) return 'document';
  if (videoExts.includes(extension) || mimeType?.startsWith('video/')) return 'video';
  if (audioExts.includes(extension) || mimeType?.startsWith('audio/')) return 'audio';
  
  return 'other';
}

export function generateHashHex(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const positiveHash = Math.abs(hash).toString(16).padStart(8, '0');
  return `a7f9${positiveHash}e4c82901b34${positiveHash}f81a`;
}

export function generateStrongPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|';
  const all = uppercase + lowercase + numbers + symbols;

  let pwd = '';
  // Ensure at least one of each category
  pwd += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  pwd += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  pwd += numbers.charAt(Math.floor(Math.random() * numbers.length));
  pwd += symbols.charAt(Math.floor(Math.random() * symbols.length));

  for (let i = 4; i < 12; i++) {
    pwd += all.charAt(Math.floor(Math.random() * all.length));
  }

  // Shuffle the 12 characters
  return pwd.split('').sort(() => 0.5 - Math.random()).join('');
}

export interface FormatBadgeConfig {
  label: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

export function getFormatBadgeConfig(extension: string, category: string, mimeType?: string): FormatBadgeConfig {
  const ext = (extension || '').toLowerCase().replace('.', '');
  const mime = (mimeType || '').toLowerCase();

  if (ext === 'pdf' || mime.includes('pdf')) {
    return {
      label: 'PDF',
      bgClass: 'bg-rose-500/15 dark:bg-rose-900/40',
      borderClass: 'border-rose-500/40',
      textClass: 'text-rose-600 dark:text-rose-300',
    };
  }

  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'ico'].includes(ext) || category === 'image' || mime.startsWith('image/')) {
    return {
      label: `IMG • ${ext.toUpperCase() || 'PNG'}`,
      bgClass: 'bg-emerald-500/15 dark:bg-emerald-900/40',
      borderClass: 'border-emerald-500/40',
      textClass: 'text-emerald-700 dark:text-emerald-300',
    };
  }

  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'].includes(ext) || category === 'video' || mime.startsWith('video/')) {
    return {
      label: `VED • ${ext.toUpperCase() || 'MP4'}`,
      bgClass: 'bg-purple-500/15 dark:bg-purple-900/40',
      borderClass: 'border-purple-500/40',
      textClass: 'text-purple-700 dark:text-purple-300',
    };
  }

  if (['mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac'].includes(ext) || category === 'audio' || mime.startsWith('audio/')) {
    return {
      label: `AUD • ${ext.toUpperCase() || 'MP3'}`,
      bgClass: 'bg-amber-500/15 dark:bg-amber-900/40',
      borderClass: 'border-amber-500/40',
      textClass: 'text-amber-700 dark:text-amber-300',
    };
  }

  if (['doc', 'docx', 'txt', 'rtf', 'odt', 'pages'].includes(ext) || category === 'document') {
    return {
      label: `DOC • ${ext.toUpperCase() || 'TXT'}`,
      bgClass: 'bg-blue-500/15 dark:bg-blue-900/40',
      borderClass: 'border-blue-500/40',
      textClass: 'text-blue-700 dark:text-blue-300',
    };
  }

  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return {
      label: `ZIP • ${ext.toUpperCase()}`,
      bgClass: 'bg-indigo-500/15 dark:bg-indigo-900/40',
      borderClass: 'border-indigo-500/40',
      textClass: 'text-indigo-700 dark:text-indigo-300',
    };
  }

  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'java', 'cpp', 'c', 'php'].includes(ext)) {
    return {
      label: `CODE • ${ext.toUpperCase()}`,
      bgClass: 'bg-orange-500/15 dark:bg-orange-900/40',
      borderClass: 'border-orange-500/40',
      textClass: 'text-orange-700 dark:text-orange-300',
    };
  }

  return {
    label: ext ? ext.toUpperCase() : 'FILE',
    bgClass: 'bg-slate-500/15 dark:bg-slate-800/80',
    borderClass: 'border-slate-500/40',
    textClass: 'text-slate-700 dark:text-slate-300',
  };
}
