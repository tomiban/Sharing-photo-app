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
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="w-[95%] min-h-screen bg-white/10 backdrop-blur-sm flex flex-col">
        {/* Contenido principal con padding igual arriba y abajo */}
        <div className="flex-1 flex flex-col justify-between py-2">
          {/* Logo */}
          <div className="flex justify-center">
            <Image src="/logo.png" width={60} height={60} alt="Logo" className="w-12 h-12" />
          </div>

          {/* Área de foto y comentario */}
          <div className="flex-1 flex flex-col justify-center gap-3 px-3">
            <input
              type="file"
              id="photo-input"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Área de vista previa */}
            <div className="relative">
              <button
                onClick={() => document.getElementById('photo-input').click()}
                className="w-full aspect-[4/3] bg-white/10 rounded-xl flex items-center justify-center border-2 border-white/20 overflow-hidden hover:bg-white/15 transition-all active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-purple-400"
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
                    <FaCamera className="mx-auto text-4xl text-white/70 mb-2" />
                    <p className="text-white/90 text-sm font-medium">Toca para tomar una foto</p>
                  </div>
                )}
              </button>
            </div>

            {/* Comentario */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Agrega un comentario..."
              className="w-full p-3 bg-white/10 text-white placeholder-white/50 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none h-16 text-sm"
            />
          </div>

          {/* Botón de compartir */}
          <div className="px-3 pb-2">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className={`w-full py-3 rounded-xl text-white text-sm font-semibold transition-all active:scale-98 ${
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
    </div>
  );
};

export default UploadPhoto;