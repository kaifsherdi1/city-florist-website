import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '../lib/motion.js';

const STEPS = [
  ['Choose', 'Browse bouquets, chocolate bouquets, décor and garlands — or ask for something custom.'],
  ['Tap Buy', 'Enter your name and number. Your order details are prepared automatically.'],
  ['Confirm on WhatsApp', 'Chat directly with the shop to confirm design, delivery time and payment.'],
];

export default function HowToOrder() {
  const root = useRef(null);

  useGSAP(
    () => {
      gsap.from('.step', {
        y: 80,
        opacity: 0,
        stagger: 0.15,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.steps', start: 'top 80%' },
      });
      gsap.fromTo('.steps-line i', { scaleX: 0 }, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: '.steps', start: 'top 75%', end: 'bottom 50%', scrub: true },
      });
    },
    { scope: root }
  );

  return (
    <section className="how container" ref={root}>
      <span className="eyebrow">How to order</span>
      <h2 className="display">
        Three taps to <em>happiness.</em>
      </h2>
      <div className="steps">
        <div className="steps-line"><i /></div>
        {STEPS.map(([title, text], i) => (
          <div className="step" key={title}>
            <span className="step-num">{i + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
