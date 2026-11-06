import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { gsap, reducedMotion, isTouch, getLenis } from '../lib/motion.js';
import { useSite } from '../lib/site.jsx';
import { useOrder } from '../components/OrderModal.jsx';
import Photo from '../components/Photo.jsx';
import Price from '../components/Price.jsx';

const today = () => new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
const pad = (n) => String(n).padStart(2, '0');
/** Scroll distance per card while the ring is pinned, as a fraction of the screen height. */
const PER_CARD = 0.45;

/**
 * Today's fresh stock (the "Ready to Go" category, managed in the dashboard) on a 3D ring.
 * The section pins and scrolling turns the ring one card at a time; the card facing you is the one
 * described on the left, with its Buy button.
 */
export default function ReadyToGo() {
  const { ready = [] } = useSite();
  const order = useOrder();
  const root = useRef(null);
  const api = useRef(null);
  const [active, setActive] = useState(0);
  const n = ready.length;
  // Full circle for 6+ cards; with fewer, keep them 60° apart so the ring doesn't look sparse and huge.
  // With many, cap the spacing so the ring doesn't grow wider than the screen.
  const step = n >= 6 ? Math.max(360 / n, 24) : 60;

  useGSAP(
    () => {
      if (!n) return;
      const section = root.current;
      const ring = section.querySelector('.rtg-ring');
      const tilt = section.querySelector('.rtg-tilt');
      const cards = gsap.utils.toArray(section.querySelectorAll('.rtg-card'));

      // Radius that puts neighbouring cards edge to edge, plus a little air.
      const radius = () => {
        const w = cards[0].offsetWidth;
        return Math.round((w / 2 / Math.tan((step * Math.PI) / 360)) * 1.12);
      };

      // Dims and shrinks cards by how far they've turned away from the front.
      const shade = () => {
        const rot = gsap.getProperty(ring, 'rotationY');
        cards.forEach((card, i) => {
          let d = (((i * step + rot) % 360) + 540) % 360 - 180; // −180…180
          card.style.setProperty('--d', Math.min(Math.abs(d) / step, 3).toFixed(3));
        });
      };

      gsap.set(ring, { z: () => -radius(), rotationY: 0 });
      gsap.set(section, { '--r': radius() + 'px' });
      shade();

      // Without the pinned scroll (reduced motion, or a single card) the dots turn the ring directly.
      api.current = {
        turnTo: (i) => {
          setActive(i);
          gsap.to(ring, { rotationY: -i * step, duration: reducedMotion() ? 0 : 0.9, ease: 'power3.inOut', onUpdate: shade });
        },
      };

      if (reducedMotion()) return;

      // Entrance: the ring swings up out of the floor as the section arrives.
      gsap.fromTo(
        tilt,
        { rotationX: 38, y: 120, scale: 0.82, opacity: 0 },
        {
          rotationX: -6,
          y: 0,
          scale: 1,
          opacity: 1,
          ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 85%', end: 'top top', scrub: 1 },
        }
      );
      gsap.from(section.querySelectorAll('.rtg-copy > *'), {
        y: 60,
        opacity: 0,
        stagger: 0.08,
        duration: 1.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: section, start: 'top 70%' },
      });

      if (n < 2) return;

      // Pinned: each card gets ~45% of a screen of scrolling (more felt like the page was stuck). The turn between two cards is eased, so the
      // ring dwells on each card and then swings to the next, like clicking into place.
      const between = gsap.parseEase('power2.inOut');
      const proxy = { p: 0 };
      const turn = gsap.to(proxy, {
        p: n - 1,
        ease: 'none',
        onUpdate: () => {
          const k = Math.min(Math.floor(proxy.p), n - 2);
          gsap.set(ring, { rotationY: -step * (k + between(proxy.p - k)) });
          shade();
        },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => '+=' + (n - 1) * window.innerHeight * PER_CARD,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => setActive(Math.round(self.progress * (n - 1))),
          onRefresh: () => {
            gsap.set(section, { '--r': radius() + 'px' });
            gsap.set(ring, { z: -radius() });
          },
        },
      });

      // With the pinned scroll, a dot scrolls the page to the spot where that card faces front.
      api.current = {
        turnTo: (i) => {
          const st = turn.scrollTrigger;
          const y = st.start + ((st.end - st.start) * i) / (n - 1);
          const lenis = getLenis();
          if (lenis) lenis.scrollTo(y, { duration: 1.2 });
          else window.scrollTo({ top: y, behavior: 'smooth' });
        },
      };

      gsap.fromTo(
        section.querySelector('.rtg-bg span'),
        { xPercent: 0 },
        { xPercent: -35, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: () => '+=' + (window.innerHeight + (n - 1) * window.innerHeight * PER_CARD), scrub: true } }
      );

      // Desktop: the ring leans gently towards the pointer.
      if (!isTouch()) {
        const rx = gsap.quickTo(tilt, 'rotationY', { duration: 1.2, ease: 'power3.out' });
        const move = (e) => rx(((e.clientX / window.innerWidth) - 0.5) * 10);
        section.addEventListener('pointermove', move);
        return () => section.removeEventListener('pointermove', move);
      }
    },
    { scope: root, dependencies: [n, step], revertOnUpdate: true }
  );

  if (!n) return null;
  const current = ready[Math.min(active, n - 1)];

  return (
    <section className="rtg" id="ready" ref={root} style={{ '--step': step + 'deg' }}>
      <div className="rtg-bg" aria-hidden="true">
        <span>Fresh today · Fresh today · Fresh today ·</span>
      </div>

      <div className="rtg-copy">
        <span className="ready-live">
          <i aria-hidden="true" /> Available today · {today()}
        </span>
        <h2 className="display">
          Ready to <em>go.</em>
        </h2>
        <p className="muted">Fresh bunches in the shop right now. Pick up or get them delivered today in Hubballi.</p>
      </div>

      <div className="rtg-stage">
        <div className="rtg-tilt">
          <div className="rtg-ring">
            {ready.map((p, i) => {
              const img = p.images?.[0];
              return (
                <Link
                  to={`/product/${p.slug}`}
                  className={`rtg-card ${i === active ? 'is-active' : ''}`}
                  style={{ '--i': i }}
                  key={p.id}
                  data-cursor="View"
                  tabIndex={i === active ? 0 : -1}
                >
                  {img ? <Photo src={img.thumb} alt={p.name} loading="lazy" /> : <span className="script">{p.name}</span>}
                  <span className="rtg-tag">{p.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="rtg-floor" aria-hidden="true" />
      </div>

      <div className="rtg-info" aria-live="polite">
        <div className="rtg-count">
          <b>{pad(active + 1)}</b> / {pad(n)}
        </div>
        <h3 key={current.id}>
          <Link to={`/product/${current.slug}`}>{current.name}</Link>
        </h3>
        <Price pricing={current.pricing} />
        <button className="btn btn-gold" onClick={() => order(current)} data-cursor="Buy">
          Buy today
        </button>
        <div className="rtg-dots">
          {ready.map((p, i) => (
            <button
              type="button"
              key={p.id}
              className={i === active ? 'on' : ''}
              onClick={() => api.current?.turnTo(i)}
              aria-label={`Show ${p.name}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
