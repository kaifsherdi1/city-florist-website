import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '../lib/motion.js';

const TEXT =
  'City Florist is Hubballi’s studio for fresh flowers, chocolate bouquets and wedding décor — every arrangement is hand-tied to order, for birthdays, anniversaries, apologies, proposals and the biggest day of your life.';

/** Large statement whose words light up as you scroll past. */
export default function Manifesto() {
  const root = useRef(null);

  useGSAP(
    () => {
      gsap.fromTo(
        '.manifesto-text .mw',
        { opacity: 0.12 },
        {
          opacity: 1,
          stagger: 0.05,
          ease: 'none',
          scrollTrigger: { trigger: '.manifesto-text', start: 'top 80%', end: 'bottom 45%', scrub: true },
        }
      );
      gsap.to('.manifesto-img', {
        yPercent: -25,
        rotate: 6,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    },
    { scope: root }
  );

  return (
    <section className="manifesto container" ref={root}>
      <span className="eyebrow">Our craft</span>
      <p className="manifesto-text">
        {TEXT.split(' ').map((w, i) => (
          <span className="mw" key={i}>
            {w}{' '}
          </span>
        ))}
      </p>
      <img className="manifesto-img" src="/img/story.webp" alt="" loading="lazy" />
    </section>
  );
}
