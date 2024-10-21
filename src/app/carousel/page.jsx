"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import Image from "next/image";
import { supabase } from "../utils/supabaseClient";
import { DeviceFrameset } from "react-device-frameset";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/effect-fade";
import "react-device-frameset/styles/marvel-devices.min.css";
import Confetti from 'react-confetti';
import { useWindowSize } from '@react-hook/window-size';

const POLL_INTERVAL = 60000; // 60 segundos
const EFFECT_INTERVAL = 1000; // 1 segundo

const PARTY_EMOJIS = [
  '❤️', '🧡', '💛', '💚', '💙', '💜',
  '🎉', '🎊', '🎈', '🥳', '😎', '🕺', '💃', '🍾', '🥂',
  '🌟', '✨', '💫', '🔥', '👏', '🙌', '🤩', '😍'
];

const CONFETTI_COLORS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
  '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50',
  '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
  '#FF5722', '#795548'
];

const CarouselPage = () => {
  const [width, height] = useWindowSize();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFlash, setShowFlash] = useState(false);
  const [floatingItems, setFloatingItems] = useState([]);
  const [confettiActive, setConfettiActive] = useState(false);

  const fetchApprovedPhotos = useCallback(async () => {
    const { data, error } = await supabase
      .from("uploads")
      .select("*")
      .eq("approved", true)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error al obtener las fotos aprobadas:", error);
    } else {
      setPhotos(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApprovedPhotos();
    const pollInterval = setInterval(fetchApprovedPhotos, POLL_INTERVAL);
    const channel = supabase
      .channel("public:uploads")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "uploads", filter: "approved=eq.true" },
        fetchApprovedPhotos
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [fetchApprovedPhotos]);

  const triggerFlash = useCallback(() => {
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);
  }, []);

  const createFloatingItem = useCallback(() => {
    const newItem = {
      id: Date.now(),
      emoji: PARTY_EMOJIS[Math.floor(Math.random() * PARTY_EMOJIS.length)],
      left: `${Math.random() * 100}%`,
      animationDuration: `${2 + Math.random() * 3}s`,
      size: `${1.5 + Math.random() * 1}rem` // Emojis más pequeños
    };
    setFloatingItems(prevItems => [...prevItems, newItem]);
    setTimeout(() => {
      setFloatingItems(prevItems => prevItems.filter(item => item.id !== newItem.id));
    }, parseFloat(newItem.animationDuration) * 1000);
  }, []);

  useEffect(() => {
    const effectInterval = setInterval(() => {
      if (Math.random() < 0.8) {
        createFloatingItem();
      }
      if (Math.random() < 0.2) {
        triggerFlash();
      }
    }, EFFECT_INTERVAL);

    // Confetti cada 30 segundos
    const confettiInterval = setInterval(() => {
      setConfettiActive(true); 
      setTimeout(() => setConfettiActive(false), 5000); // Confetti dura 5 segundos
    }, 30000); // Confetti cada 30 segundos

    return () => {
      clearInterval(effectInterval);
      clearInterval(confettiInterval);
    };
  }, [createFloatingItem, triggerFlash]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-600 to-pink-500 p-4 overflow-hidden">
      <div className="confetti-container">
        <Confetti
          width={width}
          height={height}
          numberOfPieces={confettiActive ? 200 : 0}
          recycle={false}
          colors={CONFETTI_COLORS}
          confettiSource={{x: 0, y: 0, w: width, h: height}}
        />
      </div>
      <div className="relative z-10">
        <DeviceFrameset device="iPad Mini" color="silver" zoom={0.7}>
          <Swiper
            spaceBetween={0}
            effect="fade"
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            modules={[Autoplay, EffectFade]}
            className="w-full h-full"
          >
            {photos.map((photo) => (
              <SwiperSlide key={photo.id}>
                <div className="relative w-full h-full">
                  <Image
                    src={photo.image_url}
                    alt="Foto"
                    fill
                    style={{ objectFit: "cover" }}
                    priority
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </DeviceFrameset>
      </div>

      {floatingItems.map(item => (
        <div
          key={item.id}
          className="floating-item"
          style={{
            left: item.left,
            animationDuration: item.animationDuration,
            fontSize: item.size,
            opacity: 0.9 // Más opacidad para ser más visibles
          }}
        >
          {item.emoji}
        </div>
      ))}

      {showFlash && (
        <div className="absolute inset-0 bg-white animate-flash z-50"></div>
      )}

      <style jsx>{`
        .confetti-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        @keyframes floatUp {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0.9; } /* Más opacidad al principio */
          80% { transform: translateY(-5vh) rotate(360deg); opacity: 0.9; } /* Mantiene opacidad hasta cerca del final */
          100% { transform: translateY(-10vh) rotate(360deg); opacity: 0; } /* Desvanece al final */
        }
        .floating-item {
          position: fixed;
          animation: floatUp linear forwards;
          z-index: 100;
        }
        @keyframes flash {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        .animate-flash {
          animation: flash 0.2s;
        }
      `}</style>
    </div>
  );
};

export default CarouselPage;
