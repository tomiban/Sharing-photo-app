"use client"

import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../utils/supabaseClient';
import { FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Image from 'next/image';
import CameraIcon from './CameraIcon';

const UploadPhoto = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];

    if (selectedFile && selectedFile.type.startsWith('image/')) {
      try {
        const options = {
          maxSizeMB: 3,
          maxWidthOrHeight: 1080,
          useWebWorker: true,
        };

        const compressedFile = await imageCompression(selectedFile, options);
        setFile(compressedFile);
        setPreview(URL.createObjectURL(compressedFile));
        
        toast.success('Foto seleccionada correctamente');
      } catch (error) {
        console.error('Error al comprimir la imagen:', error);
        toast.error('Hubo un problema al comprimir la imagen.');
      }
    } else {
      toast.error('Por favor, selecciona un archivo de imagen válido.');
      setFile(null);
      setPreview(null);
    }
  };

  const handleRemovePhoto = () => {
    setFile(null);
    setPreview(null);
    const input = document.getElementById('photo-input');
    if (input) input.value = '';
    toast.info('Foto eliminada');
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Por favor, selecciona una foto antes de compartir.');
      return;
    }

    setUploading(true);

    const fileName = `${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage
      .from('photos')
      .upload(fileName, file);

    if (error) {
      console.error('Error al subir la foto:', error);
      toast.error('Hubo un problema al compartir la foto. Por favor, inténtalo de nuevo.');
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('photos')
      .getPublicUrl(data.path);

    const imageUrl = publicUrlData.publicUrl;

    const { error: insertError } = await supabase
      .from('uploads')
      .insert([{ image_url: imageUrl, comment: comment }]);

    if (insertError) {
      console.error('Error al insertar en la base de datos:', insertError);
      toast.error('Hubo un problema al compartir la foto. Por favor, inténtalo de nuevo.');
    } else {
      toast.success('¡Foto compartida exitosamente! Pendiente de aprobación.');
      setFile(null);
      setPreview(null);
      setComment('');
    }

    setUploading(false);
  };

  return (
    <div className="min-h-screen w-full relative">
      {/* Background image - Optimized for mobile */}
      <div className="absolute inset-0">
        <Image 
          src="/background.jpg"
          alt="Background"
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
          quality={85}
        />
      </div>
      
      {/* Purple gradient overlay */}
      <div className="absolute inset-0 bg-purple-900/50" />

      {/* Content */}
      <div className="relative w-full px-4 sm:px-6 min-h-screen flex flex-col max-w-lg mx-auto">
        <div className="flex-1 flex flex-col justify-between py-8">
          {/* Upload area */}
          <div className="flex-1 flex flex-col gap-4">
            <input
              type="file"
              id="photo-input"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Preview area - Adjusted height */}
            <div className="relative h-[60vh]"> {/* Aumentado el alto */}
              <button
                onClick={() => document.getElementById('photo-input').click()}
                className="w-full h-full bg-purple-800/30 rounded-3xl backdrop-blur-sm border-2 border-purple-300/20 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:bg-purple-800/40 transition-all"
              >
                {preview ? (
                  <>
                    <img
                      src={preview}
                      alt="Vista previa"
                      className="object-cover w-full h-full"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto();
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all active:scale-95"
                      aria-label="Eliminar foto"
                    >
                      <FaTimes className="text-lg" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <div className='border border-x-2 p-6 rounded-full'>
                      <CameraIcon  />
                    </div>
                   
                  </div>
                )}
              <p className="text-purple-200/90 text-sm mt-2">Saca una selfie y compartila con nosotros!</p>
              </button>
            </div>

            {/* Comment input */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Agrega un comentario..."
              className="w-full p-4 bg-purple-800/30 text-purple-100 placeholder-purple-300/50 rounded-xl border border-purple-300/20 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none h-20 backdrop-blur-sm"
            />
          </div>

          {/* Share button */}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`w-full mt-6 py-4 rounded-xl text-white font-medium transition-all ${
              uploading 
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-pink-600 hover:bg-pink-700 active:bg-pink-800'
            }`}
          >
            {uploading ? 'Compartiendo...' : 'Compartir selfie'}
          </button>

          {/* Logo at bottom */}
          <div className="flex justify-center mt-4">
            <Image 
              src="/logo-form.png" 
              width={100} 
              height={100} 
              alt="Logo"
              className="w-24 h-24 object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPhoto;