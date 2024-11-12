"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useWindowSize } from "@react-hook/window-size";
import { FaExpand, FaCompress } from "react-icons/fa";
import Confetti from "react-confetti";
import Image from "next/image";
import { supabase } from "@/app/utils/supabaseClient";
import PolaroidCarousel from "@/app/components/PolaroidCarousel";
import CommentBubble from "@/app/components/CommentBubble/CommentBubble";
import QRCode from "@/app/components/QRCode";

import styles from "./styles.module.css";

const DEFAULT_SETTINGS = {
  slide_interval: 5000,
  photos_limit: "all",
  flash_enabled: true,
  flash_interval: 10000,
  emojis_enabled: true,
  emoji_interval: 1000,
  selected_emojis: "❤️,🧡,💛,💚,💙,💜,🎉,🎊,🎈,🥳",
  confetti_enabled: true,
  confetti_interval: 30000,
};

const CarouselPage = () => {
  const [width, height] = useWindowSize();
  const [photos, setPhotos] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [showFlash, setShowFlash] = useState(false);
  const [floatingItems, setFloatingItems] = useState([]);
  const [confettiActive, setConfettiActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState("iPadMini");
  const [currentComment, setCurrentComment] = useState("");

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("carousel_settings")
      .select("*")
      .single();

    if (!error && data) {
      setSettings(data);
    }
  };

  const fetchPhotos = useCallback(async () => {
    try {
      let query = supabase
        .from("uploads")
        .select("*")
        .eq("approved", true)
        .order("created_at", { ascending: false });

      if (settings?.photos_limit && settings.photos_limit !== "all") {
        query = query.limit(parseInt(settings.photos_limit));
      }

      const { data, error } = await query;
      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setLoading(false);
    }
  }, [settings?.photos_limit]);

  const triggerFlash = useCallback(() => {
    if (settings.flash_enabled) {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 200);
    }
  }, [settings.flash_enabled]);

  const createFloatingItem = useCallback(() => {
    if (settings.emojis_enabled) {
      const emojis = settings.selected_emojis
        .split(",")
        .filter((emoji) => emoji.trim());
      const newItem = {
        id: Date.now(),
        emoji: emojis[Math.floor(Math.random() * emojis.length)].trim(),
        left: `${Math.random() * 100}%`,
        animationDuration: `${2 + Math.random() * 3}s`,
        size: `${1.5 + Math.random() * 1}rem`,
      };

      setFloatingItems((prev) => [...prev, newItem]);
      setTimeout(() => {
        setFloatingItems((prev) =>
          prev.filter((item) => item.id !== newItem.id)
        );
      }, parseFloat(newItem.animationDuration) * 1000);
    }
  }, [settings.emojis_enabled, settings.selected_emojis]);

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

    disableScroll();
    fetchSettings();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (settings) {
      fetchPhotos();
      const pollInterval = setInterval(fetchPhotos, 60000);

      // Separar los intervalos para cada efecto
      const emojiInterval = setInterval(() => {
        if (Math.random() < 0.8) createFloatingItem();
      }, settings.emoji_interval || DEFAULT_SETTINGS.emoji_interval);

      // Intervalo específico para el flash
      const flashInterval = setInterval(() => {
        if (settings.flash_enabled) {
          triggerFlash();
        }
      }, settings.flash_interval || DEFAULT_SETTINGS.flash_interval);

      const confettiInterval = setInterval(() => {
        if (settings.confetti_enabled) {
          setConfettiActive(true);
          setTimeout(() => setConfettiActive(false), 5000);
        }
      }, settings.confetti_interval || DEFAULT_SETTINGS.confetti_interval);

      return () => {
        clearInterval(pollInterval);
        clearInterval(emojiInterval);
        clearInterval(flashInterval);
        clearInterval(confettiInterval);
      };
    }
  }, [settings, fetchPhotos, createFloatingItem, triggerFlash]);

  useEffect(() => {
    const channel = supabase
      .channel("carousel-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "carousel_settings",
        },
        () => fetchSettings()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "uploads",
          filter: "approved=eq.true",
        },
        () => fetchPhotos()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPhotos]);

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

  const handleSlideChange = (swiper) => {
    setCurrentComment(photos[swiper.realIndex]?.comment || "");
  };

  if (loading) {
    return (
      <div className={`${styles.container} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Confetti Effect */}
      <Confetti
        width={width}
        height={height}
        numberOfPieces={confettiActive ? 200 : 0}
        colors={["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5"]}
        recycle={false}
      />

      {/* Floating Emojis */}
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

      {/* Main Grid Layout */}
      <div className={styles.gridLayout}>
        <div className={styles.leftSection}>
        <div className={styles.logoContainer}>
  <Image
    src="/images/logo.png"
    alt="Real Meet 2024"
    width={360}
    height={80}
    className="
      w-[clamp(180px,15vw,220px)]
      sm:w-[clamp(200px,18vw,240px)]
      md:w-[clamp(220px,20vw,260px)]
      lg:w-[clamp(240px,22vw,280px)]
      xl:w-[clamp(260px,25vw,380px)]
      2xl:w-[clamp(280px,30vw,380px)]
      h-auto object-contain 
      transition-transform duration-300
      hover:scale-105
    "
    priority
  />
</div>
          <CommentBubble comment={currentComment} />
        </div>

        <div className={styles.centerSection}>
          <div className={styles.deviceWrapper}>
            <PolaroidCarousel
              photos={photos}
              onSlideChange={handleSlideChange}
              decorationType="TAPE_LIGHT"
              slideInterval={settings.slide_interval}
            />
          </div>
        </div>
        <div className={styles.rightSection}>
          <div className="mt-4 lg:mt-8 xl:mt-16 w-full flex justify-center">
            <QRCode
              size={window.innerWidth <= 1366 ? 200 : 280} // Tamaño condicional
            />
          </div>
          <div className="w-full flex justify-center">
            <Image
              src="/images/logo-blanco.png"
              alt="Logo empresa"
              width={window.innerWidth <= 1366 ? 180 : 260}
              height={window.innerWidth <= 1366 ? 100 : 150}
              className="object-contain opacity-90 hover:opacity-100 transition-opacity"
              priority
            />
          </div>
        </div>
      </div>

      <button
        onClick={toggleFullscreen}
        className="fixed top-4 right-4 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full shadow-xl border border-white/50 transition-all duration-300 z-50"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? <FaCompress size={18} /> : <FaExpand size={18} />}
      </button>

      {showFlash && <div className={styles.flash} />}
    </div>
  );
};

export default CarouselPage;
