"use client"
import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../utils/supabaseClient';
import { FaCamera } from 'react-icons/fa';
import { toast } from 'react-toastify';

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
    <div className="max-w-md mx-auto bg-gradient-to-b from-purple-500 to-indigo-700 rounded-lg shadow-md p-6">
      <h2 className="text-3xl font-semibold text-white mb-6 text-center">
        Real Meet Photo Share
      </h2>

      <input
        type="file"
        id="photo-input"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="w-full h-64 bg-white/10 rounded-lg flex items-center justify-center mb-4 border-2 border-white/20">
        {preview ? (
          <img
            src={preview}
            alt="Vista previa"
            className="object-cover w-full h-full rounded-md"
          />
        ) : (
          <p className="text-white">No hay Foto seleccionada</p>
        )}
      </div>

      <button
        className="w-full bg-white/20 hover:bg-white/30 text-white py-3 rounded-full flex items-center justify-center mb-4 transition"
        onClick={() => document.getElementById('photo-input')?.click()}
      >
        <FaCamera className="mr-2 text-xl" />
      </button>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Agrega un comentario..."
        className="w-full p-3 bg-white/20 text-white border border-white/30 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
      ></textarea>

      <button
        onClick={handleUpload}
        disabled={uploading}
        className={`w-full py-3 rounded-md text-white text-lg ${
          uploading
            ? 'bg-gray-500 cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-600'
        } transition`}
      >
        {uploading ? 'Compartiendo...' : 'Compartir foto'}
      </button>
    </div>
  );
};

export default UploadPhoto;
