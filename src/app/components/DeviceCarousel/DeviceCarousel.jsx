import React, { useEffect, useMemo, useState } from 'react';
import { DeviceFrameset } from "react-device-frameset";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import Image from "next/image";
import styles from './styles.module.css';
import "swiper/css";
import "swiper/css/effect-fade";
import "react-device-frameset/styles/marvel-devices.min.css";

const DeviceCarousel = ({
  photos,
  deviceConfig,
  onSlideChange,
  width,
  height,
}) => {
  const calculatedZoom = useMemo(() => {
    const viewportRatio = height / width;
    const deviceRatio = deviceConfig.height / deviceConfig.width;
      
    let zoom;
    if (viewportRatio > deviceRatio) {
      zoom = (width * 0.85) / deviceConfig.width; // Reducimos de 0.97 a 0.85 para hacer el device más grande
    } else {
      zoom = (height * 0.85) / deviceConfig.height;
    }
      
    return Math.min(Math.max(zoom, 0.788), 1); // Aumentamos los límites del zoom
  }, [width, height, deviceConfig]);

  const [viewportWidth, setViewportWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [deviceScale, setDeviceScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
      calculateDeviceScale();
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Inicializar las dimensiones del viewport

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const calculateDeviceScale = () => {
    const viewportRatio = viewportHeight / viewportWidth;
    const deviceRatio = deviceConfig.height / deviceConfig.width;

    let scale;
    if (viewportRatio > deviceRatio) {
      scale = (viewportWidth * 0.85) / deviceConfig.width; // Reducimos de 0.97 a 0.85 para hacer el device más grande
    } else {
      scale = (viewportHeight * 0.85) / deviceConfig.height;
    }

    setDeviceScale(Math.min(Math.max(scale, 0.7 ), 1)); // Aumentamos los límites del zoom
  };


  return (
   <div className="relative flex w-full h-full">
      {/* Dispositivo centrado */}
      <div className="flex justify-center items-center w-full">
      <div className={`${styles.deviceWrapper} w-[90%] h-[80%]`}>
          <DeviceFrameset
            device={deviceConfig.device}
            color={deviceConfig.color}
            zoom={deviceScale}
            orientation="portrait"
          >
            <div className={styles.swiperContainer}>
              <Swiper
                effect="fade"
                autoplay={{
                  delay: 5000,
                  disableOnInteraction: false,
                }}
                modules={[Autoplay, EffectFade]}
                onSlideChange={onSlideChange}
                className={styles.swiper}
              >
                {photos.map((photo) => (
                  <SwiperSlide key={photo.id} className={styles.slide}>
                    <div className={styles.imageContainer}>
                      <Image
                        src={photo.image_url}
                        alt={photo.comment || 'Foto del evento'}
                        fill
                        priority
                        sizes="100vw"
                        className={styles.image}
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </DeviceFrameset>
        </div>
      </div>
    </div>
  );
};

export default DeviceCarousel;