import { useState } from 'react';

/**
 * A photo that fills its frame without butchering it. Portrait shots (most products) fill the frame;
 * landscape shots, or any photo when `whole` is set, are shown complete on a blurred copy of themselves
 * instead of being cropped to a sliver.
 */
export default function Photo({ src, alt, className = '', whole = false, ...rest }) {
  const [wide, setWide] = useState(false);
  const contain = whole || wide;

  return (
    <>
      {contain && <img className="photo-backdrop" src={src} alt="" aria-hidden="true" />}
      <img
        src={src}
        alt={alt}
        className={`${className} ${contain ? 'is-contain' : ''}`.trim()}
        onLoad={(e) => setWide(e.currentTarget.naturalWidth > e.currentTarget.naturalHeight * 1.05)}
        {...rest}
      />
    </>
  );
}
