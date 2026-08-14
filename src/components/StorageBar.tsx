import React from 'react';
import { FileItem } from '../types';
import { formatBytes } from '../utils/formatters';
import { HardDrive, FileText, Image as ImageIcon, Film, Music, ShieldCheck } from 'lucide-react';

interface StorageBarProps {
  files: FileItem[];
  storageLimitMB: number; // e.g. 1024 MB
}

export const StorageBar: React.FC<StorageBarProps> = ({ files, storageLimitMB }) => {
  const totalLimitBytes = storageLimitMB * 1024 * 1024; // 1 GB in bytes

  // Calculate used bytes per category
  let docsBytes = 0;
  let imagesBytes = 0;
  let videosBytes = 0;
  let audioBytes = 0;
  let othersBytes = 0;

  files.forEach((file) => {
    switch (file.category) {
      case 'document':
        docsBytes += file.size;
        break;
      case 'image':
        imagesBytes += file.size;
        break;
      case 'video':
        videosBytes += file.size;
        break;
      case 'audio':
        audioBytes += file.size;
        break;
      default:
        othersBytes += file.size;
        break;
    }
  });

  const totalUsedBytes = docsBytes + imagesBytes + videosBytes + audioBytes + othersBytes;
  const usedPercentage = Math.min(100, (totalUsedBytes / totalLimitBytes) * 100);

  const docsPct = (docsBytes / totalLimitBytes) * 100;
  const imagesPct = (imagesBytes / totalLimitBytes) * 100;
  const videosPct = (videosBytes / totalLimitBytes) * 100;
  const audioPct = (audioBytes / totalLimitBytes) * 100;
  const othersPct = (othersBytes / totalLimitBytes) * 100;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-olive-sage/30 shadow-md mb-6 space-y-3">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-olive-primary/10 text-olive-primary dark:text-olive-sage">
            <HardDrive size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-cream flex items-center gap-2">
              <span>Encrypted Storage Quota</span>
              <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-olive-light dark:bg-slate-800 text-olive-dark dark:text-olive-sage border border-olive-sage/30">
                {storageLimitMB >= 1024 ? `${(storageLimitMB / 1024).toFixed(0)} GB` : `${storageLimitMB} MB`} Limit
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatBytes(totalUsedBytes)} consumed of {storageLimitMB >= 1024 ? `${(storageLimitMB / 1024).toFixed(0)} GB` : `${storageLimitMB} MB`} limit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-lg font-extrabold text-olive-primary dark:text-olive-sage font-mono">
              {usedPercentage.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Used</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
            <ShieldCheck size={16} />
            <span>AES-256 Vault Active</span>
          </div>
        </div>
      </div>

      {/* Multi-segment Progress Bar */}
      <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
        <div
          style={{ width: `${docsPct}%` }}
          className="bg-blue-600 h-full transition-all duration-500"
          title={`Documents: ${formatBytes(docsBytes)}`}
        />
        <div
          style={{ width: `${imagesPct}%` }}
          className="bg-emerald-600 h-full transition-all duration-500"
          title={`Images: ${formatBytes(imagesBytes)}`}
        />
        <div
          style={{ width: `${videosPct}%` }}
          className="bg-amber-600 h-full transition-all duration-500"
          title={`Videos: ${formatBytes(videosBytes)}`}
        />
        <div
          style={{ width: `${audioPct}%` }}
          className="bg-purple-600 h-full transition-all duration-500"
          title={`Audio: ${formatBytes(audioBytes)}`}
        />
        <div
          style={{ width: `${othersPct}%` }}
          className="bg-slate-500 h-full transition-all duration-500"
          title={`Others: ${formatBytes(othersBytes)}`}
        />
      </div>

      {/* Category breakdown legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 pt-1 text-xs">
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
          <FileText size={13} className="text-blue-600 shrink-0" />
          <span className="truncate">Docs: <strong className="font-mono">{formatBytes(docsBytes)}</strong></span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
          <ImageIcon size={13} className="text-emerald-600 shrink-0" />
          <span className="truncate">Images: <strong className="font-mono">{formatBytes(imagesBytes)}</strong></span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0" />
          <Film size={13} className="text-amber-600 shrink-0" />
          <span className="truncate">Videos: <strong className="font-mono">{formatBytes(videosBytes)}</strong></span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
          <Music size={13} className="text-purple-600 shrink-0" />
          <span className="truncate">Audio: <strong className="font-mono">{formatBytes(audioBytes)}</strong></span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 col-span-2 sm:col-span-1">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
          <span className="truncate">Others: <strong className="font-mono">{formatBytes(othersBytes)}</strong></span>
        </div>
      </div>
    </div>
  );
};
