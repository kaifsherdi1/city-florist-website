import { rupees } from '../lib/api.js';

export default function Price({ pricing, className = '' }) {
  if (!pricing || pricing.on_request) {
    return <div className={`price ${className}`}><span className="price-now">Ask for price</span></div>;
  }
  const discounted = pricing.final < pricing.price;
  return (
    <div className={`price ${className}`}>
      <span className="price-now">{rupees(pricing.final)}</span>
      {discounted && (
        <>
          <s className="price-was">{rupees(pricing.price)}</s>
          <span className="price-off">{pricing.discount_pct}% off</span>
        </>
      )}
    </div>
  );
}
