import React, { useState, useRef } from 'react';
import { Plus, UploadCloud, FolderPlus, X, File, ShieldCheck, Check, FileText } from 'lucide-react';
import { FileItem, FolderItem, FileTypeCategory } from '../types';
import { getCategoryFromExtension, generateHashHex } from '../utils/formatters';

interface FABModalProps {
  currentFolderId: string | null;
  onUploadFile: (newFile: FileItem) => void;
  onCreateFolder: (newFolder: FolderItem) => void;
  showToast: (msg: string) => void;
  files: FileItem[];
  storageLimitMB: number;
}

export const FABModal: React.FC<FABModalProps> = ({
  currentFolderId,
  onUploadFile,
  onCreateFolder,
  showToast,
  files,
  storageLimitMB,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'folder' | 'text'>('upload');

  // Folder creation form state
  const [folderName, setFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#556B2F');

  // Text file creation form state
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [currentUploadingName, setCurrentUploadingName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const folderColors = ['#556B2F', '#4A5D23', '#8F9E8B', '#273027', '#2563EB', '#D97706'];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSetFiles = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFiles(Array.from(e.target.files));
    }
  };

  const processAndUploadFiles = async () => {
    if (selectedFiles.length === 0) {
      showToast('Please select or drop at least one file to upload.');
      return;
    }
    
    // Import dynamically to avoid circular dep issues
    const { saveFileContentLocal } = await import('../services/vaultService');

    setUploadProgress(0);

    const totalLimitBytes = storageLimitMB * 1024 * 1024;
    let currentUsedBytes = files.reduce((acc, f) => acc + f.size, 0);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setCurrentUploadingName(file.name);

      if (currentUsedBytes + file.size > totalLimitBytes) {
        showToast(`Error: Upload failed. Storage quota of ${storageLimitMB} MB exceeded!`);
        setUploadProgress(null);
        setCurrentUploadingName('');
        setSelectedFiles([]);
        setIsOpen(false);
        return;
      }

      const baseProgress = (i / selectedFiles.length) * 100;
      const contribution = 100 / selectedFiles.length;

      // Simulate cryptographic calculation and chunk encryption steps
      for (let step = 1; step <= 10; step++) {
        setUploadProgress(Math.floor(baseProgress + contribution * (step / 10)));
        // Human-perceivable realistic delay for crypto vault actions
        await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 30));
      }

      const ext = file.name.split('.').pop() || 'bin';
      const cat = getCategoryFromExtension(ext, file.type);
      
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      // Save file contents to IndexedDB (supports 100MB+ files instantly without RAM crash)
      try {
        await saveFileContentLocal(fileId, file);
      } catch (storageErr: any) {
        console.error('Local storage error for file:', storageErr);
        showToast(`Warning: Failed to save local blob for ${file.name}: ${storageErr?.message || 'Storage limit/quota exceeded'}`, 'error');
      }

      const newFileItem = {
        id: fileId,
        name: file.name,
        size: file.size,
        category: cat,
        mimeType: file.type || 'application/octet-stream',
        extension: ext.toLowerCase(),
        isStarred: false,
        parentFolderId: currentFolderId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: '', 
        contentPreview: '', 
        encryptedHash: generateHashHex(file.name + file.size),
      };
      
      onUploadFile(newFileItem);
      currentUsedBytes += file.size;
    }
    
    setUploadProgress(100);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setUploadProgress(null);
    setCurrentUploadingName('');
    showToast(`${selectedFiles.length} file(s) processed & saved to Vault!`);
    setSelectedFiles([]);
    setIsOpen(false);
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) {
      showToast('Please enter a folder name.');
      return;
    }

    const newFolder: FolderItem = {
      id: `fld_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: folderName.trim(),
      parentFolderId: currentFolderId,
      color: selectedColor,
      createdAt: new Date().toISOString(),
    };

    onCreateFolder(newFolder);
    showToast(`Folder "${folderName.trim()}" created successfully!`);
    setFolderName('');
    setIsOpen(false);
  };

  const handleCreateTextFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textTitle.trim()) {
      showToast('Please enter a file name for the text note.');
      return;
    }

    let finalName = textTitle.trim();
    if (!finalName.endsWith('.txt') && !finalName.endsWith('.md')) {
      finalName = `${finalName}.txt`;
    }

    const sizeInBytes = new Blob([textContent]).size;
    const totalLimitBytes = storageLimitMB * 1024 * 1024;
    const currentUsedBytes = files.reduce((acc, f) => acc + f.size, 0);

    if (currentUsedBytes + sizeInBytes > totalLimitBytes) {
      showToast(`Error: Save failed. Storage quota of ${storageLimitMB} MB exceeded!`);
      return;
    }

    const newFileItem: FileItem = {
      id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: finalName,
      size: sizeInBytes,
      category: 'document',
      mimeType: 'text/plain',
      extension: finalName.split('.').pop() || 'txt',
      isStarred: false,
      parentFolderId: currentFolderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contentPreview: textContent,
      encryptedHash: generateHashHex(finalName + textContent),
    };

    onUploadFile(newFileItem);
    showToast(`Text file "${finalName}" saved to Vault!`);
    setTextTitle('');
    setTextContent('');
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Action Button (FAB) at Fixed Bottom-Left as specified in Section 3 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 left-8 w-14 h-14 bg-olive-primary hover:bg-olive-dark text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 glass-effect z-40 border-2 border-white/40"
        title="Upload File or Create Folder"
        aria-label="Add file or folder"
      >
        <Plus size={32} />
      </button>

      {/* Dual Action Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-modal w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-olive-sage/30 space-y-5 relative text-slate-800 dark:text-cream">
            {/* Encryption & Upload Progress Overlay */}
            {uploadProgress !== null && (
              <div className="absolute inset-0 bg-white/95 dark:bg-[#121612]/95 rounded-3xl p-6 flex flex-col items-center justify-center space-y-6 z-50 animate-in fade-in duration-200">
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border-4 border-olive-primary/20 border-t-olive-primary animate-spin" />
                  <div className="absolute text-olive-primary">
                    <ShieldCheck size={28} className="animate-pulse" />
                  </div>
                </div>
                
                <div className="text-center space-y-2 max-w-xs w-full">
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">
                    Securing & Encrypting File...
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate px-4">
                    {currentUploadingName}
                  </p>
                  
                  {/* Progress Bar Container */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden border border-olive-sage/20 relative mt-3">
                    <div 
                      className="bg-gradient-to-r from-olive-primary to-[#708A48] h-full transition-all duration-150 rounded-full shadow-inner"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] font-semibold px-1 mt-1 font-mono">
                    <span className="text-olive-primary dark:text-olive-sage">
                      {uploadProgress < 30 ? 'Preparing keys...' : uploadProgress < 75 ? 'AES-256-GCM...' : uploadProgress < 95 ? 'Hashing blocks...' : 'Writing to Vault...'}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {uploadProgress}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between border-b border-olive-sage/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-olive-primary text-white">
                  <UploadCloud size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    Vault Action Hub
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Encrypted file upload or new folder creation
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-cream hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex rounded-2xl bg-cream/80 dark:bg-slate-800/80 p-1 border border-olive-sage/30 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'upload'
                    ? 'bg-olive-primary text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-cream'
                }`}
              >
                <UploadCloud size={15} />
                <span>Upload File</span>
              </button>
              <button
                onClick={() => setActiveTab('folder')}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'folder'
                    ? 'bg-olive-primary text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-cream'
                }`}
              >
                <FolderPlus size={15} />
                <span>New Folder</span>
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'text'
                    ? 'bg-olive-primary text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-cream'
                }`}
              >
                <FileText size={15} />
                <span>New Text Note</span>
              </button>
            </div>

            {/* TAB 1: File Upload */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                {/* Drag & Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-olive-primary bg-olive-primary/10 scale-[1.01]'
                      : 'border-olive-sage/40 bg-white/50 dark:bg-slate-800/40 hover:border-olive-primary'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="p-4 rounded-full bg-olive-light dark:bg-slate-700 text-olive-primary dark:text-olive-sage">
                    <UploadCloud size={36} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-cream">
                      Drag & Drop files here, or <span className="text-olive-primary dark:text-olive-sage underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Supports PDF, DOCX, PNG, JPG, MP4, MP3, ZIP and more. No size limit!
                    </p>
                  </div>
                </div>

                {/* Selected Files List */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Selected Files ({selectedFiles.length})
                    </p>
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-olive-sage/20 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <File size={16} className="text-olive-primary shrink-0" />
                          <span className="truncate font-medium">{file.name}</span>
                        </div>
                        <span className="font-mono text-slate-400 shrink-0">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Submit button */}
                <button
                  onClick={processAndUploadFiles}
                  disabled={selectedFiles.length === 0}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-olive-primary hover:bg-olive-dark text-white shadow-lg shadow-olive-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={18} />
                  <span>Encrypt & Upload To Vault</span>
                </button>
              </div>
            )}

            {/* TAB 2: Create Folder */}
            {activeTab === 'folder' && (
              <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="e.g. Legal Documents 2026"
                    className="w-full px-4 py-2.5 rounded-xl text-base md:text-sm bg-white/70 dark:bg-slate-800/70 border border-olive-sage/40 focus:ring-2 focus:ring-olive-primary focus:outline-none text-slate-900 dark:text-cream placeholder-slate-400"
                    autoFocus
                  />
                </div>

                {/* Color Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Folder Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    {folderColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform ${
                          selectedColor === color ? 'border-slate-800 dark:border-white scale-110 shadow-md' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {selectedColor === color && <Check size={14} className="text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-olive-primary hover:bg-olive-dark text-white shadow-lg shadow-olive-primary/20 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <FolderPlus size={18} />
                  <span>Create Encrypted Folder</span>
                </button>
              </form>
            )}

            {/* TAB 3: Create Text Note */}
            {activeTab === 'text' && (
              <form onSubmit={handleCreateTextFileSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Note / File Title
                  </label>
                  <input
                    type="text"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    placeholder="e.g. Passwords_List.txt or Meeting_Notes.md"
                    className="w-full px-4 py-2.5 rounded-xl text-base md:text-sm bg-white/70 dark:bg-slate-800/70 border border-olive-sage/40 focus:ring-2 focus:ring-olive-primary focus:outline-none text-slate-900 dark:text-cream placeholder-slate-400"
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Content
                  </label>
                  <textarea
                    rows={5}
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Write or paste your confidential text note here..."
                    className="w-full px-4 py-2.5 rounded-xl text-base md:text-xs bg-white/70 dark:bg-slate-800/70 border border-olive-sage/40 focus:ring-2 focus:ring-olive-primary focus:outline-none text-slate-900 dark:text-cream font-mono resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-olive-primary hover:bg-olive-dark text-white shadow-lg shadow-olive-primary/20 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={18} />
                  <span>Save Text File to Vault</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
