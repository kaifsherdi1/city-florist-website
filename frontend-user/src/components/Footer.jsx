import { Fragment, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { gsap, isTouch, reducedMotion } from '../lib/motion.js';
import { useSite } from '../lib/site.jsx';
import { waLink } from '../lib/api.js';
import Magnetic from './Magnetic.jsx';
import { WhatsAppIcon } from './OrderModal.jsx';

const HEADLINE = ['Let’s', 'make', 'someone', <em key="smile">smile</em>, 'today.'];

export default function Footer() {
  const { settings, categories } = useSite();
  const root = useRef(null);

  useGSAP(
    () => {
      if (reducedMotion()) return;
      const mm = gsap.matchMedia();

      // Headline words flip up out of the floor, tied to scroll.
      gsap.fromTo(
        '.contact-head .hw-i',
        { yPercent: 110, rotateX: -85 },
        {
          yPercent: 0,
          rotateX: 0,
          stagger: 0.08,
          ease: 'none',
          scrollTrigger: { trigger: '.contact-head', start: 'top 92%', end: 'top 45%', scrub: 1 },
        }
      );

      // Background blobs drift at different speeds for depth.
      gsap.utils.toArray('.contact-blobs i').forEach((blob, i) => {
        gsap.to(blob, {
          yPercent: [-40, 30, -60][i],
          xPercent: [10, -15, 5][i],
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom bottom', scrub: true },
        });
      });

      // Cards start fanned out and tipped back like a hand of cards, then swing into place.
      mm.add('(min-width: 900px)', () => {
        gsap.fromTo(
          '.contact-card',
          { rotateX: 58, rotateY: (i) => [-26, 0, 26][i], y: 220, z: -320, opacity: 0.15 },
          {
            rotateX: 0,
            rotateY: 0,
            y: 0,
            z: 0,
            opacity: 1,
            stagger: 0.12,
            ease: 'power2.out',
            scrollTrigger: { trigger: '.contact-stage', start: 'top 98%', end: 'top 30%', scrub: 1 },
          }
        );
      });
      mm.add('(max-width: 899px)', () => {
        gsap.utils.toArray('.contact-card').forEach((card) => {
          gsap.fromTo(
            card,
            { rotateX: 30, y: 80, opacity: 0 },
            { rotateX: 0, y: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: card, start: 'top 98%', end: 'top 70%', scrub: 1 } }
          );
        });
      });

      // The big signature: letters flip up one by one.
      gsap.fromTo(
        '.footer-word .c',
        { yPercent: 100, rotateX: -90, opacity: 0 },
        {
          yPercent: 0,
          rotateX: 0,
          opacity: 1,
          stagger: 0.05,
          ease: 'none',
          // Finish once the word is fully on screen: it sits at the very end of the page, so it may never reach mid-screen.
          scrollTrigger: { trigger: '.footer-word', start: 'top bottom', end: 'bottom bottom', scrub: 1 },
        }
      );

      return () => mm.revert();
    },
    { scope: root, dependencies: [categories.length], revertOnUpdate: true }
  );

  const enquiry = waLink(settings.whatsapp_number, 'Hi City Florist 🌸 I would like to place an order.');
  const phone = settings.shop_phone || (settings.whatsapp_number ? '+' + settings.whatsapp_number : '');
  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('City Florist ' + settings.address)}`;
  const open = openStatus(settings.hours);

  return (
    <footer className="site-footer" id="contact" ref={root}>
      <div className="contact-blobs" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>

      <div className="container">
        <div className="contact-head">
          <span className="eyebrow">Visit the studio</span>
          <h2 className="display" aria-label="Let’s make someone smile today.">
            {HEADLINE.map((word, i) => (
              <Fragment key={i}>
                <span className="hw" aria-hidden="true">
                  <span className="hw-i">{word}</span>
                </span>{' '}
              </Fragment>
            ))}
          </h2>
        </div>

        <div className="contact-stage">
          <TiltCard className="contact-visit">
            <div className="contact-label">
              <h4>Visit us</h4>
              {open && <span className={`open-pill ${open.isOpen ? 'is-open' : ''}`}>{open.label}</span>}
            </div>
            <p className="contact-big">{settings.address}</p>
            <p className="muted">{settings.hours}</p>
            <div className="contact-actions">
              <Magnetic>
                <a className="btn btn-wa" href={enquiry} target="_blank" rel="noreferrer" data-cursor="Chat">
                  <WhatsAppIcon /> WhatsApp
                </a>
              </Magnetic>
              {phone && (
                <a className="btn btn-outline" href={`tel:${phone.replace(/\s/g, '')}`} data-cursor="Call">
                  Call {phone}
                </a>
              )}
            </div>
            {(settings.instagram || settings.facebook) && (
              <div className="socials">
                {settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer">Instagram ↗</a>}
                {settings.facebook && <a href={settings.facebook} target="_blank" rel="noreferrer">Facebook ↗</a>}
              </div>
            )}
          </TiltCard>

          <TiltCard className="contact-colls">
            <h4>Collections</h4>
            <ul className="footer-links">
              {categories.map((c, i) => (
                <li key={c.slug}>
                  <Link to={`/shop?cat=${c.slug}`}>
                    <small>0{i + 1}</small>
                    <span>{c.name}</span>
                    <em>{c.count ? c.count : 'Custom'}</em>
                    <b aria-hidden="true">→</b>
                  </Link>
                </li>
              ))}
            </ul>
          </TiltCard>

          {settings.map_embed && (
            <TiltCard className="contact-map">
              <iframe title="City Florist location" src={settings.map_embed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              <a className="map-pill" href={directions} target="_blank" rel="noreferrer">
                Get directions ↗
              </a>
            </TiltCard>
          )}
        </div>
      </div>

      <div className="footer-word script" aria-label="City Florist">
        {[...'City Florist'].map((ch, i) => (
          <span className="c" key={i} aria-hidden="true">
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </div>

      <div className="footer-bar container">
        <span>© {new Date().getFullYear()} City Florist · Hubballi</span>
        <span>All kinds of fresh flowers, bouquets & decorators</span>
      </div>
    </footer>
  );
}

/** A card that leans toward the pointer, with a soft sheen where it points. Scroll animation moves the outer
 *  element and the tilt moves the inner one, so the two never fight. Pointer events are read on the outer
 *  element: the tilted inner one shifts under the cursor near its edges and would fire false "leave" events. */
function TiltCard({ className, children }) {
  const outer = useRef(null);
  const inner = useRef(null);

  const move = (e) => {
    if (isTouch() || reducedMotion()) return;
    const r = outer.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    gsap.to(inner.current, {
      rotateY: (x - 0.5) * 16,
      rotateX: (0.5 - y) * 16,
      transformPerspective: 900,
      duration: 0.6,
      ease: 'power3.out',
    });
    inner.current.style.setProperty('--gx', `${x * 100}%`);
    inner.current.style.setProperty('--gy', `${y * 100}%`);
  };
  const leave = () => gsap.to(inner.current, { rotateY: 0, rotateX: 0, duration: 0.9, ease: 'elastic.out(1, 0.6)' });

  return (
    <div className={`contact-card ${className}`} ref={outer} onPointerMove={move} onPointerLeave={leave}>
      <div className="contact-inner" ref={inner}>
        {children}
        <span className="contact-sheen" aria-hidden="true" />
      </div>
    </div>
  );
}

/** Reads hours like "8:00 AM – 10:00 PM" and says whether the shop is open right now. */
function openStatus(hours = '') {
  const m = hours.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*[–-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  const mins = (h, min, ap) => ((Number(h) % 12) + (ap.toUpperCase() === 'PM' ? 12 : 0)) * 60 + Number(min);
  const from = mins(m[1], m[2], m[3]);
  const to = mins(m[4], m[5], m[6]);
  const now = new Date();
  const t = now.getHours() * 60 + now.getMinutes();
  const isOpen = from < to ? t >= from && t < to : t >= from || t < to;
  return { isOpen, label: isOpen ? 'Open now' : `Closed · opens ${m[1]}:${m[2]} ${m[3].toUpperCase()}` };
}
