import { useEffect, useLayoutEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { SiteProvider } from './lib/site.jsx';
import { startSmoothScroll, scrollToTop, ScrollTrigger } from './lib/motion.js';
import { OrderProvider } from './components/OrderModal.jsx';
import Preloader from './components/Preloader.jsx';
import Cursor from './components/Cursor.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Product from './pages/Product.jsx';

// The preloader only plays when the visitor first lands on the home page.
const showPreloader = window.location.pathname === '/';
if (!showPreloader) window.__cfReady = true;

export default function App() {
  const location = useLocation();

  useEffect(() => {
    startSmoothScroll();
  }, []);

  useLayoutEffect(() => {
    scrollToTop();
    const id = setTimeout(() => ScrollTrigger.refresh(), 100);
    return () => clearTimeout(id);
  }, [location.pathname]);

  return (
    <SiteProvider>
      <OrderProvider>
        {showPreloader && <Preloader />}
        <Cursor />
        <div className="grain" aria-hidden="true" />
        <Header />
        <main key={location.pathname} className="page">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<Product />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </OrderProvider>
    </SiteProvider>
  );
}

function NotFound() {
  return (
    <div className="empty-state container pd-missing">
      <span className="script">Oops</span>
      <p>This page wilted away. Let’s get you back to the flowers.</p>
      <Link className="btn btn-gold" to="/">Go home</Link>
    </div>
  );
}
