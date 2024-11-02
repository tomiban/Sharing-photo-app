"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useWindowSize } from "@react-hook/window-size";
import { FaExpand, FaCompress } from "react-icons/fa";
import Confetti from "react-confetti";
import { supabase } from "@/app/utils/supabaseClient";
import DeviceCarousel from "@/app/components/DeviceCarousel/DeviceCarousel";
import CommentBubble from "@/app/components/CommentBubble/CommentBubble";
import QRCode from "@/app/components/QRCode";
import { DEVICE_CONFIGS } from "@/app/components/DeviceCarousel/config";
import styles from "./styles.module.css";
import Image from "next/image";

const POLL_INTERVAL = 60000;
const EFFECT_INTERVAL = 1000;
const PARTY_EMOJIS = [
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🎉",
  "🎊",
  "🎈",
  "🥳",
];
const CONFETTI_COLORS = ["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5"];

export default function CarouselPage() {
  const [width, height] = useWindowSize();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFlash, setShowFlash] = useState(false);
  const [floatingItems, setFloatingItems] = useState([]);
  const [confettiActive, setConfettiActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState("iPadMini");
  const [currentComment, setCurrentComment] = useState("");

  // Deshabilitar scroll y manejar fullscreen
  useEffect(() => {
    const disableScroll = () => {
      document.documentElement.style.cssText = `
        overflow: hidden !important;
        height: 100vh;
        width: 100vw;
        position: fixed;
        touch-action: none;
        -webkit-overflow-scrolling: none;
        overscroll-behavior: none;
        margin: 0;
        padding: 0;
      `;
      document.body.style.cssText = document.documentElement.style.cssText;
    };

    const enableScroll = () => {
      document.documentElement.style.cssText = "";
      document.body.style.cssText = "";
    };

    disableScroll();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      enableScroll();
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Fetch de fotos y suscripción a cambios
  const fetchPhotos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("uploads")
        .select("*")
        .eq("approved", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
    const pollInterval = setInterval(fetchPhotos, POLL_INTERVAL);

    const channel = supabase
      .channel("public:uploads")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "uploads",
          filter: "approved=eq.true",
        },
        fetchPhotos
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [fetchPhotos]);

  // Efectos visuales
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
      size: `${1.5 + Math.random() * 1}rem`,
    };

    setFloatingItems((prev) => [...prev, newItem]);
    setTimeout(() => {
      setFloatingItems((prev) => prev.filter((item) => item.id !== newItem.id));
    }, parseFloat(newItem.animationDuration) * 1000);
  }, []);

  useEffect(() => {
    fetchPhotos(); // Fetch inicial
  
    // Configuración del canal de tiempo real
    const channel = supabase
      .channel('upload-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escucha todos los eventos (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'uploads',
          filter: 'approved=eq.true'
        },
        (payload) => {
          console.log('Cambio detectado:', payload);
          // Actualizar fotos según el tipo de cambio
          if (payload.eventType === 'INSERT') {
            setPhotos(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setPhotos(prev => 
              prev.map(photo => 
                photo.id === payload.new.id ? payload.new : photo
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setPhotos(prev => 
              prev.filter(photo => photo.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();
  
    // Polling como respaldo
    const pollInterval = setInterval(fetchPhotos, POLL_INTERVAL);
  
    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [fetchPhotos]);

  useEffect(() => {
    const effectInterval = setInterval(() => {
      if (Math.random() < 0.8) createFloatingItem();
      if (Math.random() < 0.2) triggerFlash();
    }, EFFECT_INTERVAL);

    const confettiInterval = setInterval(() => {
      setConfettiActive(true);
      setTimeout(() => setConfettiActive(false), 5000);
    }, 30000);

    return () => {
      clearInterval(effectInterval);
      clearInterval(confettiInterval);
    };
  }, [createFloatingItem, triggerFlash]);


  // Toggle fullscreen
  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white" />
      </div>
    );
  }

  const handleSlideChange = (currentIndex) => {
    setCurrentComment(photos[currentIndex]?.comment || "");
  };

  return (
    <div className={styles.container}>
      {/* Logo */}
      <div className={styles.logoContainer}>
        <Image
          src="/logo-form.png" // Ajusta la ruta según donde guardes el logo
          alt="Real Meet 2024"
          width={200}
          height={60}
          priority
        />
      </div>
      <CommentBubble  comment={currentComment} />
      {/* Efectos de fondo */}
      <div className={styles.backgroundEffects}>
        <div className={styles.ambientEffect} />
        <div className={styles.starLayer1} />
        <div className={styles.starLayer2} />
        <div
          className={styles.brightStar}
          style={{ top: "15%", left: "20%" }}
        />
        <div
          className={styles.brightStar}
          style={{ top: "25%", right: "30%" }}
        />
        <div
          className={styles.brightStar}
          style={{ bottom: "30%", left: "25%" }}
        />
        <div
          className={styles.brightStar}
          style={{ bottom: "20%", right: "15%" }}
        />
      </div>

      <Confetti
        width={width}
        height={height}
        numberOfPieces={confettiActive ? 200 : 0}
        colors={CONFETTI_COLORS}
        recycle={false}
      />

      {floatingItems.map((item) => (
        <div
          key={item.id}
          className={styles.floatingItem}
          style={{
            left: item.left,
            animationDuration: item.animationDuration,
            fontSize: item.size,
          }}
        >
          {item.emoji}
        </div>
      ))}

      <main className={styles.mainContent}>
        <div className={styles.carouselLayout}>
          <div className={styles.deviceWrapper}>
          <DeviceCarousel
  photos={photos}
  deviceConfig={DEVICE_CONFIGS[selectedDevice]}
  isFullscreen={isFullscreen}
  width={width}
  height={height}
  onSlideChange={(swiper) => handleSlideChange(swiper.realIndex)}
/>

            {/* Elimina la burbuja de comentario de aquí ya que ahora está en DeviceCarousel */}
          </div>
        </div>
      </main>
      <div className="fixed bottom-8 right-8 z-50">
        <Image
          src="/logo-blanco.png"
          alt="Logo empresa"
          width={200}
          height={120}
          className="object-contain opacity-90 hover:opacity-100 transition-opacity"
          priority
        />
      </div>
      {/* Botón de fullscreen reposicionado */}
      <button
        onClick={toggleFullscreen}
        className="fixed top-4 right-4 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full shadow-xl border border-white/50 transition-all duration-300 z-50"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? <FaCompress size={18} /> : <FaExpand size={18} />}
      </button>

      <div className="fixed top-20 right-24 z-50">
        <QRCode
          url={process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}
        />
      </div>
      {showFlash && <div className={styles.flash} />}
    </div>
  );
}
