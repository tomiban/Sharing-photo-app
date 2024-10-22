"use client"
import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../utils/supabaseClient';
import { FaCamera, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Image from 'next/image';

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
    <div className="w-full h-full flex items-start justify-center py-4">
      <div className="w-[95%] bg-white/10 backdrop-blur-sm rounded-xl shadow-lg flex flex-col gap-4">
        {/* Logo */}
        <div className="flex justify-center pt-6">
          <Image src="/logo.png" width={60} height={60} alt="Logo" className="w-16 h-16" />
        </div>

        {/* Input oculto para la cámara */}
        <input
          type="file"
          id="photo-input"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Área de vista previa interactiva */}
        <div className="mx-4 relative">
          <button
            onClick={() => document.getElementById('photo-input').click()}
            className="w-full aspect-[4/5] bg-white/10 rounded-xl flex items-center justify-center border-2 border-white/20 overflow-hidden hover:bg-white/15 transition-all active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-purple-400"
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
                  className="absolute top-2 right-2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all active:scale-95"
                  aria-label="Eliminar foto"
                >
                  <FaTimes className="text-xl" />
                </button>
              </>
            ) : (
              <div className="text-center p-8">
                <FaCamera className="mx-auto text-5xl text-white/70 mb-4" />
                <p className="text-white/90 text-base font-medium">Toca para tomar una foto</p>
              </div>
            )}
          </button>
        </div>

        {/* Comentario */}
        <div className="px-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Agrega un comentario..."
            className="w-full p-4 bg-white/10 text-white placeholder-white/50 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none h-24 text-base"
          />
        </div>

        {/* Botón para subir la foto */}
        <div className="px-4 pb-6">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`w-full py-4 rounded-xl text-white text-base font-semibold transition-all active:scale-98 ${
              uploading 
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-pink-500 hover:bg-pink-600 active:bg-pink-700'
            }`}
          >
            {uploading ? 'Compartiendo...' : 'Compartir foto'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadPhoto;