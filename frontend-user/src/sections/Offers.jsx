import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '../lib/motion.js';
import { useSite } from '../lib/site.jsx';

const DEFAULT_TICKER = ['Flower Bouquets', 'Chocolate Bouquets', 'Wedding Car Décor', 'Wedding-Night Rooms', 'Bridal Garlands', 'Made fresh in Hubballi'];

/** Gold marquee that speeds up and skews with scroll velocity, plus a spotlight for today's offer. */
export default function Offers() {
  const { offers } = useSite();
  const root = useRef(null);
  const items = offers.length
    ? offers.flatMap((o) => [o.discount ? `${o.title} · ${o.discount}% off` : o.title, o.subtitle].filter(Boolean))
    : DEFAULT_TICKER;

  useGSAP(
    () => {
      const tracks = gsap.utils.toArray('.marquee-track');
      const loops = tracks.map((t, i) =>
        i % 2
          ? gsap.fromTo(t, { xPercent: -50 }, { xPercent: 0, ease: 'none', duration: 32, repeat: -1 })
          : gsap.fromTo(t, { xPercent: 0 }, { xPercent: -50, ease: 'none', duration: 28, repeat: -1 })
      );
      const st = ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const v = gsap.utils.clamp(-1, 1, self.getVelocity() / 2500);
          loops.forEach((l) =>
            gsap.to(l, {
              timeScale: 1 + Math.abs(v) * 4,
              duration: 0.2,
              overwrite: true,
              onComplete: () => gsap.to(l, { timeScale: 1, duration: 1 }),
            })
          );
          gsap.to('.marquee', {
            skewY: v * -2.5,
            duration: 0.3,
            overwrite: true,
            onComplete: () => gsap.to('.marquee', { skewY: 0, duration: 0.8 }),
          });
        },
      });
      gsap.from('.offer-spot', {
        y: 80,
        opacity: 0,
        rotateX: 12,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.offer-spot', start: 'top 85%' },
      });
      return () => st.kill();
    },
    { scope: root, dependencies: [items.join('|')], revertOnUpdate: true }
  );

  const spot = offers[0];

  return (
    <section className="offers" ref={root} aria-label="Today's offers">
      <div className="marquee">
        {[0, 1].map((row) => (
          <div className={`marquee-row ${row ? 'outline' : ''}`} key={row}>
            <div className="marquee-track">
              {[...items, ...items, ...items, ...items].map((t, i) => (
                <span key={i}>
                  {t} <i>✦</i>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {spot && (
        <div className="container">
          <Link to={spot.link} className="offer-spot" data-cursor="Shop">
            {spot.image && <img src={spot.image} alt="" loading="lazy" />}
            <div className="offer-copy">
              <span className="eyebrow">Today’s offer</span>
              <h3 className="display">{spot.title}</h3>
              {spot.subtitle && <p>{spot.subtitle}</p>}
            </div>
            {spot.discount > 0 && (
              <div className="offer-pct">
                <b>{spot.discount}%</b>
                <span>off</span>
              </div>
            )}
            <Countdown to={spot.ends_at} />
          </Link>
        </div>
      )}
    </section>
  );
}

function Countdown({ to }) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(to) - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, new Date(to) - Date.now())), 1000);
    return () => clearInterval(id);
  }, [to]);
  const s = Math.floor(left / 1000);
  const parts = [
    [Math.floor(s / 86400), 'd'],
    [Math.floor((s % 86400) / 3600), 'h'],
    [Math.floor((s % 3600) / 60), 'm'],
    [s % 60, 's'],
  ].filter(([v, u], i) => i > 0 || v > 0);
  return (
    <div className="countdown" aria-label="Offer ends in">
      <span className="muted">Ends in</span>
      {parts.map(([v, u]) => (
        <span key={u}>
          <b>{String(v).padStart(2, '0')}</b>
          {u}
        </span>
      ))}
    </div>
  );
}
