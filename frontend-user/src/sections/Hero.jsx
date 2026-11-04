import { lazy, Suspense, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { gsap, reducedMotion } from '../lib/motion.js';
import { useSite } from '../lib/site.jsx';
import { waLink } from '../lib/api.js';
import { onReady } from '../components/Preloader.jsx';
import SplitText from '../components/SplitText.jsx';
import Magnetic from '../components/Magnetic.jsx';

const PetalScene = lazy(() => import('../three/PetalScene.jsx'));

export default function Hero() {
  const { settings } = useSite();
  const root = useRef(null);
  const progress = useRef(0);
  const [line1, line2] = splitTitle(settings.hero_title);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Intro once the preloader lifts
      const intro = gsap.timeline({ paused: true });
      intro
        .from('.hero-title .c', { yPercent: 115, rotate: 6, stagger: 0.025, duration: 1.3, ease: 'expo.out' })
        .from('.hero-arch', { clipPath: 'inset(100% 0% 0% 0% round 999px 999px 0 0)', duration: 1.6, ease: 'expo.inOut' }, 0)
        .from('.hero-photo', { scale: 1.4, duration: 2, ease: 'expo.out' }, 0.2)
        .from('.hero-float', { y: 120, opacity: 0, rotate: (i) => (i ? 8 : -8), stagger: 0.12, duration: 1.4, ease: 'expo.out' }, 0.5)
        .from('.hero-kicker, .hero-sub, .hero-ctas > *, .hero-scroll', { y: 30, opacity: 0, stagger: 0.08, duration: 1, ease: 'power3.out' }, 0.8);
      const off = onReady(() => intro.play());

      // Pinned scroll: the arch opens up to fill the screen while petals rush toward the camera.
      if (!reducedMotion()) {
        mm.add('(min-width: 768px)', () => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: root.current,
              start: 'top top',
              end: '+=130%',
              scrub: 1,
              pin: true,
              onUpdate: (self) => (progress.current = self.progress),
            },
          });
          tl.to('.hero-arch', { width: '100vw', height: '100vh', borderRadius: 0, ease: 'power2.inOut' }, 0)
            .to('.hero-photo', { scale: 1.02, ease: 'none' }, 0)
            .to('.hero-line-1', { xPercent: -40, opacity: 0, ease: 'power2.in' }, 0)
            .to('.hero-line-2', { xPercent: 40, opacity: 0, ease: 'power2.in' }, 0)
            .to('.hero-float-l', { x: '-30vw', y: '-20vh', rotate: -20, opacity: 0 }, 0)
            .to('.hero-float-r', { x: '30vw', y: '20vh', rotate: 20, opacity: 0 }, 0)
            .to('.hero-kicker, .hero-sub, .hero-ctas, .hero-scroll', { opacity: 0, y: -40 }, 0)
            .fromTo('.hero-reveal', { opacity: 0, y: 60 }, { opacity: 1, y: 0, ease: 'power2.out' }, 0.55);
        });
        mm.add('(max-width: 767px)', () => {
          gsap.to('.hero-photo', {
            yPercent: 15,
            ease: 'none',
            scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true, onUpdate: (s) => (progress.current = s.progress) },
          });
        });
      }
      return () => {
        off();
        mm.revert();
      };
    },
    { scope: root }
  );

  return (
    <section className="hero" ref={root}>
      <div className="hero-glow" />
      <Suspense fallback={null}>{!reducedMotion() && <PetalScene scroll={progress} />}</Suspense>

      <div className="hero-stage">
        <div className="hero-arch">
          <img className="hero-photo" src="/img/hero-main.webp" alt="Black and gold rose bouquet by City Florist" fetchPriority="high" />
          <div className="hero-reveal">
            <span className="eyebrow">Handmade in Hubballi</span>
            <p className="display">Every bouquet tells <em>a story.</em></p>
          </div>
        </div>
        <figure className="hero-float hero-float-l">
          <img src="/img/hero-left.webp" alt="Ferrero Rocher and rose bouquet" />
        </figure>
        <figure className="hero-float hero-float-r">
          <img src="/img/hero-right.webp" alt="Heart shaped red rose bouquet" />
        </figure>

        <h1 className="hero-title" aria-label={settings.hero_title}>
          <SplitText text={line1} chars className="hero-line hero-line-1" />
          <SplitText text={line2} chars className="hero-line hero-line-2" />
        </h1>
      </div>

      <div className="hero-bottom container">
        <span className="hero-kicker eyebrow">Florist & Decorators · Hubballi</span>
        <p className="hero-sub">{settings.hero_subtitle}</p>
        <div className="hero-ctas">
          <Magnetic>
            <Link to="/shop" className="btn btn-gold" data-cursor="Shop">
              Shop the collection
            </Link>
          </Magnetic>
          <a
            className="btn btn-outline"
            href={waLink(settings.whatsapp_number, 'Hi City Florist 🌸 I would like to enquire about a custom order.')}
            target="_blank"
            rel="noreferrer"
          >
            Custom order
          </a>
        </div>
        <div className="hero-scroll">
          <span>Scroll</span>
          <i />
        </div>
      </div>
    </section>
  );
}

function splitTitle(title = '') {
  const parts = title.split(/(?<=\.)\s+/).filter(Boolean);
  if (parts.length >= 2) return [parts[0], parts.slice(1).join(' ')];
  const words = title.split(' ');
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}
