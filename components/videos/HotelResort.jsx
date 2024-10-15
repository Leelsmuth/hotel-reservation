import React from 'react';

const HotelResort = () => {
  return (
    <div className="relative w-full h-0 pb-[56.25%]">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        loading="lazy"
        className="absolute top-0 left-0 w-full h-full"
      >
        <source src="/hotel-resort.mp4" type="video/mp4" />
      </video>
    </div>
  );
};

export default HotelResort;
