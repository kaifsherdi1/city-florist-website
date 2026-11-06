import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { gsap, getLenis, lockScroll, scrollTo } from '../lib/motion.js';
import { useSite } from '../lib/site.jsx';
import { waLink } from '../lib/api.js';
import Magnetic from './Magnetic.jsx';
import { WhatsAppIcon } from './OrderModal.jsx';

// Used in the menu until the API answers (or if it can't be reached), so the shop links are always there.
const DEFAULT_CATEGORIES = [
  { slug: 'flower-bouquets', name: 'Flower Bouquets' },
  { slug: 'chocolate-bouquets', name: 'Chocolate Bouquets' },
  { slug: 'car-decoration', name: 'Car Decoration' },
  { slug: 'room-decoration', name: 'Room Decoration' },
  { slug: 'garlands', name: 'Bridal Garlands' },
  { slug: 'teddy-bears', name: 'Teddy Bears' },
  { slug: 'cakes', name: 'Cakes' },
];

export default function Header() {
  const { settings, categories } = useSite();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menu = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let last = 0;
    const onScroll = () => {
      const y = getLenis()?.scroll ?? window.scrollY;
      setScrolled(y > 40);
      setHidden(y > 300 && y > last);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname, location.search]);

  useEffect(() => {
    lockScroll(open);
    if (!open || !menu.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.menu-bg', { clipPath: 'circle(0% at 100% 0%)' }, { clipPath: 'circle(150% at 100% 0%)', duration: 0.9, ease: 'expo.inOut' });
      gsap.from('.menu-link', { yPercent: 110, stagger: 0.06, delay: 0.35, duration: 0.9, ease: 'expo.out' });
      gsap.from('.menu-foot > *', { opacity: 0, y: 20, stagger: 0.05, delay: 0.6, duration: 0.6 });
    }, menu);
    return () => ctx.revert();
  }, [open]);

  const goSection = (id) => (e) => {
    e.preventDefault();
    setOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => scrollTo(id), 600);
    } else {
      // Wait a tick so smooth scrolling is unlocked after the menu closes.
      setTimeout(() => scrollTo(id), 50);
    }
  };

  const enquiry = waLink(settings.whatsapp_number, 'Hi City Florist 🌸 I would like to enquire about an order.');
  const menuCategories = categories.length ? categories : DEFAULT_CATEGORIES;
  const phone = settings.shop_phone || (settings.whatsapp_number ? '+' + settings.whatsapp_number : '');
  const mainLinks = [
    { label: 'Home', to: '/' },
    { label: 'Shop all', to: '/shop' },
    { label: 'Wedding', hash: '#wedding' },
    { label: 'Collections', hash: '#collections' },
    { label: 'Contact', hash: '#contact' },
  ];

  return (
    <>
      <header className={`site-header ${hidden && !open ? 'is-hidden' : ''} ${scrolled ? 'is-scrolled' : ''}`}>
        <Link to="/" className="logo" data-cursor="Home" aria-label="City Florist home">
          <img src="/img/logo.webp" alt="" width="44" height="44" />
          <span className="script">City Florist</span>
        </Link>
        <nav className="nav-desktop">
          <NavLink to="/shop" data-cursor="Shop">Shop</NavLink>
          <a href="#wedding" onClick={goSection('#wedding')}>Wedding</a>
          <a href="#collections" onClick={goSection('#collections')}>Collections</a>
          <a href="#contact" onClick={goSection('#contact')}>Visit us</a>
        </nav>
        <div className="header-actions">
          <Magnetic>
            <a className="btn btn-outline btn-sm header-wa" href={enquiry} target="_blank" rel="noreferrer" data-cursor="Chat">
              <WhatsAppIcon /> <span>Order on WhatsApp</span>
            </a>
          </Magnetic>
          <button className={`burger ${open ? 'is-open' : ''}`} onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            <span />
            <span />
          </button>
        </div>
      </header>

      {open && (
        <div className="menu" ref={menu} data-lenis-prevent>
          <div className="menu-bg" />
          <nav className="menu-nav">
            {mainLinks.map((l, i) => (
              <div className="menu-mask" key={l.label}>
                {l.to ? (
                  <Link className="menu-link" to={l.to}>
                    <small>0{i + 1}</small>
                    {l.label}
                  </Link>
                ) : (
                  <a className="menu-link" href={l.hash} onClick={goSection(l.hash)}>
                    <small>0{i + 1}</small>
                    {l.label}
                  </a>
                )}
              </div>
            ))}
          </nav>
          <div className="menu-cats">
            <span className="eyebrow">Shop by category</span>
            <div>
              {menuCategories.map((c) => (
                <Link key={c.slug} to={`/shop?cat=${c.slug}`}>
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="menu-foot">
            <span>{settings.address}</span>
            <span>{settings.hours}</span>
            {phone && <a href={`tel:${phone.replace(/\s/g, '')}`}>Call {phone}</a>}
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('City Florist ' + settings.address)}`} target="_blank" rel="noreferrer">
              Get directions →
            </a>
            <a href={enquiry} target="_blank" rel="noreferrer">WhatsApp us →</a>
          </div>
        </div>
      )}
    </>
  );
}
