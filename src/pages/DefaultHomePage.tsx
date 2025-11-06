import { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { HeroHeaderVideo, HeroHeaderVideoHandle } from '@/components/DialinPortal/HeroHeaderVideo';

const DefaultHomePage = () => {
  const heroRef = useRef<HeroHeaderVideoHandle>(null);

  return (
    <>
      <Helmet>
        <title>Dialin - Connect & Share</title>
        <meta name="description" content="Welcome to Dialin - Your default home space" />
      </Helmet>
      
      <div className="h-screen w-full overflow-hidden bg-background">
        <HeroHeaderVideo
          ref={heroRef}
          videoSrc="/media/default-home-bg.mp4"
          posterSrc="/media/default-home-bg.mp4"
          title="Welcome to Dialin"
          subtitle="Your shared space"
          show360={false}
        />
      </div>
    </>
  );
};

export default DefaultHomePage;
