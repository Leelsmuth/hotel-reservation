import Container from '@/components/layout/Container';
import MainLayout from '@/components/layout/MainLayout';
import HeadingOne from '@/components/typography/HeadingOne';
import HotelResort from '@/components/videos/HotelResort';
import React from 'react';
const About = () => {
  return (
    <MainLayout>
      <Container classes="my-10">
        <div className="relative">
          <HotelResort />
          <HeadingOne classes="absolute top-1/3 sm:px-5 bg-white rounded-e-full border-2 border-primary border-l-transparent uppercase">
            We are Beverly Hills Hotel
          </HeadingOne>
        </div>
        <div className="my-10">
          <p className="text-2xl leading-10 mb-5">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Nesciunt
            eius officia nemo tempore, facere deserunt dignissimos aliquid
            blanditiis ipsam ullam eaque sit nobis? Ratione, modi accusamus
            maxime quam omnis iste. Suscipit aperiam sint aspernatur, cum
            eligendi modi! Non delectus atque, harum vero nam voluptatem omnis
            quia suscipit possimus porro facilis.
          </p>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Nesciunt
            eius officia nemo tempore, facere deserunt dignissimos aliquid
            blanditiis ipsam ullam eaque sit nobis? Ratione, modi accusamus
            maxime quam omnis iste. Suscipit aperiam sint aspernatur, cum
            eligendi modi! Non delectus atque, harum vero nam voluptatem omnis
            quia suscipit possimus porro facilis.
          </p>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Nesciunt
            eius officia nemo tempore, facere deserunt dignissimos aliquid
            blanditiis ipsam ullam eaque sit nobis? Ratione, modi accusamus
            maxime quam omnis iste. Suscipit aperiam sint aspernatur, cum
            eligendi modi! Non delectus atque, harum vero nam voluptatem omnis
            quia suscipit possimus porro facilis.
          </p>
        </div>
      </Container>
    </MainLayout>
  );
};

export default About;
