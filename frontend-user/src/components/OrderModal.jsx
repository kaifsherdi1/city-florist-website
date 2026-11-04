import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, rupees, waLink } from '../lib/api.js';
import { useSite } from '../lib/site.jsx';
import { gsap, lockScroll } from '../lib/motion.js';
import Price from './Price.jsx';

const OrderContext = createContext(() => {});
export const useOrder = () => useContext(OrderContext);

const saved = () => {
  try {
    return JSON.parse(localStorage.getItem('cf_customer') || '{}');
  } catch {
    return {};
  }
};

export function OrderProvider({ children }) {
  const [product, setProduct] = useState(null);
  const open = useCallback((p) => setProduct(p), []);
  return (
    <OrderContext.Provider value={open}>
      {children}
      {product && <OrderModal product={product} onClose={() => setProduct(null)} />}
    </OrderContext.Provider>
  );
}

function OrderModal({ product, onClose }) {
  const { settings } = useSite();
  const root = useRef(null);
  const [form, setForm] = useState({ name: saved().name || '', phone: saved().phone || '', delivery_date: '', note: '', website: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | redirecting
  const [link, setLink] = useState('');
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  useEffect(() => {
    lockScroll(true);
    const ctx = gsap.context(() => {
      gsap.from('.order-backdrop', { opacity: 0, duration: 0.4 });
      gsap.from('.order-panel', { y: 60, opacity: 0, rotateX: -8, duration: 0.7, ease: 'expo.out' });
      gsap.from('.order-panel .stagger', { y: 20, opacity: 0, stagger: 0.06, delay: 0.15, duration: 0.6, ease: 'power3.out' });
    }, root);
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => {
      lockScroll(false);
      ctx.revert();
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    gsap.to(root.current, { opacity: 0, duration: 0.25, onComplete: onClose });
  };

  const set = (k) => (e) => {
    let v = e.target.value;
    if (k === 'phone') v = v.replace(/[^\d\s+]/g, '').slice(0, 15);
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((er) => ({ ...er, [k]: undefined, form: undefined }));
  };

  const validate = () => {
    const er = {};
    if (form.name.trim().length < 2) er.name = 'Please enter your name';
    let digits = form.phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
    if (!/^[6-9]\d{9}$/.test(digits)) er.phone = 'Enter a valid 10-digit mobile number';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const go = (url) => {
    setLink(url);
    setStatus('redirecting');
    window.location.href = url;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate() || status === 'sending') return;
    setStatus('sending');
    localStorage.setItem('cf_customer', JSON.stringify({ name: form.name.trim(), phone: form.phone }));
    try {
      const res = await api.order({ product_id: product.id, ...form });
      go(res.whatsapp);
    } catch (err) {
      if (err.status && err.status < 500 && err.status !== 429) {
        setErrors({ form: err.message });
        setStatus('idle');
        return;
      }
      // Server unreachable: still send the customer to WhatsApp with the details.
      const p = product.pricing;
      const text = [
        '🌸 *New Order – City Florist*',
        '',
        `*Product:* ${product.name}`,
        `*Price:* ${p.on_request ? 'Please share the price' : rupees(p.final)}`,
        '',
        `*Name:* ${form.name.trim()}`,
        `*Phone:* ${form.phone}`,
        form.delivery_date ? `*Needed on:* ${form.delivery_date}` : null,
        form.note ? `*Note:* ${form.note}` : null,
      ]
        .filter((l) => l !== null)
        .join('\n');
      go(waLink(settings.whatsapp_number, text));
    }
  };

  const img = product.images?.[0];

  return (
    <div className="order-modal" ref={root} role="dialog" aria-modal="true" aria-labelledby="order-title">
      <div className="order-backdrop" onClick={close} />
      <div className="order-panel" data-lenis-prevent>
        <button className="order-close" onClick={close} aria-label="Close" data-cursor="Close">
          <span />
          <span />
        </button>

        <div className="order-product">
          {img ? <img src={img.thumb || img.src} alt={product.name} /> : <div className="order-noimg">🌸</div>}
          <div>
            <span className="eyebrow">{product.category?.name}</span>
            <h3 id="order-title">{product.name}</h3>
            <Price pricing={product.pricing} />
          </div>
        </div>

        {status === 'redirecting' ? (
          <div className="order-done">
            <div className="wa-pulse">
              <WhatsAppIcon />
            </div>
            <h4>Opening WhatsApp…</h4>
            <p>Your order details are ready. Just press <b>Send</b> in WhatsApp and we’ll confirm right away.</p>
            <a className="btn btn-wa" href={link}>
              Open WhatsApp
            </a>
          </div>
        ) : (
          <form className="order-form" onSubmit={submit} noValidate>
            <p className="stagger order-intro">Share your details and we’ll continue on WhatsApp to confirm design, delivery & payment.</p>

            <label className={`field stagger ${errors.name ? 'has-error' : ''}`}>
              <span>Your name</span>
              <input value={form.name} onChange={set('name')} autoComplete="name" placeholder="e.g. Priya Patil" />
              {errors.name && <em>{errors.name}</em>}
            </label>

            <label className={`field stagger ${errors.phone ? 'has-error' : ''}`}>
              <span>Mobile number</span>
              <div className="phone-input">
                <b>+91</b>
                <input value={form.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel-national" placeholder="98765 43210" />
              </div>
              {errors.phone && <em>{errors.phone}</em>}
            </label>

            <div className="field-row stagger">
              <label className="field">
                <span>Needed on <small>(optional)</small></span>
                <input type="date" min={today} value={form.delivery_date} onChange={set('delivery_date')} />
              </label>
            </div>

            <label className="field stagger">
              <span>Message / card text <small>(optional)</small></span>
              <textarea rows="2" value={form.note} onChange={set('note')} maxLength={500} placeholder="Colour preference, delivery address, card message…" />
            </label>

            <input className="hp" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} aria-hidden="true" />

            {errors.form && <div className="form-error">{errors.form}</div>}

            <button className="btn btn-wa stagger" type="submit" disabled={status === 'sending'} data-cursor="Send">
              <WhatsAppIcon />
              {status === 'sending' ? 'Preparing your order…' : 'Buy on WhatsApp'}
            </button>
            <p className="order-fine stagger">No payment now · We reply within minutes during shop hours</p>
          </form>
        )}
      </div>
    </div>
  );
}

export function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.2 4.24-9.44 9.45-9.44 2.52 0 4.89.99 6.67 2.77a9.37 9.37 0 0 1 2.76 6.68c0 5.21-4.24 9.44-9.44 9.44m8.04-17.48A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.06c0 2 .52 3.96 1.52 5.68L.58 23.7l6.1-1.6a11.33 11.33 0 0 0 5.37 1.37h.01c6.26 0 11.36-5.1 11.37-11.36 0-3.04-1.18-5.89-3.33-8.04" />
    </svg>
  );
}
