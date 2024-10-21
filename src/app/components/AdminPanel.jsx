// src/components/AdminPanel.js

import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/router';

const AdminPanel = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthUser(session?.user ?? null);
      if (session) {
        fetchPendingUploads();
      } else {
        router.push('/admin/login');
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthUser(session?.user ?? null);
        if (session) {
          fetchPendingUploads();
        } else {
          setUploads([]);
          router.push('/admin/login');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const fetchPendingUploads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('approved', false)
      .order('created_at', { ascending: true });

 
    if (error) {
      console.error('Error al obtener las fotos pendientes:', error);
      alert('Hubo un problema al obtener las fotos pendientes.');
    } else {
      setUploads(data);
    }
    setLoading(false);
  };

  const approveUpload = async (id) => {
    const { error } = await supabase
      .from('uploads')
      .update({ approved: true })
      .eq('id', id);

    if (error) {
      console.error('Error al aprobar la foto:', error);
      alert('Hubo un problema al aprobar la foto.');
    } else {
      alert('Foto aprobada.');
      fetchPendingUploads();
    }
  };

  const deleteUpload = async (id, image_url) => {
    // Extraer el path de la URL de la imagen
    const imagePath = image_url.split('/storage/v1/object/public/photos/')[1];

    // Eliminar el registro de la base de datos
    const { error: deleteError } = await supabase
      .from('uploads')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error al eliminar el registro:', deleteError);
      alert('Hubo un problema al eliminar la foto.');
      return;
    }

    // Eliminar la imagen del almacenamiento
    const { error: storageError } = await supabase.storage
      .from('photos')
      .remove([imagePath]);

    if (storageError) {
      console.error('Error al eliminar la imagen:', storageError);
      alert('Hubo un problema al eliminar la imagen.');
    } else {
      alert('Foto eliminada.');
      fetchPendingUploads();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  if (!authUser) {
    return null; // Mientras se redirige, no renderizar nada
  }

  return (
    <div className={styles.adminContainer}>
      <h2>Panel de Administración</h2>
      <button onClick={handleLogout} className={styles.logoutButton}>
        Cerrar Sesión
      </button>
      {loading ? (
        <p>Cargando fotos pendientes...</p>
      ) : uploads.length === 0 ? (
        <p>No hay fotos pendientes de aprobación.</p>
      ) : (
        <div className={styles.uploadsList}>
          {uploads.map((upload) => (
            <div key={upload.id} className={styles.uploadItem}>
              <img src={upload.image_url} alt="Foto pendiente" />
              <p>{upload.comment || 'Sin comentario'}</p>
              <div className={styles.actions}>
                <button onClick={() => approveUpload(upload.id)} className={styles.approveButton}>
                  Aprobar
                </button>
                <button
                  onClick={() => deleteUpload(upload.id, upload.image_url)}
                  className={styles.deleteButton}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
