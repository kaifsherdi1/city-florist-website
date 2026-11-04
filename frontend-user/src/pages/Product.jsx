import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { gsap } from '../lib/motion.js';
import { api, waLink } from '../lib/api.js';
import { useSite } from '../lib/site.jsx';
import { useOrder, WhatsAppIcon } from '../components/OrderModal.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Price from '../components/Price.jsx';
import Magnetic from '../components/Magnetic.jsx';
import Photo from '../components/Photo.jsx';

export default function Product() {
  const { slug } = useParams();
  const { settings } = useSite();
  const order = useOrder();
  const [state, setState] = useState({ loading: true });
  const [active, setActive] = useState(0);
  const root = useRef(null);

  useEffect(() => {
    setState({ loading: true });
    setActive(0);
    api
      .product(slug)
      .then((d) => setState({ ...d, loading: false }))
      .catch((e) => setState({ loading: false, error: e.message }));
  }, [slug]);

  const p = state.product;

  useEffect(() => {
    if (p) document.title = `${p.name} · ${p.category.name} · City Florist Hubballi`;
  }, [p]);

  useLayoutEffect(() => {
    if (!p) return;
    const ctx = gsap.context(() => {
      gsap.from('.pd-main', { clipPath: 'inset(100% 0 0 0 round 24px)', duration: 1.4, ease: 'expo.inOut' });
      gsap.from('.pd-main img', { scale: 1.3, duration: 1.8, ease: 'expo.out' });
      gsap.from('.pd-info > *', { y: 40, opacity: 0, stagger: 0.07, duration: 1, delay: 0.3, ease: 'power3.out' });
    }, root);
    return () => ctx.revert();
  }, [p]);

  const swap = (i) => {
    if (i === active) return;
    gsap.fromTo('.pd-main img', { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' });
    setActive(i);
  };

  if (state.loading) return <div className="pd-loading container"><div className="skeleton tall" /></div>;
  if (!p)
    return (
      <div className="empty-state container pd-missing">
        <span className="script">Not found</span>
        <p>This design is no longer available. Have a look at our latest collection.</p>
        <Link className="btn btn-gold" to="/shop">Back to shop</Link>
      </div>
    );

  const img = p.images[active] || p.images[0];

  return (
    <div className="product-page" ref={root}>
      <div className="container pd-grid">
        <div className="pd-gallery">
          <div className="pd-main">{img ? <Photo key={img.src} src={img.src} alt={p.name} whole /> : <div className="product-noimg">🌸</div>}</div>
          {p.images.length > 1 && (
            <div className="pd-thumbs">
              {p.images.map((im, i) => (
                <button key={im.src} className={i === active ? 'active' : ''} onClick={() => swap(i)} aria-label={`Photo ${i + 1}`}>
                  <img src={im.thumb} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pd-info">
          <nav className="crumbs">
            <Link to="/shop">Shop</Link> / <Link to={`/shop?cat=${p.category.slug}`}>{p.category.name}</Link>
          </nav>
          <h1 className="display">{p.name}</h1>
          <Price pricing={p.pricing} className="pd-price" />
          {p.pricing.offer && <div className="pd-offer">✦ {p.pricing.offer}</div>}
          {p.description && <p className="pd-desc">{p.description}</p>}
          <div className="pd-actions">
            <Magnetic>
              <button className="btn btn-gold btn-lg" onClick={() => order(p)} data-cursor="Buy">
                Buy now
              </button>
            </Magnetic>
            <a
              className="btn btn-outline btn-lg"
              target="_blank"
              rel="noreferrer"
              href={waLink(settings.whatsapp_number, `Hi City Florist 🌸 I have a question about "${p.name}": ${window.location.href}`)}
            >
              <WhatsAppIcon /> Ask a question
            </a>
          </div>
          <ul className="pd-points">
            <li>Made fresh to order in Hubballi</li>
            <li>Colours, size & card message can be customised</li>
            <li>Confirm delivery time & payment on WhatsApp</li>
          </ul>
        </div>
      </div>

      {state.related?.length > 0 && (
        <section className="container related">
          <h2 className="display">You may also love</h2>
          <div className="shop-grid">
            {state.related.map((r, i) => (
              <ProductCard product={r} index={i} key={r.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
