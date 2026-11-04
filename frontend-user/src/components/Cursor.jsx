import { useEffect, useRef } from 'react';
import { gsap, isTouch } from '../lib/motion.js';

/** Dot + trailing ring. Elements with data-cursor="Label" grow the ring and show the label. */
export default function Cursor() {
  const dot = useRef(null);
  const ring = useRef(null);
  const label = useRef(null);

  useEffect(() => {
    if (isTouch()) return;
    document.documentElement.classList.add('has-cursor');
    const xDot = gsap.quickTo(dot.current, 'x', { duration: 0.1 });
    const yDot = gsap.quickTo(dot.current, 'y', { duration: 0.1 });
    const xRing = gsap.quickTo(ring.current, 'x', { duration: 0.5, ease: 'power3' });
    const yRing = gsap.quickTo(ring.current, 'y', { duration: 0.5, ease: 'power3' });

    gsap.set([dot.current, ring.current], { opacity: 0 });
    let shown = false;
    const move = (e) => {
      if (!shown) {
        shown = true;
        gsap.set([dot.current, ring.current], { x: e.clientX, y: e.clientY });
        gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.3 });
      }
      xDot(e.clientX);
      yDot(e.clientY);
      xRing(e.clientX);
      yRing(e.clientY);
    };
    const over = (e) => {
      const target = e.target.closest('[data-cursor], a, button, input, textarea, select, label');
      const text = target?.closest('[data-cursor]')?.dataset.cursor || '';
      ring.current.classList.toggle('is-hover', !!target);
      ring.current.classList.toggle('has-label', !!text);
      label.current.textContent = text;
    };
    const down = () => ring.current.classList.add('is-down');
    const up = () => ring.current.classList.remove('is-down');
    const leave = () => gsap.to([dot.current, ring.current], { opacity: 0, duration: 0.2 });
    const enter = () => gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.2 });

    window.addEventListener('pointermove', move);
    document.addEventListener('pointerover', over);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    document.documentElement.addEventListener('pointerleave', leave);
    document.documentElement.addEventListener('pointerenter', enter);
    return () => {
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      document.documentElement.removeEventListener('pointerleave', leave);
      document.documentElement.removeEventListener('pointerenter', enter);
    };
  }, []);

  return (
    <>
      <div className="cursor-dot" ref={dot} aria-hidden="true" />
      <div className="cursor-ring" ref={ring} aria-hidden="true">
        <span ref={label} />
      </div>
    </>
  );
}
