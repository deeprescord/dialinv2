import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  url: string;
  zoom?: number; // 1 = 100%
  className?: string;
  onLoadSuccess?: (numPages: number) => void;
  onError?: (error: any) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ url, zoom = 1, className, onLoadSuccess, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setContainerWidth(w);
      }
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    onLoadSuccess?.(numPages);
  };

  return (
    <div ref={containerRef} className={className}>
      <Document file={url} onLoadSuccess={handleLoadSuccess} onLoadError={onError} loading={<div className="p-8 text-foreground/70">Loading PDF…</div>}>
        {Array.from(new Array(numPages), (el, index) => (
          <div key={`page_${index + 1}`} className="flex justify-center bg-background">
            <Page
              pageNumber={index + 1}
              width={Math.min(1440, containerWidth)}
              scale={zoom}
              renderTextLayer
              renderAnnotationLayer
            />
          </div>
        ))}
      </Document>
    </div>
  );
};

export default PdfViewer;
