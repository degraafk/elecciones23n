import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface MagneticButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string; // applied to the wrapper (use it for grid spans)
  buttonClassName?: string;
  strength?: number; // how far the button follows the cursor (0 to 1)
}

/**
 * Magnetic button (GSAP): inside its hover zone the button is pulled gently toward the cursor,
 * the label moves a little further for depth, and it springs back when the cursor leaves.
 * Disabled on touch devices and when the user prefers reduced motion.
 */
export const MagneticButton: React.FC<MagneticButtonProps> = ({
  onClick,
  children,
  className = '',
  buttonClassName = '',
  strength = 0.32
}) => {
  const zoneRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const zone = zoneRef.current;
    const btn = btnRef.current;
    const label = labelRef.current;
    if (!zone || !btn || !label) return;

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;

    // Plain gsap.to with overwrite on every move: it keeps working after any number of enters and leaves
    const follow = (x: number, y: number) => {
      gsap.to(btn, { x, y, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
      gsap.to(label, { x: x * 0.45, y: y * 0.45, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
    };

    const onMove = (e: PointerEvent) => {
      const r = btn.getBoundingClientRect();
      // measure from the button's resting centre, not its current (moved) position
      const cx = r.left + r.width / 2 - ((gsap.getProperty(btn, 'x') as number) || 0);
      const cy = r.top + r.height / 2 - ((gsap.getProperty(btn, 'y') as number) || 0);
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      follow(Math.max(-10, Math.min(10, dx * strength)), Math.max(-6, Math.min(6, dy * strength)));
    };
    const onLeave = () => {
      gsap.to([btn, label], { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.38)', overwrite: 'auto' });
    };

    zone.addEventListener('pointermove', onMove);
    zone.addEventListener('pointerleave', onLeave);
    return () => {
      zone.removeEventListener('pointermove', onMove);
      zone.removeEventListener('pointerleave', onLeave);
      gsap.killTweensOf([btn, label]);
    };
  }, [strength]);

  return (
    // the padding is the magnetic zone: the pull starts just before the cursor reaches the button
    <div ref={zoneRef} className={`-m-2 p-2 ${className}`}>
      <button ref={btnRef} type="button" onClick={onClick} className={`will-change-transform ${buttonClassName}`}>
        <span ref={labelRef} className="inline-flex items-center justify-center gap-2 will-change-transform">
          {children}
        </span>
      </button>
    </div>
  );
};
