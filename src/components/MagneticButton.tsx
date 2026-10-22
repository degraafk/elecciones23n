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

    const bx = gsap.quickTo(btn, 'x', { duration: 0.45, ease: 'power3.out' });
    const by = gsap.quickTo(btn, 'y', { duration: 0.45, ease: 'power3.out' });
    const lx = gsap.quickTo(label, 'x', { duration: 0.45, ease: 'power3.out' });
    const ly = gsap.quickTo(label, 'y', { duration: 0.45, ease: 'power3.out' });

    const onMove = (e: PointerEvent) => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      // clamp so a tall or wide button never travels far
      const mx = Math.max(-10, Math.min(10, dx * strength));
      const my = Math.max(-6, Math.min(6, dy * strength));
      bx(mx);
      by(my);
      lx(mx * 0.45);
      ly(my * 0.45);
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
