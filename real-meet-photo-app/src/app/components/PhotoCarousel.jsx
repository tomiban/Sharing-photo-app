// src/components/PhotoCarousel.js

import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.min.css';
import SwiperCore, { Pagination, Autoplay } from 'swiper';


SwiperCore.use([Pagination, Autoplay]);

const PhotoCarousel = () => {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    fetchApprovedPhotos();

    // Suscribirse a actualizaciones en tiempo real
    const subscription = supabase
      .channel('public:uploads')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'uploads', filter: 'approved=eq.true' },
        (payload) => {
          fetchApprovedPhotos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchApprovedPhotos = async () => {
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error al obtener las fotos aprobadas:', error);
      return;
    }

    setPhotos(data);
  };

  return (
    <div className={styles.carouselContainer}>
      <h2>Carrusel de Fotos</h2>
      {photos.length === 0 ? (
        <p>No hay fotos aprobadas para mostrar.</p>
      ) : (
        <Swiper
          spaceBetween={30}
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
        >
          {photos.map((photo) => (
            <SwiperSlide key={photo.id}>
              <img src={photo.image_url} alt={`Foto de ${photo.comment || 'sin comentario'}`} />
              {photo.comment && <p>{photo.comment}</p>}
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
};

export default PhotoCarousel;
