import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { gsap } from '../lib/motion.js';
import { api } from '../lib/api.js';

/** Three columns of real work that scroll at different speeds. */
export default function Gallery() {
  const root = useRef(null);
  const [images, setImages] = useState([]);

  useEffect(() => {
    api
      .products()
      .then(({ products }) => {
        const all = products.filter((p) => p.images[0]).map((p) => ({ src: p.images[0].thumb, slug: p.slug, name: p.name }));
        // Spread across categories rather than showing the first 15 bouquets.
        const shuffled = all.map((v, i) => [((i * 7919) % 97) / 97, v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
        setImages(shuffled.slice(0, 15));
      })
      .catch(() => {});
  }, []);

  useGSAP(
    () => {
      if (!images.length) return;
      const speeds = [-12, 10, -20];
      gsap.utils.toArray('.gal-col').forEach((col, i) => {
        gsap.fromTo(col, { yPercent: speeds[i] * -1 }, {
          yPercent: speeds[i],
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });
    },
    { scope: root, dependencies: [images.length], revertOnUpdate: true }
  );

  if (!images.length) return null;
  const cols = [0, 1, 2].map((c) => images.filter((_, i) => i % 3 === c));

  return (
    <section className="gallery" ref={root}>
      <div className="gallery-title container">
        <span className="eyebrow">From our studio</span>
        <h2 className="display">
          Real work. <em>Real smiles.</em>
        </h2>
      </div>
      <div className="gal-grid">
        {cols.map((col, c) => (
          <div className="gal-col" key={c}>
            {col.map((img) => (
              <Link to={`/product/${img.slug}`} key={img.slug} className="gal-item" data-cursor="View">
                <img src={img.src} alt={img.name} loading="lazy" />
              </Link>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
