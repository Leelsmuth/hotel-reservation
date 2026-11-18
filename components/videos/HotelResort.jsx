'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Muted, looping background video of the hotel. It has a pause/play button
 * (moving content longer than 5 seconds must be pausable) and doesn't play on
 * its own for people who prefer reduced motion.
 */
const HotelResort = ({ className = '' }) => {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (!reduceMotion) {
      video
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }
  }, []);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden bg-ink-900 ${className || 'aspect-video'}`}
    >
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="metadata"
        poster="/exterior.jpg"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/hotel-resort.mp4" type="video/mp4" />
      </video>
      <button
        type="button"
        onClick={toggle}
        className="absolute bottom-4 right-4 z-10 inline-flex min-h-10 items-center gap-2 rounded-full bg-ink-900/75 px-4 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-ink-900"
      >
        {playing ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="currentColor"
          >
            <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
          </svg>
        ) : (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="currentColor"
          >
            <path d="M7 4.5v15l12-7.5z" />
          </svg>
        )}
        {playing ? 'Pause video' : 'Play video'}
      </button>
    </div>
  );
};

export default HotelResort;
