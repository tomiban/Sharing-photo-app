import React from 'react';
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import Image from "next/image";
import { Permanent_Marker } from 'next/font/google';
import "swiper/css";
import "swiper/css/effect-fade";

// Configura la fuente Caveat
const caveat = Permanent_Marker({
  subsets: ['latin'],
  weight: ['400']
});

const DECORATIONS = {
  TAPE_LIGHT: {
    className: "w-24 h-12 bg-[#FFE4B5] opacity-30 rotate-3",
    style: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
  },
  TAPE_DARK: {
    className: "w-24 h-12 bg-[#8B4513] opacity-20 rotate-3",
    style: { boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }
  },
  PIN: {
    className: "w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-400",
    style: { 
      boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 2px 2px 4px rgba(255,255,255,0.8)',
      transform: 'translateY(-50%)'
    }
  }
};

const PolaroidCarousel = ({ 
  photos, 
  onSlideChange,
  decorationType = 'TAPE_LIGHT',
  slideInterval = 5000 // Añadido para permitir configurar el intervalo desde fuera
}) => {
  const decoration = DECORATIONS[decorationType];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="relative w-[min(80vh,_500px)] h-[min(85vh,_800px)] min-h-[450px] bg-white shadow-2xl flex flex-col">
        <div 
          className={`absolute -top-6 left-1/2 transform -translate-x-1/2 ${decoration.className}`}
          style={decoration.style}
        />
        
        {/* Área de la imagen */}
        <div className="relative flex-1 p-3">
          <div className="relative w-full h-full bg-black overflow-hidden">
            <Swiper
              effect="fade"
              autoplay={{
                delay: slideInterval,
                disableOnInteraction: false,
              }}
              modules={[Autoplay, EffectFade]}
              onSlideChange={onSlideChange}
              className="w-full h-full"
              loop={true} // Habilitamos el loop infinito
              allowTouchMove={false} // Deshabilitamos el arrastre manual para mantener la automatización
              speed={1000} // Ajustamos la velocidad de transición
              fadeEffect={{ 
                crossFade: true // Mejora el efecto de transición fade
              }}
            >
              {photos.map((photo) => (
                <SwiperSlide key={photo.id} className="w-full h-full">
                  <div className="relative w-full h-full bg-black">
                    <div className="absolute inset-0">
                      <Image
                        src={photo.url || photo.image_url}
                        alt={photo.comment || 'Selfie del evento'}
                        fill
                        priority
                        className="object-cover"
                        sizes="(max-width: 768px) 85vw, (max-width: 1200px) 50vw, 550px"
                      />
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

        <div className="h-[7%] min-h-[60px] bg-white px-4 flex items-center justify-center">
          <div className="transform rotate-[-2deg] relative -mt-4">
            <div className="relative inline-block">
              <span className={`${caveat.className} text-xl lg:text-2xl text-gray-700 whitespace-nowrap`}>
                Real Meet 2024
              </span>
              {/* Sistema de subrayado con grosor progresivo */}
              <div className="absolute bottom-0 left-0 w-full">
                <div 
                  className="absolute bottom-0 left-0 w-full h-[1px] bg-black opacity-40"
                  style={{ transform: 'translateY(1px)' }}
                />
                <div 
                  className="absolute bottom-0 left-0 w-full h-[2px] bg-black opacity-60"
                  style={{ transform: 'translateY(2px)' }}
                />
                <div 
                  className="absolute bottom-0 left-0 w-full h-[3px] bg-black opacity-80"
                  style={{ transform: 'translateY(3px)' }}
                />
                <div 
                  className="absolute bottom-0 left-0 w-full h-[4px] bg-black"
                  style={{ transform: 'translateY(4px)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bordes y sombras */}
        <div className="absolute inset-0 border-[14px] border-white pointer-events-none" />
        <div className="absolute inset-0 shadow-[0_0_40px_rgba(0,0,0,0.3)] pointer-events-none" />
      </div>
    </div>
  );
};

export default PolaroidCarousel;