"use client";

import React, { useState } from "react";
import imageCompression from "browser-image-compression";
import { supabase } from "../utils/supabaseClient";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import Image from "next/image";
import CameraIcon from "./CameraIcon";
import { motion } from "framer-motion"; // Importa motion desde framer-motion

const UploadPhoto = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];

    if (selectedFile && selectedFile.type.startsWith("image/")) {
      try {
        const options = {
          maxSizeMB: 3,
          maxWidthOrHeight: 1080,
          useWebWorker: true,
        };

        const compressedFile = await imageCompression(selectedFile, options);
        setFile(compressedFile);
        setPreview(URL.createObjectURL(compressedFile));
      } catch (error) {
        console.error("Error al comprimir la imagen:", error);
        toast.error("Hubo un problema al comprimir la imagen.");
      }
    } else {
      toast.error("Por favor, selecciona un archivo de imagen válido.");
      setFile(null);
      setPreview(null);
    }
  };

  const handleRemovePhoto = () => {
    setFile(null);
    setPreview(null);
    const input = document.getElementById("photo-input");
    if (input) input.value = "";
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Por favor, selecciona una foto antes de compartir.");
      return;
    }

    setUploading(true);

    const fileName = `${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage
      .from("photos")
      .upload(fileName, file);

    if (error) {
      console.error("Error al subir la foto:", error);
      toast.error(
        "Hubo un problema al compartir la foto. Por favor, inténtalo de nuevo."
      );
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("photos")
      .getPublicUrl(data.path);

    const imageUrl = publicUrlData.publicUrl;

    const { error: insertError } = await supabase
      .from("uploads")
      .insert([{ image_url: imageUrl, comment: comment }]);

    if (insertError) {
      console.error("Error al insertar en la base de datos:", insertError);
      toast.error(
        "Hubo un problema al compartir la foto. Por favor, inténtalo de nuevo."
      );
    } else {
      toast.success("¡Foto compartida exitosamente! Pendiente de aprobación.");
      setFile(null);
      setPreview(null);
      setComment("");
    }

    setUploading(false);
  };

  return (
    <div className="h-[100dvh] flex flex-col px-4 max-w-md mx-auto">
      {/* Top section with logo - reduced margin */}
      <div className="flex-none flex justify-center">
        <div className="p-2 rounded-full">
          <Image
            src="/logo-form.png"
            width={100}
            height={100}
            alt="Logo"
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col gap-3 h-full">
        <input
          type="file"
          id="photo-input"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Image preview/upload area - adjusted height */}
        <div className="relative flex-1 max-h-[72%]">
          <button
            onClick={() => document.getElementById("photo-input").click()}
            className="w-full h-full bg-purple-800/20 rounded-3xl  backdrop-blur-md border border-white/10 flex flex-col items-center justify-center overflow-hidden transition-all hover:bg-purple-800/30 hover:border-white/20 shadow-lg active:scale-95" // Escala al presionar
          >
            {preview ? (
              <>
                <div className="w-full h-full aspect-[4/3]">
                  <img
                    src={preview}
                    alt="Vista previa"
                    className="object-cover w-full h-full rounded-3xl transition-transform duration-300 ease-in-out hover:scale-105" // Transición de escala al hacer hover
                  />
                </div>
                <button
                  onClick={handleRemovePhoto}
                  className="absolute top-3 right-3 w-9 h-9 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all border border-white/10"
                  aria-label="Eliminar foto"
                >
                  <FaTimes className="text-lg" />
                </button>
              </>
            ) : (
              <div className="text-center p-4 space-y-2">
                <div className="inline-block border border-white/20 p-4 rounded-full bg-purple-800/20 animate-pulse">
                  {" "}
                  {/* Animación de pulso */}
                  <CameraIcon className="w-6 h-6 text-white" />
                </div>
                <p className="text-white/90 text-sm px-3 font-medium">
                  Saca una selfie y compartila con nosotros!
                </p>
              </div>
            )}
          </button>
        </div>

        <div className="flex-none h-[12%]">
          <textarea
            value={comment}
            onChange={(e) => {
              // Limita el texto a 189 caracteres
              if (e.target.value.length <= 180) {
                setComment(e.target.value);
              }
            }}
            maxLength={180} // Límite hard de caracteres
            placeholder="Agrega un comentario..."
            className="w-full h-full p-3 bg-purple-800/20 backdrop-blur-md text-white placeholder-white/50 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/25 transition-all hover:bg-purple-800/30 focus:bg-purple-800/30"
          />
        </div>

        {/* Share button with framer-motion effect */}
        <div className="flex-none mb-4">
          <motion.button
            whileTap={{ scale: 0.95 }} // Escala al hacer tap
            onClick={handleUpload}
            disabled={uploading}
            className={`w-full py-3 rounded-xl text-white font-medium transition-all shadow-lg border border-white/10 ${
              uploading
                ? "bg-gray-500/50 cursor-not-allowed"
                : "bg-pink-600 hover:bg-pink-700 active:bg-pink-700"
            }`}
          >
            {uploading ? "Compartiendo..." : "Compartir selfie"}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default UploadPhoto;
