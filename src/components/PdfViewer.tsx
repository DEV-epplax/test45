import React, { useEffect, useRef, useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { getFileContentLocal } from '../services/vaultService';

interface PdfViewerProps {
  fileId: string;
  fileName: string;
  isFullScreen?: boolean;
}

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ fileId, fileName, isFullScreen = false }) => {
  const [libLoaded, setLibLoaded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNum, setPageNum] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [renderingPage, setRenderingPage] = useState<boolean>(false);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // States for grab-to-pan PDF canvas movement
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag with left click
    if (e.button !== 0 || !viewportRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - viewportRef.current.offsetLeft);
    setStartY(e.pageY - viewportRef.current.offsetTop);
    setScrollLeft(viewportRef.current.scrollLeft);
    setScrollTop(viewportRef.current.scrollTop);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !viewportRef.current) return;
    e.preventDefault();
    const x = e.pageX - viewportRef.current.offsetLeft;
    const y = e.pageY - viewportRef.current.offsetTop;
    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;
    viewportRef.current.scrollLeft = scrollLeft - walkX;
    viewportRef.current.scrollTop = scrollTop - walkY;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // 1. Load PDF.js from CDN
  useEffect(() => {
    if (window.pdfjsLib) {
      setLibLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        setLibLoaded(true);
      } else {
        setError('Failed to initialize PDF library.');
        setLoading(false);
      }
    };
    script.onerror = () => {
      setError('Could not load secure PDF parser engine from CDN.');
      setLoading(false);
    };
    document.body.appendChild(script);
  }, []);

  // 2. Load PDF document from local storage decrypted Blob
  useEffect(() => {
    if (!libLoaded) return;

    let isCancelled = false;
    setLoading(true);
    setError(null);

    const loadDocument = async () => {
      try {
        const blob = await getFileContentLocal(fileId);
        if (!blob) {
          throw new Error('Could not retrieve file content from local vault.');
        }

        const arrayBuffer = await blob.arrayBuffer();
        if (isCancelled) return;

        const loadingTask = window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdf = await loadingTask.promise;
        
        if (isCancelled) return;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setPageNum(1);
        setLoading(false);
      } catch (err: any) {
        console.error('Error loading PDF document:', err);
        if (!isCancelled) {
          setError(err.message || 'Error processing the PDF document. It might be corrupted or in an incompatible format.');
          setLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      isCancelled = true;
    };
  }, [fileId, libLoaded]);

  // 3. Render PDF Page onto Canvas
  const renderPage = async (pageNo: number, currentScale: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    // Cancel any ongoing rendering task to prevent concurrency glitches
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    setRenderingPage(true);

    try {
      const page = await pdfDoc.getPage(pageNo);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      // Adjust viewport based on container width if scale is auto/1
      const containerWidth = containerRef.current?.clientWidth || 600;
      let calculatedScale = currentScale;
      
      // Calculate fit scale if container is small
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      if (currentScale === 1.0 && unscaledViewport.width > containerWidth) {
        calculatedScale = (containerWidth - 24) / unscaledViewport.width;
      }

      const viewport = page.getViewport({ scale: calculatedScale });
      
      // Support high-DPI displays (retina) for ultra-sharp text
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = viewport.width * pixelRatio;
      canvas.height = viewport.height * pixelRatio;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      context.restore();
      context.save();
      context.scale(pixelRatio, pixelRatio);

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      await renderTask.promise;
      renderTaskRef.current = null;
      setRenderingPage(false);
    } catch (err: any) {
      if (err.name !== 'RenderingCancelledException') {
        console.error('Page render error:', err);
        setRenderingPage(false);
      }
    }
  };

  // Re-render page whenever pageNum, scale, or pdfDoc changes
  useEffect(() => {
    if (pdfDoc) {
      renderPage(pageNum, scale);
    }
  }, [pdfDoc, pageNum, scale]);

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      if (pdfDoc) {
        renderPage(pageNum, scale);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [pdfDoc, pageNum, scale]);

  const changePage = (offset: number) => {
    setPageNum((prev) => {
      const next = prev + offset;
      return next >= 1 && next <= numPages ? next : prev;
    });
  };

  const handleZoom = (factor: number) => {
    setScale((prev) => {
      const next = parseFloat((prev * factor).toFixed(1));
      return next >= 0.5 && next <= 3.0 ? next : prev;
    });
  };

  const handleZoomReset = () => {
    setScale(1.0);
  };

  return (
    <div 
      ref={containerRef}
      className="w-full flex flex-col h-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800"
    >
      {/* Viewer controls */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 bg-slate-950/90 text-white border-b border-slate-800 gap-1.5 sm:gap-2 z-10">
        {/* Left: Info (Hidden on mobile to save space and align controls perfectly) */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0 max-w-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
          <span className="text-xs font-bold font-mono text-slate-300 truncate" title={fileName}>
            {fileName}
          </span>
        </div>

        {/* Center: Pagination controls */}
        {!loading && !error && numPages > 0 && (
          <div className="flex items-center gap-1 shrink-0 bg-slate-900/60 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-slate-800">
            <button
              onClick={() => changePage(-1)}
              disabled={pageNum <= 1}
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer text-slate-300 hover:text-white"
              title="Previous Page"
            >
              <ChevronLeft size={14} className="sm:w-[16px] sm:h-[16px]" />
            </button>
            <span className="text-[9px] sm:text-[11px] font-mono font-bold px-1 text-slate-300 min-w-[55px] sm:min-w-[70px] text-center">
              {pageNum} / {numPages}
            </span>
            <button
              onClick={() => changePage(1)}
              disabled={pageNum >= numPages}
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer text-slate-300 hover:text-white"
              title="Next Page"
            >
              <ChevronRight size={14} className="sm:w-[16px] sm:h-[16px]" />
            </button>
          </div>
        )}

        {/* Right: Zoom controls */}
        {!loading && !error && (
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <button
              onClick={() => handleZoom(0.8)}
              disabled={scale <= 0.6}
              className="p-1 sm:p-1.5 rounded hover:bg-slate-800 transition-all text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={12} className="sm:w-[14px] sm:h-[14px]" />
            </button>
            <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-400 min-w-[30px] sm:min-w-[40px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => handleZoom(1.2)}
              disabled={scale >= 2.8}
              className="p-1 sm:p-1.5 rounded hover:bg-slate-800 transition-all text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={12} className="sm:w-[14px] sm:h-[14px]" />
            </button>
            <button
              onClick={handleZoomReset}
              disabled={scale === 1.0}
              className="p-1 sm:p-1.5 rounded hover:bg-slate-800 transition-all text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer border-l border-slate-800 pl-1.5 sm:pl-2 ml-0.5 sm:ml-1"
              title="Reset Zoom"
            >
              <RotateCcw size={11} className="sm:w-[13px] sm:h-[13px]" />
            </button>
          </div>
        )}
      </div>

      {/* Viewport display container with grab-to-pan mouse controls */}
      <div 
        ref={viewportRef}
        className={`flex-1 w-full flex items-center justify-center overflow-auto p-2 sm:p-4 bg-slate-950/30 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent min-h-[220px] sm:min-h-[360px] relative h-[280px] sm:h-[420px] cursor-grab ${
          isDragging ? 'cursor-grabbing select-none' : ''
        }`}
        style={isFullScreen ? { height: 'calc(100vh - 160px)' } : undefined}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-3 p-8">
            <Loader2 className="w-8 h-8 text-olive-primary animate-spin" />
            <p className="text-xs text-slate-400 font-medium font-mono">Decrypting and loading PDF pages securely...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center space-y-3 p-8 max-w-sm text-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-xs text-red-400 font-bold font-mono">Failed to load PDF</p>
            <p className="text-[11px] text-slate-400">{error}</p>
          </div>
        ) : (
          <div className="relative shadow-2xl rounded-lg border border-slate-800 bg-white overflow-hidden max-w-full">
            <canvas ref={canvasRef} className="max-w-full block" />
            {renderingPage && (
              <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                <Loader2 className="w-6 h-6 text-olive-primary animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer information */}
      {!loading && !error && (
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>AES-256 decrypted locally</span>
          <span>Security-sandboxed view</span>
        </div>
      )}
    </div>
  );
};
