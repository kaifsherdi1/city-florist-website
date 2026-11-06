import { useEffect } from 'react';
import Hero from '../sections/Hero.jsx';
import Offers from '../sections/Offers.jsx';
import Manifesto from '../sections/Manifesto.jsx';
import ReadyToGo from '../sections/ReadyToGo.jsx';
import Collections from '../sections/Collections.jsx';
import Featured from '../sections/Featured.jsx';
import Wedding from '../sections/Wedding.jsx';
import HowToOrder from '../sections/HowToOrder.jsx';
import Gallery from '../sections/Gallery.jsx';
import { useSite } from '../lib/site.jsx';
import { ScrollTrigger } from '../lib/motion.js';

export default function Home() {
  const { loading } = useSite();

  // Once data arrives, sections change height — re-measure all pinned triggers.
  useEffect(() => {
    if (loading) return;
    const id = setTimeout(() => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    }, 300);
    return () => clearTimeout(id);
  }, [loading]);

  useEffect(() => {
    document.title = 'City Florist Hubballi · Flower Bouquets, Chocolate Bouquets, Wedding Car & Room Decoration';
  }, []);

  return (
    <>
      <Hero />
      <Offers />
      <Manifesto />
      <ReadyToGo />
      <Collections />
      <Featured />
      <Wedding />
      <Gallery />
      <HowToOrder />
    </>
  );
}
