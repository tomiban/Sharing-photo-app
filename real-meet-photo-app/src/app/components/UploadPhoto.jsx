"use client"
import React, { useState } from 'react';
import imageCompression from 'browser-image-compression'; // Importa la librería de compresión
import { supabase } from '../utils/supabaseClient';
import { FaCamera } from 'react-icons/fa';
import { toast } from 'react-toastify';

const UploadPhoto = () => {
  const [file, setFile] = useState(null); // Estado para almacenar el archivo seleccionado.
  const [preview, setPreview] = useState(null); // Estado para almacenar la vista previa de la imagen seleccionada.
  const [comment, setComment] = useState(''); // Estado para almacenar el comentario del usuario.
  const [uploading, setUploading] = useState(false); // Estado para indicar si el archivo se está subiendo.

  // Maneja el cambio de archivo cuando el usuario selecciona una imagen.
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0]; // Obtiene el archivo seleccionado.

    // Verifica si el archivo seleccionado es de tipo imagen.
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      try {
        // Opciones de compresión
        const options = {
          maxSizeMB: 3, // Tamaño máximo del archivo en MB (0.5 MB = 500 KB)
          maxWidthOrHeight: 1080, // Resolución máxima (1080px de alto o ancho)
          useWebWorker: true, // Usa Web Workers para mejorar el rendimiento
        };

        // Comprime la imagen
        const compressedFile = await imageCompression(selectedFile, options);
        
        setFile(compressedFile); // Guarda el archivo comprimido en el estado
        setPreview(URL.createObjectURL(compressedFile)); // Genera y guarda una URL de vista previa

      } catch (error) {
        console.error('Error al comprimir la imagen:', error);
        toast.error('Hubo un problema al comprimir la imagen.');
      }
    } else {
      toast.error('Por favor, selecciona un archivo de imagen válido.'); // Muestra un error si el archivo no es una imagen.
      setFile(null); // Limpia el archivo seleccionado.
      setPreview(null); // Limpia la vista previa.
    }
  };

  // Sube la imagen seleccionada al bucket de Supabase y guarda la URL en la base de datos.
  const handleUpload = async () => {
    if (!file) { // Si no hay un archivo seleccionado, muestra un error.
      toast.error('Por favor, selecciona una foto antes de compartir.');
      return;
    }

    setUploading(true); // Establece el estado de "subiendo" a verdadero para deshabilitar el botón de subir.

    // Genera un nombre único para la imagen usando la fecha actual y el nombre original del archivo.
    const fileName = `${Date.now()}_${file.name}`;
    
    // Sube la imagen comprimida al bucket "photos" en Supabase Storage.
    const { data, error } = await supabase.storage
      .from('photos') // Especifica el bucket "photos".
      .upload(fileName, file); // Sube el archivo comprimido con el nombre generado.

    // Maneja el error si la subida falla.
    if (error) {
      console.error('Error al subir la foto:', error);
      toast.error('Hubo un problema al compartir la foto. Por favor, inténtalo de nuevo.');
      setUploading(false); // Establece el estado de "subiendo" a falso para reactivar el botón.
      return;
    }

    // Genera una URL pública de la imagen subida usando la ruta retornada.
    const { data: publicUrlData } = supabase.storage
      .from('photos') // Especifica el bucket "photos".
      .getPublicUrl(data.path); // Obtiene la URL pública a partir del path del archivo subido.

    const imageUrl = publicUrlData.publicUrl; // Almacena la URL pública de la imagen.

    // Inserta la URL de la imagen y el comentario en la tabla "uploads" de la base de datos.
    const { error: insertError } = await supabase
      .from('uploads') // Especifica la tabla "uploads".
      .insert([{ image_url: imageUrl, comment: comment }]); // Inserta la URL de la imagen y el comentario en la tabla.

    // Maneja el error si la inserción en la base de datos falla.
    if (insertError) {
      console.error('Error al insertar en la base de datos:', insertError);
      toast.error('Hubo un problema al compartir la foto. Por favor, inténtalo de nuevo.');
    } else {
      // Si la inserción fue exitosa, muestra un mensaje de éxito y limpia el formulario.
      toast.success('¡Foto compartida exitosamente! Pendiente de aprobación.');
      setFile(null); // Limpia el archivo seleccionado.
      setPreview(null); // Limpia la vista previa.
      setComment(''); // Limpia el comentario.
    }

    setUploading(false); // Establece el estado de "subiendo" a falso para permitir nuevas subidas.
  };

  return (
    <div className="max-w-md mx-auto bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">Compartir Foto</h2>

      <input
        type="file"
        id="photo-input"
        accept="image/*"
        capture="user" // Cambia a "user" para usar la cámara frontal (selfies).
        className="hidden"
        onChange={handleFileChange} // Llama a handleFileChange cuando el usuario selecciona un archivo.
      />

      <div className="w-full h-64 bg-gray-700 rounded-md flex items-center justify-center mb-4">
        {preview ? (
          <img src={preview} alt="Vista previa" className="object-cover w-full h-full rounded-md" />
        ) : (
          <p className="text-gray-400">No hay foto seleccionada</p>
        )}
      </div>

      <button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md flex items-center justify-center mb-4 transition"
        onClick={() => document.getElementById('photo-input')?.click()} // Activa el input oculto de archivos.
      >
        <FaCamera className="mr-2" />
        Tomar Selfie
      </button>

      <textarea
        value={comment} // Estado del comentario.
        onChange={(e) => setComment(e.target.value)} // Actualiza el comentario cuando el usuario escribe.
        placeholder="Agrega un comentario..."
        className="w-full p-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-md mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      ></textarea>

      <button
        onClick={handleUpload} // Llama a handleUpload cuando se hace clic para subir la imagen.
        disabled={uploading} // Deshabilita el botón si ya se está subiendo la imagen.
        className={`w-full py-2 rounded-md text-white ${
          uploading ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
        } transition`}
      >
        {uploading ? 'Compartiendo...' : 'Compartir foto'} {/* Muestra un mensaje diferente dependiendo del estado de subida. */}
      </button>
    </div>
  );
};

export default UploadPhoto;
