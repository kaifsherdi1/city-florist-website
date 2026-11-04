import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { gsap } from '../lib/motion.js';
import { useSite } from '../lib/site.jsx';
import ProductCard from '../components/ProductCard.jsx';
import SplitText from '../components/SplitText.jsx';

export default function Featured() {
  const site = useSite();
  // Show full rows of three so no card is left alone on the last row.
  const featured = site.featured.length > 3 ? site.featured.slice(0, site.featured.length - (site.featured.length % 3)) : site.featured;
  const root = useRef(null);

  useGSAP(
    () => {
      if (!featured.length) return;
      gsap.from('.featured-head .wi', {
        yPercent: 110,
        stagger: 0.06,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.featured-head', start: 'top 85%' },
      });
      gsap.utils.toArray('.featured-grid .product-card').forEach((card, i) => {
        gsap.from(card, {
          y: 120,
          opacity: 0,
          rotateX: 14,
          duration: 1.3,
          delay: (i % 3) * 0.08,
          ease: 'expo.out',
          scrollTrigger: { trigger: card, start: 'top 92%' },
        });
      });
      // Middle column drifts at a different speed for depth.
      gsap.to('.featured-grid .product-card:nth-child(3n+2) .product-tilt', {
        y: -80,
        ease: 'none',
        scrollTrigger: { trigger: '.featured-grid', start: 'top bottom', end: 'bottom top', scrub: true },
      });
    },
    { scope: root, dependencies: [featured.length], revertOnUpdate: true }
  );

  if (!featured.length) return null;

  return (
    <section className="featured container" ref={root}>
      <div className="featured-head">
        <span className="eyebrow">Signature creations</span>
        <SplitText as="h2" className="display" text="Loved by Hubballi, made by hand." />
        <Link to="/shop" className="link-arrow" data-cursor="Shop">
          View all designs →
        </Link>
      </div>
      <div className="featured-grid">
        {featured.map((p, i) => (
          <ProductCard product={p} index={i} key={p.id} />
        ))}
      </div>
    </section>
  );
}
