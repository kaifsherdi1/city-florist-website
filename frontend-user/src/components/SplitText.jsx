import { Fragment } from 'react';

/**
 * Splits text into masked words (and optionally characters) so GSAP can animate them.
 * Words get `.w` (with an inner `.wi`), chars get `.c`. Spaces sit between the word
 * masks so they never collapse.
 */
export default function SplitText({ text, as: Tag = 'span', chars = false, className = '', ...rest }) {
  const words = String(text).split(' ');
  return (
    <Tag className={`split ${className}`} aria-label={text} {...rest}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span className="w" aria-hidden="true">
            <span className="wi">
              {chars
                ? [...word].map((ch, j) => (
                    <span className="c" key={j}>
                      {ch}
                    </span>
                  ))
                : word}
            </span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  );
}
