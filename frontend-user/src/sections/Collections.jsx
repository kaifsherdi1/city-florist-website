import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { gsap, reducedMotion } from '../lib/motion.js';
import { useSite } from '../lib/site.jsx';
import Photo from '../components/Photo.jsx';

/** Pinned horizontal gallery of the five collections (native swipe on mobile). */
export default function Collections() {
  const { categories } = useSite();
  const root = useRef(null);

  useGSAP(
    () => {
      if (!categories.length || reducedMotion()) return;
      const mm = gsap.matchMedia();
      mm.add('(min-width: 900px)', () => {
        const track = root.current.querySelector('.coll-track');
        const distance = () => track.scrollWidth - window.innerWidth;
        const scroll = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: () => '+=' + distance(),
            scrub: 1,
            pin: true,
            invalidateOnRefresh: true,
          },
        });
        gsap.utils.toArray('.coll-card').forEach((card) => {
          // Gentle parallax: a 12% zoom leaves 6% spare on each side, so a ±5% drift never shows an edge.
          gsap.fromTo(
            card.querySelector('.coll-img img:not(.photo-backdrop)'),
            { xPercent: -5, scale: 1.12 },
            {
              xPercent: 5,
              ease: 'none',
              scrollTrigger: { trigger: card, containerAnimation: scroll, start: 'left right', end: 'right left', scrub: true },
            }
          );
          // End on the frame's own rounded corners; without an explicit end the radius animates to 0.
          // Finish by 'left 70%': the last card stops at ~65% of the screen, so a later end left it clipped.
          gsap.fromTo(
            card.querySelector('.coll-img'),
            { clipPath: 'inset(15% 15% 15% 15% round 24px)' },
            {
              clipPath: 'inset(0% 0% 0% 0% round 22px)',
              ease: 'power2.out',
              scrollTrigger: { trigger: card, containerAnimation: scroll, start: 'left 100%', end: 'left 70%', scrub: true },
            }
          );
        });
        gsap.to('.coll-progress i', {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top top', end: () => '+=' + distance(), scrub: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [categories.length], revertOnUpdate: true }
  );

  return (
    <section className="collections" id="collections" ref={root}>
      <div className="coll-track">
        <div className="coll-intro">
          <span className="eyebrow">Collections</span>
          <h2 className="display">
            Five ways to say <em>it</em> with flowers.
          </h2>
          <p className="muted">Scroll to explore — every piece is made to order.</p>
          <div className="coll-progress"><i /></div>
        </div>
        {categories.map((c, i) => (
          <Link to={`/shop?cat=${c.slug}`} className="coll-card" key={c.slug} data-cursor="Explore">
            <div className={`coll-img ${c.cover ? '' : 'is-empty'}`}>
              {c.cover ? (
                <Photo src={c.cover} alt={c.name} loading="lazy" />
              ) : (
                <div className="coll-placeholder">
                  <span className="script">{c.name}</span>
                  <small>Enquire on WhatsApp</small>
                </div>
              )}
            </div>
            <div className="coll-meta">
              <span className="coll-num">0{i + 1}</span>
              <div>
                <h3>{c.name}</h3>
                <p>{c.tagline}</p>
              </div>
              <span className="coll-count">{c.count ? `${c.count} designs` : 'Custom'}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
