import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { gsap, getLenis, lockScroll, scrollTo } from '../lib/motion.js';
import { useSite } from '../lib/site.jsx';
import { waLink } from '../lib/api.js';
import Magnetic from './Magnetic.jsx';
import { WhatsAppIcon } from './OrderModal.jsx';

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
      scrollTo(id);
    }
  };

  const enquiry = waLink(settings.whatsapp_number, 'Hi City Florist 🌸 I would like to enquire about an order.');

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
            {[
              ['Home', '/'],
              ['Shop all', '/shop'],
              ...categories.map((c) => [c.name, `/shop?cat=${c.slug}`]),
            ].map(([label, to], i) => (
              <div className="menu-mask" key={to}>
                <Link className="menu-link" to={to}>
                  <small>0{i + 1}</small>
                  {label}
                </Link>
              </div>
            ))}
          </nav>
          <div className="menu-foot">
            <span>{settings.address}</span>
            <span>{settings.hours}</span>
            <a href={enquiry} target="_blank" rel="noreferrer">WhatsApp us →</a>
          </div>
        </div>
      )}
    </>
  );
}
