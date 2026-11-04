import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap, isTouch } from '../lib/motion.js';
import { useOrder } from './OrderModal.jsx';
import Price from './Price.jsx';

/** Product tile with a 3D tilt + light glare on hover and a Buy button. */
export default function ProductCard({ product, index = 0 }) {
  const card = useRef(null);
  const order = useOrder();
  const img = product.images?.[0];
  const alt = product.images?.[1];

  const move = (e) => {
    if (isTouch()) return;
    const r = card.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(card.current, { rotateY: px * 10, rotateX: -py * 10, duration: 0.6, ease: 'power3.out' });
    card.current.style.setProperty('--gx', `${(px + 0.5) * 100}%`);
    card.current.style.setProperty('--gy', `${(py + 0.5) * 100}%`);
  };
  const leave = () => gsap.to(card.current, { rotateY: 0, rotateX: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });

  const offer = product.pricing?.discount_pct > 0;

  return (
    <article className="product-card" style={{ '--i': index }}>
      <div className="product-tilt" ref={card} onPointerMove={move} onPointerLeave={leave}>
        <Link to={`/product/${product.slug}`} className="product-media" data-cursor="View">
          {img ? (
            <>
              <img src={img.thumb} alt={product.name} loading="lazy" decoding="async" />
              {alt && <img className="alt" src={alt.thumb} alt="" loading="lazy" decoding="async" />}
            </>
          ) : (
            <div className="product-noimg">🌸</div>
          )}
          <span className="glare" />
          {offer && <span className="product-badge">−{product.pricing.discount_pct}%</span>}
        </Link>
        <div className="product-info">
          <div>
            <span className="eyebrow">{product.category?.name}</span>
            <h3>
              <Link to={`/product/${product.slug}`}>{product.name}</Link>
            </h3>
            <Price pricing={product.pricing} />
          </div>
          <button className="btn btn-gold btn-sm" onClick={() => order(product)} data-cursor="Buy">
            Buy
          </button>
        </div>
      </div>
    </article>
  );
}
