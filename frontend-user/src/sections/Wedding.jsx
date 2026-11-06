import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { gsap, reducedMotion } from '../lib/motion.js';
import { useSite } from '../lib/site.jsx';
import { waLink } from '../lib/api.js';

const PANELS = [
  {
    slug: 'car-decoration',
    kicker: 'Arrive in bloom',
    title: 'Wedding Car Decoration',
    text: 'Fresh gerberas, roses, orchids and ribbons styled on the bonnet, doors and mirrors — built to stay perfect for the whole procession.',
    img: '/img/wedding-car.webp',
  },
  {
    slug: 'room-decoration',
    kicker: 'The first night',
    title: 'Wedding-Night Room Décor',
    text: 'Rose-petal beds, hearts, candles, fairy lights and fragrant flowers — a romantic room set up quietly before you arrive.',
    img: '/img/wedding-room.webp',
  },
  {
    slug: 'garlands',
    kicker: 'Varmala & haar',
    title: 'Bride & Groom Garlands',
    text: 'Traditional and modern garlands in jasmine, roses, carnations and orchids, matched to the wedding outfit and made fresh that morning.',
    img: '/img/wedding-garland.webp',
  },
];

/** Stacked sticky cards: each new card slides over and pushes the previous one back in depth. */
export default function Wedding() {
  const { settings } = useSite();
  const root = useRef(null);

  useGSAP(
    () => {
      if (reducedMotion()) return;
      const cards = gsap.utils.toArray('.wed-card');
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return;
        gsap.fromTo(
          card.querySelector('.wed-inner'),
          { filter: 'brightness(1) saturate(1)' },
          {
            scale: 0.9,
            rotateX: 8,
            filter: 'brightness(0.92) saturate(0.85)',
            ease: 'none',
            scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top 15%', scrub: true },
          }
        );
      });
      cards.forEach((card) => {
        gsap.from(card.querySelectorAll('.wed-copy > *'), {
          y: 40,
          opacity: 0,
          stagger: 0.08,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 60%' },
        });
      });
      gsap.from('.wedding-head .display', {
        y: 80,
        opacity: 0,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.wedding-head', start: 'top 80%' },
      });
    },
    { scope: root }
  );

  return (
    <section className="wedding" id="wedding" ref={root}>
      <div className="wedding-head container">
        <span className="eyebrow">For the big day</span>
        <h2 className="display">
          Wedding décor, <em>end to end.</em>
        </h2>
      </div>
      <div className="wed-stack">
        {PANELS.map((p, i) => (
          <div className="wed-card" key={p.slug} style={{ '--i': i }}>
            <div className="wed-inner">
              <div className={`wed-media ${p.img ? '' : 'wed-art'}`}>
                {p.img ? (
                  <img src={p.img} alt={p.title} loading="lazy" />
                ) : (
                  <div className="candles" aria-hidden="true">
                    {Array.from({ length: 14 }, (_, k) => (
                      <span key={k} style={{ '--k': k }} />
                    ))}
                    <b className="script">Forever</b>
                  </div>
                )}
              </div>
              <div className="wed-copy">
                <span className="wed-num">0{i + 1} / 03</span>
                <span className="eyebrow">{p.kicker}</span>
                <h3 className="display">{p.title}</h3>
                <p>{p.text}</p>
                <div className="wed-actions">
                  <Link to={`/shop?cat=${p.slug}`} className="btn btn-gold" data-cursor="View">
                    See designs
                  </Link>
                  <a
                    className="btn btn-outline"
                    href={waLink(settings.whatsapp_number, `Hi City Florist 🌸 I would like a quote for ${p.title}.`)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Get a quote
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
