import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { gsap } from '../lib/motion.js';
import { useSite } from '../lib/site.jsx';
import { waLink } from '../lib/api.js';
import Magnetic from './Magnetic.jsx';
import { WhatsAppIcon } from './OrderModal.jsx';

export default function Footer() {
  const { settings, categories } = useSite();
  const root = useRef(null);

  useGSAP(
    () => {
      gsap.from('.footer-word .c', {
        yPercent: 120,
        rotate: 8,
        stagger: 0.04,
        ease: 'expo.out',
        duration: 1.4,
        scrollTrigger: { trigger: '.footer-word', start: 'top 95%' },
      });
      gsap.from('.contact-grid > *', {
        y: 50,
        opacity: 0,
        stagger: 0.1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.contact-grid', start: 'top 80%' },
      });
    },
    { scope: root, dependencies: [categories.length], revertOnUpdate: true }
  );

  const enquiry = waLink(settings.whatsapp_number, 'Hi City Florist 🌸 I would like to place an order.');
  const phone = settings.shop_phone || (settings.whatsapp_number ? '+' + settings.whatsapp_number : '');

  return (
    <footer className="site-footer" id="contact" ref={root}>
      <div className="container">
        <div className="contact-head">
          <span className="eyebrow">Visit the studio</span>
          <h2 className="display">
            Let’s make someone <em>smile</em> today.
          </h2>
        </div>

        <div className="contact-grid">
          <div className="contact-card">
            <h4>Shop</h4>
            <p>{settings.address}</p>
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
          </div>

          <div className="contact-card">
            <h4>Collections</h4>
            <ul className="footer-links">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link to={`/shop?cat=${c.slug}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
            <div className="socials">
              {settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer">Instagram ↗</a>}
              {settings.facebook && <a href={settings.facebook} target="_blank" rel="noreferrer">Facebook ↗</a>}
            </div>
          </div>

          {settings.map_embed && (
            <div className="map-card">
              <iframe title="City Florist location" src={settings.map_embed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          )}
        </div>
      </div>

      <div className="footer-word script" aria-label="City Florist">
        {[...'City Florist'].map((ch, i) => (
          <span className="c" key={i}>
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
