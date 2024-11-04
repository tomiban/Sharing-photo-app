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

const DEFAULT_SETTINGS = {
  slide_interval: 5000,
  photos_limit: 'all',
  flash_enabled: true,
  flash_interval: 10000,
  emojis_enabled: true,
  emoji_interval: 1000,
  selected_emojis: "❤️,🧡,💛,💚,💙,💜,🎉,🎊,🎈,🥳",
  confetti_enabled: true,
  confetti_interval: 30000
};

export default function CarouselPage() {
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
    console.log('Fetching carousel settings...');
    const { data, error } = await supabase
      .from('carousel_settings')
      .select('*')
      .single();

    console.log('Settings response:', { data, error });

    if (!error && data) {
      console.log('Updating settings:', data);
      setSettings(data);
    } else {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchPhotos = useCallback(async () => {
    try {
      let query = supabase
        .from("uploads")
        .select("*")
        .eq("approved", true)
        .order("created_at", { ascending: false });

      if (settings?.photos_limit && settings.photos_limit !== 'all') {
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

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const triggerFlash = useCallback(() => {
    if (settings.flash_enabled) {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 200);
    }
  }, [settings.flash_enabled]);

  const createFloatingItem = useCallback(() => {
    if (settings.emojis_enabled) {
      const emojis = settings.selected_emojis.split(',').filter(emoji => emoji.trim());
      const newItem = {
        id: Date.now(),
        emoji: emojis[Math.floor(Math.random() * emojis.length)].trim(),
        left: `${Math.random() * 100}%`,
        animationDuration: `${2 + Math.random() * 3}s`,
        size: `${1.5 + Math.random() * 1}rem`,
      };

      setFloatingItems((prev) => [...prev, newItem]);
      setTimeout(() => {
        setFloatingItems((prev) => prev.filter((item) => item.id !== newItem.id));
      }, parseFloat(newItem.animationDuration) * 1000);
    }
  }, [settings.emojis_enabled, settings.selected_emojis]);

  useEffect(() => {
    if (settings) {
      fetchPhotos();
      const pollInterval = setInterval(fetchPhotos, 60000);

      const effectInterval = setInterval(() => {
        if (Math.random() < 0.8) createFloatingItem();
        if (Math.random() < 0.2) triggerFlash();
      }, settings.emoji_interval || DEFAULT_SETTINGS.emoji_interval);

      const confettiInterval = setInterval(() => {
        if (settings.confetti_enabled) {
          setConfettiActive(true);
          setTimeout(() => setConfettiActive(false), 5000);
        }
      }, settings.confetti_interval || DEFAULT_SETTINGS.confetti_interval);

      return () => {
        clearInterval(pollInterval);
        clearInterval(effectInterval);
        clearInterval(confettiInterval);
      };
    }
  }, [settings, fetchPhotos, createFloatingItem, triggerFlash]);

  useEffect(() => {
    console.log('Setting up realtime subscriptions...');
    const channel = supabase
      .channel('carousel-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'carousel_settings'
        },
        (payload) => {
          console.log('Settings changed:', payload);
          fetchSettings();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'uploads',
          filter: 'approved=eq.true'
        },
        (payload) => {
          console.log('Photos changed:', payload);
          fetchPhotos();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up subscriptions...');
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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white" />
      </div>
    );
  }

  const handleSlideChange = (swiper) => {
    setCurrentComment(photos[swiper.realIndex]?.comment || "");
  };

  return (
    <div className={styles.container}>
      <div className={styles.logoContainer}>
        <Image
          src="/logo-form.png"
          alt="Real Meet 2024"
          width={260}
          height={80}
          priority
        />
      </div>

      <CommentBubble comment={currentComment} />

      <div className={styles.backgroundEffects}>
        <div className={styles.ambientEffect} />
        <div className={styles.starLayer1} />
        <div className={styles.starLayer2} />
        <div className={styles.brightStar} style={{ top: "15%", left: "20%" }} />
        <div className={styles.brightStar} style={{ top: "25%", right: "30%" }} />
        <div className={styles.brightStar} style={{ bottom: "30%", left: "25%" }} />
        <div className={styles.brightStar} style={{ bottom: "20%", right: "15%" }} />
      </div>

      <Confetti
        width={width}
        height={height}
        numberOfPieces={confettiActive ? 200 : 0}
        colors={["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5"]}
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
              onSlideChange={handleSlideChange}
              autoplayDelay={settings.slide_interval}
            />
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

      <button
        onClick={toggleFullscreen}
        className="fixed top-4 right-4 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full shadow-xl border border-white/50 transition-all duration-300 z-50"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? <FaCompress size={18} /> : <FaExpand size={18} />}
      </button>

      <div className="fixed top-20 right-24 z-50">
        <QRCode url={process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"} />
      </div>

      {showFlash && <div className={styles.flash} />}
    </div>
  );
}