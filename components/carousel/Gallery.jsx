/* eslint-disable @next/next/no-img-element */
// 'use client';

import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/splide/dist/css/splide.min.css';
import { useEffect, useState } from 'react';

const rooms = {
  dStandard: 'one',
  eSuite: 'two',
  pSuite: 'three',
  sSuite: 'four',
};

const Gallery = ({ typeId }) => {
  const [firstImage, setFirstImage] = useState(rooms[typeId]);
  const [remainingImgs, setRemainingImgs] = useState(
    Object.entries(rooms)
      .filter(([key]) => key !== typeId)
      .map(([, value]) => value)
  );

  useEffect(() => {
    setFirstImage(rooms[typeId]);
    setRemainingImgs(
      Object.entries(rooms)
        .filter(([key]) => key !== typeId)
        .map(([, value]) => value)
    );
  }, [typeId]);

  const mainOptions = {
    type: 'fade',
    heightRatio: 0.5,
    pagination: false,
    arrows: false,
    cover: true,
  };

  const thumbnailOptions = {
    fixedWidth: 100,
    fixedHeight: 64,
    isNavigation: true,
    gap: 10,
    focus: 'center',
    pagination: false,
    cover: true,
    drag: 'free',
    arrows: false,
  };

  return (
    <div className="gallery-wrapper">
      <Splide options={mainOptions} aria-label="Main Gallery">
        <SplideSlide>
          <img
            src={`/rooms/suite-${firstImage}.jpg`}
            alt={`suite ${firstImage}`}
          />
        </SplideSlide>
        {remainingImgs.map((image, idx) => (
          <SplideSlide key={idx}>
            <img src={`/rooms/suite-${image}.jpg`} alt={`suite ${image}`} />
          </SplideSlide>
        ))}
      </Splide>

      <Splide options={thumbnailOptions} aria-label="Thumbnail Gallery">
        <SplideSlide>
          <img
            src={`/rooms/suite-${firstImage}.jpg`}
            alt={`suite ${firstImage}`}
          />
        </SplideSlide>
        {remainingImgs.map((image, idx) => (
          <SplideSlide key={idx}>
            <img src={`/rooms/suite-${image}.jpg`} alt={`suite ${image}`} />
          </SplideSlide>
        ))}
      </Splide>
    </div>
  );
};

export default Gallery;
