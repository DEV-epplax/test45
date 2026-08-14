import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FileItem } from '../types';
import { getFileContentLocal } from '../services/vaultService';
import { formatBytes, formatDate } from '../utils/formatters';
import { PdfViewer } from './PdfViewer';
import {
  X,
  ShieldCheck,
  Share2,
  Download,
  Copy,
  Check,
  Lock,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ExternalLink
} from 'lucide-react';

interface CustomMediaPlayerProps {
  src: string;
  type: 'audio' | 'video';
  fileName: string;
}

export const CustomMediaPlayer: React.FC<CustomMediaPlayerProps> = ({ src, type, fileName }) => {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Sync state on source change
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [src]);

  const togglePlay = () => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
      setIsPlaying(false);
    } else {
      mediaRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => console.error("Playback failed:", err));
    }
  };

  const handleTimeUpdate = () => {
    if (!mediaRef.current) return;
    setCurrentTime(mediaRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!mediaRef.current) return;
    setDuration(mediaRef.current.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!mediaRef.current) return;
    const val = parseFloat(e.target.value);
    mediaRef.current.currentTime = val;
    setCurrentTime(val);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!mediaRef.current) return;
    const val = parseFloat(e.target.value);
    setVolume(val);
    mediaRef.current.volume = val;
    if (val > 0) {
      setIsMuted(false);
      mediaRef.current.muted = false;
    }
  };

  const toggleMute = () => {
    if (!mediaRef.current) return;
    const muted = !isMuted;
    setIsMuted(muted);
    mediaRef.current.muted = muted;
  };

  const handleRestart = () => {
    if (!mediaRef.current) return;
    mediaRef.current.currentTime = 0;
    setCurrentTime(0);
    if (!isPlaying) {
      mediaRef.current.play().then(() => setIsPlaying(true));
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (!mediaRef.current) return;
    setPlaybackRate(rate);
    mediaRef.current.playbackRate = rate;
    setShowSpeedMenu(false);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const triggerFullscreen = () => {
    if (type !== 'video' || !mediaRef.current) return;
    const videoEl = mediaRef.current as HTMLVideoElement;
    if (videoEl.requestFullscreen) {
      videoEl.requestFullscreen();
    } else if ((videoEl as any).webkitRequestFullscreen) {
      (videoEl as any).webkitRequestFullscreen();
    } else if ((videoEl as any).msRequestFullscreen) {
      (videoEl as any).msRequestFullscreen();
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-2 bg-slate-900/30 rounded-2xl border border-olive-sage/10 max-w-2xl mx-auto space-y-4">
      {type === 'video' ? (
        <div className="relative group/video w-full rounded-xl overflow-hidden aspect-video bg-black/80 flex items-center justify-center shadow-2xl border border-white/5">
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={src}
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          />
          {/* Central Play/Pause Overlay */}
          {!isPlaying && (
            <button 
              onClick={togglePlay}
              className="absolute p-4 rounded-full bg-olive-primary/90 text-white shadow-xl hover:scale-110 active:scale-95 transition-all z-10"
            >
              <Play size={24} className="fill-white translate-x-0.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="w-full p-6 flex flex-col items-center justify-center space-y-3 bg-gradient-to-b from-olive-light/20 to-slate-900/40 rounded-xl border border-olive-sage/10 shadow-inner">
          <div className="p-3.5 rounded-full bg-olive-primary/10 text-olive-primary dark:text-olive-sage animate-pulse">
            <Music size={36} />
          </div>
          <div className="text-center">
            <p className="font-bold text-xs text-slate-800 dark:text-cream truncate max-w-sm">{fileName}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Encrypted Local Playback</p>
          </div>
          <audio
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={src}
            className="hidden"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          />
        </div>
      )}

      {/* Stylish Glass Player Controls */}
      <div className="w-full bg-white/5 dark:bg-slate-950/40 backdrop-blur-md rounded-xl p-3 border border-olive-sage/10 flex flex-col gap-2 shadow-lg">
        {/* Progress Bar Row */}
        <div className="flex items-center gap-2 w-full">
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 min-w-[32px]">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800 accent-olive-primary cursor-pointer hover:h-1.5 transition-all"
          />
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 min-w-[32px] text-right">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons Control Row */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-olive-primary text-white hover:bg-olive-dark shadow-md transition-all active:scale-95"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-white" />}
            </button>

            {/* Restart */}
            <button
              onClick={handleRestart}
              className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 transition-colors"
              title="Restart"
            >
              <RotateCcw size={14} />
            </button>

            {/* Speed controller */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 rounded text-[10px] font-mono font-bold hover:bg-white/10 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 border border-olive-sage/20 flex items-center gap-1"
                title="Playback Speed"
              >
                <span>{playbackRate}x</span>
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-8 left-0 bg-white dark:bg-[#1E241E] border border-olive-sage/30 rounded-lg shadow-xl py-0.5 w-16 z-20 text-[10px] text-slate-700 dark:text-cream font-mono">
                  {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={`w-full text-left px-2 py-1 hover:bg-olive-light/40 dark:hover:bg-slate-800 ${
                        playbackRate === rate ? 'text-olive-primary font-bold' : ''
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-900/40 px-2 py-1 rounded-lg border border-olive-sage/10">
            <button
              onClick={toggleMute}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-cream transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-14 sm:w-16 h-1 rounded-full bg-slate-200 dark:bg-slate-800 accent-olive-primary cursor-pointer"
            />
          </div>

          {/* Fullscreen for video */}
          {type === 'video' ? (
            <button
              onClick={triggerFullscreen}
              className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 transition-colors"
              title="Fullscreen"
            >
              <Maximize size={14} />
            </button>
          ) : (
            <div className="w-8 h-8" />
          )}
        </div>
      </div>
    </div>
  );
};

interface FilePreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
  onShare: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  showToast: (msg: string) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
  onShare,
  onDownload,
  showToast,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  
  // States and refs for grab-to-pan image movement
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag with left click
    if (e.button !== 0 || !imageContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - imageContainerRef.current.offsetLeft);
    setStartY(e.pageY - imageContainerRef.current.offsetTop);
    setScrollLeft(imageContainerRef.current.scrollLeft);
    setScrollTop(imageContainerRef.current.scrollTop);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !imageContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - imageContainerRef.current.offsetLeft;
    const y = e.pageY - imageContainerRef.current.offsetTop;
    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;
    imageContainerRef.current.scrollLeft = scrollLeft - walkX;
    imageContainerRef.current.scrollTop = scrollTop - walkY;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };
  
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [localText, setLocalText] = useState<string | null>(null);

  React.useEffect(() => {
    let objectUrl = '';
    
    if (file) {
      // Clean up previous
      setLocalUrl(null);
      setLocalText(file.contentPreview || null);
      
      getFileContentLocal(file.id).then((blob) => {
        if (blob) {
          const ext = file.extension.toLowerCase();
          let typedBlob = blob;
          
          // Re-create Blob with correct MIME type to force proper browser handling
          if (ext === 'pdf') {
            typedBlob = new Blob([blob], { type: 'application/pdf' });
          } else if (file.mimeType && file.mimeType.startsWith('image/')) {
            typedBlob = new Blob([blob], { type: file.mimeType });
          } else if (file.mimeType && file.mimeType.startsWith('video/')) {
            typedBlob = new Blob([blob], { type: file.mimeType });
          } else if (file.mimeType && file.mimeType.startsWith('audio/')) {
            typedBlob = new Blob([blob], { type: file.mimeType });
          } else if (file.mimeType) {
            typedBlob = new Blob([blob], { type: file.mimeType });
          }

          objectUrl = URL.createObjectURL(typedBlob);
          setLocalUrl(objectUrl);
          
          // If it's a text file, read it
          const isTxt = ['txt', 'md', 'json', 'csv', 'js', 'ts', 'html', 'css'].includes(ext) || file.mimeType.startsWith('text/');
          if (isTxt) {
            const reader = new FileReader();
            reader.onload = (e) => setLocalText(e.target?.result as string);
            reader.readAsText(blob);
          }
        }
      });
    }
    
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file]);


  const pdfUrl = useMemo(() => {
    if (!file || !localUrl) return null;
    return localUrl;
  }, [file, localUrl]);

  const handleOpenInNewTab = () => {
    if (!localUrl || !file) return;
    
    // Open the local decrypted Blob URL directly in a new tab via dynamic link-click.
    // This allows browser native viewer handles for PDF/Images with correct origin resolution.
    const a = document.createElement('a');
    a.href = localUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Document opened in a new tab!');
  };


  if (!file) return null;

  const fallbackImage = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop';
  const displayImageUrl = imageError || !localUrl ? fallbackImage : localUrl;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(file.encryptedHash);
    setCopiedHash(true);
    showToast('Cryptographic hash copied to clipboard!');
    setTimeout(() => setCopiedHash(false), 2500);
  };

  const isPdf = file.extension === 'pdf' || (file.mimeType && file.mimeType.toLowerCase().includes('pdf')) || (file.name && file.name.toLowerCase().endsWith('.pdf'));
  const isImage = file.category === 'image';

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(300, prev + 25));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(50, prev - 25));
  const handleZoomReset = () => setZoomLevel(100);


  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200 ${isFullScreen ? 'p-0' : 'p-2 sm:p-4'}`}>
      <div className={`glass-modal w-full shadow-2xl border border-olive-sage/30 space-y-3 sm:space-y-4 relative text-slate-800 dark:text-cream flex flex-col transition-all duration-300 ${
        isFullScreen
          ? 'h-full max-w-none rounded-none p-4 sm:p-6 bg-slate-950/95 text-white'
          : 'max-w-3xl rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 h-[88vh] sm:h-auto max-h-[88vh] sm:max-h-[90vh] overflow-hidden'
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between border-b border-olive-sage/20 pb-2.5 sm:pb-3 shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 pr-2 min-w-0 flex-1">
            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-olive-primary text-white shadow-md shrink-0">
              {file.category === 'image' && <ImageIcon size={18} className="sm:w-[22px] sm:h-[22px]" />}
              {file.category === 'document' && <FileText size={18} className="sm:w-[22px] sm:h-[22px]" />}
              {file.category === 'video' && <Film size={18} className="sm:w-[22px] sm:h-[22px]" />}
              {file.category === 'audio' && <Music size={18} className="sm:w-[22px] sm:h-[22px]" />}
              {file.category === 'other' && <Lock size={18} className="sm:w-[22px] sm:h-[22px]" />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm sm:text-lg text-slate-900 dark:text-white leading-snug truncate" title={file.name}>
                {file.name}
              </h3>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono font-medium">{formatBytes(file.size)}</span>
                <span className="inline">•</span>
                <span className="truncate">Uploaded {formatDate(file.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Open in New Tab Button */}
            <button
              onClick={handleOpenInNewTab}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-cream hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Open in New Tab / Window"
            >
              <ExternalLink size={16} className="sm:w-[20px] sm:h-[20px]" />
            </button>

            {/* Toggle Full Screen Button */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-cream hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Preview'}
            >
              {isFullScreen ? <Minimize2 size={16} className="sm:w-[20px] sm:h-[20px]" /> : <Maximize2 size={16} className="sm:w-[20px] sm:h-[20px]" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-cream hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X size={16} className="sm:w-[20px] sm:h-[20px]" />
            </button>
          </div>
        </div>

        {/* Media / Text Content Preview Area */}
        <div className={`rounded-xl sm:rounded-2xl overflow-hidden bg-slate-900/90 border border-olive-sage/30 flex flex-col items-center justify-center relative ${
          isPdf ? 'p-0' : 'p-2 sm:p-3'
        } ${
          isFullScreen ? 'flex-1 min-h-[300px] sm:min-h-[450px]' : 'flex-1 min-h-[200px] sm:min-h-[280px] max-h-[55vh] sm:max-h-[500px] w-full'
        }`}>
          {/* Zoom Toolbar for Image only (PDF has its own inline controls) */}
          {isImage && (
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 backdrop-blur border border-slate-700/80 text-white shadow-lg text-xs">
              <button
                onClick={handleZoomOut}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Zoom Out (-)"
              >
                <ZoomOut size={16} />
              </button>
              <span className="font-mono text-[11px] px-1.5 text-emerald-400 font-bold min-w-[36px] text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Zoom In (+)"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={handleZoomReset}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-0.5 border-l border-slate-800 pl-1.5"
                title="Reset Zoom"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          )}

          {isPdf ? (
            <PdfViewer fileId={file.id} fileName={file.name} isFullScreen={isFullScreen} />
          ) : isImage ? (
            <div
              ref={imageContainerRef}
              className={`w-full h-full flex items-center justify-center overflow-auto p-2 cursor-grab ${
                isDragging ? 'cursor-grabbing select-none' : ''
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onWheel={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  e.preventDefault();
                  if (e.deltaY < 0) handleZoomIn();
                  else handleZoomOut();
                }
              }}
            >
              <img
                src={displayImageUrl}
                alt={file.name}
                onError={() => setImageError(true)}
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                }}
                className={`w-auto object-contain rounded-xl max-w-full ${
                  isFullScreen ? 'max-h-[80vh]' : 'max-h-[380px]'
                }`}
                referrerPolicy="no-referrer"
                draggable="false"
              />
            </div>
          ) : (file.category === 'video' || file.category === 'audio') && !localUrl ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-olive-primary/20 border-t-olive-primary animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Decrypting secure media stream...</p>
            </div>
          ) : file.category === 'video' && localUrl ? (
            <CustomMediaPlayer src={localUrl} type="video" fileName={file.name} />
          ) : file.category === 'audio' && localUrl ? (
            <CustomMediaPlayer src={localUrl} type="audio" fileName={file.name} />
          
          ) : localText ? (
            <div className="w-full h-full flex flex-col space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800">
                <span className="font-mono text-[11px] text-emerald-400 font-semibold truncate max-w-[150px] sm:max-w-none">
                  File Content ({file.name})
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(localText || '');
                    showToast('File content copied to clipboard!');
                  }}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1 text-[10px] shrink-0"
                >
                  <Copy size={12} />
                  <span>Copy Text</span>
                </button>
              </div>
              <div className="w-full flex-1 p-2 sm:p-3 overflow-y-auto bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed select-text min-h-[180px] max-h-[60vh]">
                {localText}
              </div>
            </div>
          ) : localUrl ? (
            <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-xl p-1 bg-white">
              <iframe src={localUrl} title={file.name} className="w-full h-[420px] min-h-[280px] rounded-xl border border-slate-800 bg-white" />
            </div>
          ) : (

            <div className="p-8 text-center text-slate-300 space-y-3">
              <Lock size={48} className="mx-auto text-olive-sage" />
              <p className="font-medium text-sm">
                Encrypted File Document
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                This file is encrypted on client-side using 256-bit AES-GCM. Decrypt & Download to access full binary stream.
              </p>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-end gap-2 sm:gap-3 pt-2.5 sm:pt-3 border-t border-olive-sage/10 shrink-0">
          <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 rounded-xl border border-olive-sage/40 font-semibold text-xs text-slate-700 dark:text-cream hover:bg-olive-light dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span className="truncate text-[10px] sm:text-xs">{isFullScreen ? 'Exit' : 'Full Screen'}</span>
            </button>

            <button
              onClick={handleOpenInNewTab}
              className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 rounded-xl border border-olive-sage/40 font-semibold text-xs text-slate-700 dark:text-cream hover:bg-olive-light dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
              title="Open in new window / tab"
            >
              <ExternalLink size={14} />
              <span className="truncate text-[10px] sm:text-xs">New Tab</span>
            </button>

            <button
              onClick={() => onShare(file)}
              className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 rounded-xl border border-olive-sage/40 font-semibold text-xs text-slate-700 dark:text-cream hover:bg-olive-light dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <Share2 size={14} />
              <span className="truncate text-[10px] sm:text-xs">Share</span>
            </button>
          </div>

          <button
            onClick={() => onDownload(file)}
            className="w-full md:w-auto px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-xs bg-olive-primary hover:bg-olive-dark text-white shadow-lg shadow-olive-primary/20 transition-all flex items-center justify-center gap-2"
          >
            <Download size={16} />
            <span>Decrypt & Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface ShareModalProps {
  file: FileItem | null;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ file, onClose, showToast }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [passwordProtect, setPasswordProtect] = useState(true);
  const [expirationDays, setExpirationDays] = useState('7');


  if (!file) return null;

  const shareableUrl = `https://iffl.cloud/v2/share/enc_${file.id}?hash=${file.encryptedHash.substring(0, 12)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    showToast('Secure shareable link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-md rounded-3xl p-6 shadow-2xl border border-olive-sage/30 space-y-4 relative text-slate-800 dark:text-cream">
        <div className="flex items-center justify-between border-b border-olive-sage/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-olive-primary text-white">
              <Share2 size={18} />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Share Encrypted File
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-cream"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400">
          Generating zero-knowledge encrypted link for <strong className="text-slate-900 dark:text-white">{file.name}</strong>.
        </p>

        {/* Link Input Box */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Shareable URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareableUrl}
              className="w-full px-3 py-2 rounded-xl text-xs bg-white/70 dark:bg-slate-800/70 border border-olive-sage/40 font-mono text-slate-800 dark:text-cream select-all focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 rounded-xl bg-olive-primary hover:bg-olive-dark text-white font-semibold text-xs shrink-0 flex items-center gap-1 shadow-sm"
            >
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Link Options */}
        <div className="space-y-2 pt-2 border-t border-olive-sage/20 text-xs">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Password Protection Required
            </span>
            <input
              type="checkbox"
              checked={passwordProtect}
              onChange={(e) => setPasswordProtect(e.target.checked)}
              className="accent-olive-primary w-4 h-4 rounded cursor-pointer"
            />
          </label>

          <div className="flex items-center justify-between pt-1">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Link Expiration
            </span>
            <select
              value={expirationDays}
              onChange={(e) => setExpirationDays(e.target.value)}
              className="bg-white/70 dark:bg-slate-800/70 border border-olive-sage/40 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none"
            >
              <option value="1">24 Hours</option>
              <option value="7">7 Days</option>
              <option value="30">30 Days</option>
              <option value="0">Never</option>
            </select>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-semibold text-xs bg-olive-primary hover:bg-olive-dark text-white shadow-md transition-all mt-2"
        >
          Done
        </button>
      </div>
    </div>
  );
};
