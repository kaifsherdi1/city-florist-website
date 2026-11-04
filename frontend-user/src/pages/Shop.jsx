import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Flip } from 'gsap/Flip';
import { gsap, ScrollTrigger } from '../lib/motion.js';
import { api, waLink } from '../lib/api.js';
import { useSite } from '../lib/site.jsx';
import ProductCard from '../components/ProductCard.jsx';
import SplitText from '../components/SplitText.jsx';
import { WhatsAppIcon } from '../components/OrderModal.jsx';

gsap.registerPlugin(Flip);

export default function Shop() {
  const { settings } = useSite();
  const [params, setParams] = useSearchParams();
  const cat = params.get('cat') || '';
  const [data, setData] = useState({ products: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('featured');
  const grid = useRef(null);
  const flipState = useRef(null);
  const head = useRef(null);

  useEffect(() => {
    api
      .products()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const current = data.categories.find((c) => c.slug === cat);

  const list = useMemo(() => {
    let l = cat ? data.products.filter((p) => p.category.slug === cat) : data.products;
    if (sort === 'low') l = [...l].sort((a, b) => (a.pricing.final || 1e9) - (b.pricing.final || 1e9));
    if (sort === 'high') l = [...l].sort((a, b) => (b.pricing.final || 0) - (a.pricing.final || 0));
    if (sort === 'offers') l = [...l].sort((a, b) => b.pricing.discount_pct - a.pricing.discount_pct);
    return l;
  }, [data.products, cat, sort]);

  useEffect(() => {
    document.title = `${current ? current.name : 'Shop all'} · City Florist Hubballi`;
  }, [current]);

  const choose = (slug) => {
    if (grid.current) flipState.current = Flip.getState(grid.current.querySelectorAll('.product-card'));
    setParams(slug ? { cat: slug } : {});
  };

  // Animate cards from their old positions to the new layout.
  useLayoutEffect(() => {
    if (!grid.current) {
      flipState.current = null;
      return;
    }
    const cards = grid.current.querySelectorAll('.product-card');
    if (flipState.current) {
      Flip.from(flipState.current, {
        targets: cards,
        duration: 0.7,
        ease: 'power3.inOut',
        stagger: 0.02,
        absolute: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 0.6, stagger: 0.03 }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.4 }),
        onComplete: () => ScrollTrigger.refresh(),
      });
      flipState.current = null;
    } else if (cards.length) {
      gsap.fromTo(cards, { opacity: 0, y: 60 }, { opacity: 1, y: 0, stagger: 0.04, duration: 0.9, ease: 'expo.out' });
    }
  }, [list]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.shop-title .wi', { yPercent: 110, stagger: 0.06, duration: 1.2, ease: 'expo.out' });
      gsap.from('.shop-tabs > *', { y: 20, opacity: 0, stagger: 0.04, duration: 0.8, delay: 0.3 });
    }, head);
    return () => ctx.revert();
  }, [cat, loading]);

  const title = current ? current.name : 'The full collection';

  return (
    <div className="shop-page">
      <header className="shop-head container" ref={head}>
        <span className="eyebrow">{current ? 'Collection' : 'Shop'}</span>
        <SplitText as="h1" key={title} className="display shop-title" text={title} />
        {current?.tagline && <p className="muted shop-tagline">{current.tagline}</p>}

        <div className="shop-bar">
          <div className="shop-tabs" role="tablist">
            <button className={!cat ? 'active' : ''} onClick={() => choose('')}>
              All <sup>{data.products.length}</sup>
            </button>
            {data.categories.map((c) => (
              <button key={c.slug} className={cat === c.slug ? 'active' : ''} onClick={() => choose(c.slug)}>
                {c.name} <sup>{c.count}</sup>
              </button>
            ))}
          </div>
          <label className="shop-sort">
            <span className="muted">Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="featured">Featured</option>
              <option value="offers">Best offers</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </label>
        </div>
      </header>

      <section className="container">
        {loading ? (
          <div className="shop-grid">
            {Array.from({ length: 6 }, (_, i) => (
              <div className="skeleton" key={i} />
            ))}
          </div>
        ) : list.length ? (
          <div className="shop-grid" ref={grid}>
            {list.map((p, i) => (
              <ProductCard product={p} index={i} key={p.id} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="script">{current?.name || 'Coming soon'}</span>
            <p>
              We create these designs to order. Send us your idea, date and budget on WhatsApp and we’ll share photos of
              our past work and a quote.
            </p>
            <a
              className="btn btn-wa"
              target="_blank"
              rel="noreferrer"
              href={waLink(settings.whatsapp_number, `Hi City Florist 🌸 I would like details and pricing for ${current?.name || 'a custom order'}.`)}
            >
              <WhatsAppIcon /> Enquire on WhatsApp
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
