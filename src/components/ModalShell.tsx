import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Shared popup wrapper. Two display modes, chosen when the popup opens:
 *
 * 1) "fixed"    – normal website: overlay fixed to the screen, panel centred.
 * 2) "anchored" – page embedded in an iframe that is as tall as the whole page
 *                 (Google Sites, Notion, AI Studio preview...). There the
 *                 "screen" is the entire page, so a centred popup lands in the
 *                 middle of the page, far from the user. Instead the panel is
 *                 placed next to where the user last clicked.
 */

// Remember where the user last pressed (page coordinates).
let lastPress: { x: number; y: number } | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointerdown',
    (e) => {
      lastPress = { x: e.pageX, y: e.pageY };
    },
    true
  );
}

const docHeight = () =>
  Math.max(
    document.documentElement.scrollHeight,
    document.body ? document.body.scrollHeight : 0
  );

const isEmbeddedFullHeight = () => {
  try {
    const embedded = window.self !== window.top;
    return embedded && docHeight() - window.innerHeight < 40;
  } catch {
    return true; // cross-origin frame: treat as embedded
  }
};

interface ModalShellProps {
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
}

export const ModalShell: React.FC<ModalShellProps> = ({ onClose, labelledBy, children }) => {
  const [anchored] = useState(isEmbeddedFullHeight);
  const [docH] = useState(docHeight);
  const [top, setTop] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Lock page scroll only in normal (fixed) mode
  useEffect(() => {
    if (anchored) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [anchored]);

  // Anchored mode: vertically centre the panel on the last click, kept inside the page
  useLayoutEffect(() => {
    if (!anchored || !panelRef.current) return;
    const el = panelRef.current;
    const place = () => {
      const h = el.offsetHeight;
      const y = lastPress ? lastPress.y : docH / 2;
      const max = Math.max(12, docH - h - 12);
      setTop(Math.min(Math.max(y - h / 2, 12), max));
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    return () => ro.disconnect();
  }, [anchored, docH]);

  const close = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!anchored) {
    return createPortal(
      <div
        className="fixed inset-0 flex items-center justify-center p-4 bg-black/40"
        style={{ zIndex: 1000 }}
        onClick={close}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      className="bg-black/40"
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: docH, zIndex: 1000 }}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div
        ref={panelRef}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: top ?? 0,
          visibility: top === null ? 'hidden' : 'visible',
          display: 'flex',
          justifyContent: 'center',
          padding: '0 16px',
          pointerEvents: 'none'
        }}
      >
        <div style={{ pointerEvents: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
