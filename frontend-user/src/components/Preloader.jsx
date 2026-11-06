import { useEffect, useRef, useState } from 'react';
import { gsap, reducedMotion } from '../lib/motion.js';

/** Logo rings draw in with a counter, then a curtain lifts. Fires `cf:ready` when done. */
export default function Preloader() {
  const root = useRef(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const ready = () => {
      if (window.__cfReady) return;
      window.__cfReady = true;
      window.dispatchEvent(new Event('cf:ready'));
    };
    // Seen it already this visit (e.g. came back to Home from a product page): skip it.
    let seen = false;
    try {
      seen = sessionStorage.getItem('cf:intro') === '1';
      sessionStorage.setItem('cf:intro', '1');
    } catch {
      /* storage blocked: just show it */
    }
    if (reducedMotion() || seen) {
      ready();
      setDone(true);
      return;
    }

    const counter = { v: 0 };
    // Wait for the fonts and hero photo, but never more than 2.5s: on a slow phone connection Google Fonts
    // can take far longer, and the site should open anyway (the fonts swap in when they arrive).
    const assets = Promise.race([
      Promise.all([
        document.fonts?.ready,
        new Promise((res) => {
          const img = new Image();
          img.onload = img.onerror = res;
          img.src = '/img/hero-main.webp';
        }),
      ]),
      new Promise((res) => setTimeout(res, 2500)),
    ]);

    const ctx = gsap.context(() => {
      const show = () => {
        const el = root.current?.querySelector('.pl-count');
        if (el) el.textContent = String(Math.round(counter.v)).padStart(3, '0');
      };
      // The counter runs to 90 by itself and only finishes once the fonts and hero photo are in, so it
      // never sits frozen on "100" while the page is still waiting.
      const tl = gsap.timeline();
      tl.to('.pl-ring', { strokeDashoffset: 0, duration: 1.1, stagger: 0.15, ease: 'power2.inOut' }, 0)
        .from('.pl-word', { opacity: 0, y: 20, duration: 0.7, ease: 'power3.out' }, 0.3)
        .to(counter, { v: 90, duration: 1.2, ease: 'power2.out', onUpdate: show }, 0);

      Promise.all([assets, tl.then()]).then(() => {
        gsap
          .timeline({ onComplete: () => setDone(true) })
          .to(counter, { v: 100, duration: 0.25, ease: 'none', onUpdate: show })
          .to('.pl-inner', { opacity: 0, y: -30, duration: 0.35, ease: 'power2.in' })
          .to('.pl-panel', { yPercent: -100, duration: 0.8, stagger: 0.08, ease: 'expo.inOut' }, '-=0.1')
          .call(ready, null, 0.6);
      });
    }, root);
    return () => ctx.revert();
  }, []);

  if (done) return null;

  return (
    <div className="preloader" ref={root} aria-hidden="true">
      <div className="pl-panel" />
      <div className="pl-panel" />
      <div className="pl-inner">
        <svg viewBox="0 0 200 200" className="pl-logo">
          <circle className="pl-ring" cx="100" cy="100" r="92" pathLength="1" />
          <circle className="pl-ring" cx="100" cy="100" r="84" pathLength="1" />
        </svg>
        <div className="pl-word script">City<br />Florist</div>
        <div className="pl-count">000</div>
      </div>
    </div>
  );
}

/** Runs `fn` once the preloader has finished (immediately if it already has). */
export function onReady(fn) {
  if (window.__cfReady) {
    fn();
    return () => {};
  }
  window.addEventListener('cf:ready', fn, { once: true });
  return () => window.removeEventListener('cf:ready', fn);
}
