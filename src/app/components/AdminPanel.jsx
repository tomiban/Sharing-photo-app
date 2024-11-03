"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaCheck, FaTrash, FaCog, FaImages } from 'react-icons/fa';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'react-toastify';
import CarouselSettings from '@/app/components/CarouselSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

const AdminPanel = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        fetchPendingUploads();
      } else {
        router.push('/admin/login');
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
      toast.error('Error al obtener las fotos pendientes');
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
      toast.error('Error al aprobar la foto');
    } else {
      toast.success('Foto aprobada exitosamente');
      fetchPendingUploads();
    }
  };

  const deleteUpload = async (id, image_url) => {
    const imagePath = image_url.split('/storage/v1/object/public/photos/')[1];

    const { error: deleteError } = await supabase
      .from('uploads')
      .delete()
      .eq('id', id);

    if (deleteError) {
      toast.error('Error al eliminar el registro');
      return;
    }

    const { error: storageError } = await supabase.storage
      .from('photos')
      .remove([imagePath]);

    if (storageError) {
      toast.error('Error al eliminar la imagen');
    } else {
      toast.success('Foto eliminada exitosamente');
      fetchPendingUploads();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <main className="min-h-screen text-gray-100 flex flex-col items-center justify-start p-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition"
          >
            Cerrar Sesión
          </button>
        </div>

        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-700">
            <TabsTrigger value="photos" className="flex items-center gap-2 data-[state=active]:bg-gray-600">
              <FaImages />
              Fotos Pendientes
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-gray-600">
              <FaCog />
              Configuración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photos" className="bg-gray-800 rounded-lg shadow-md p-6">
            {loading ? (
              <p className="text-center">Cargando fotos pendientes...</p>
            ) : uploads.length === 0 ? (
              <p className="text-center">No hay fotos pendientes de aprobación.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {uploads.map((upload) => (
                  <div key={upload.id} className="bg-gray-700 rounded-lg overflow-hidden">
                    <img src={upload.image_url} alt="Foto pendiente" className="w-full h-48 object-cover" />
                    <div className="p-4">
                      <p className="mb-4">{upload.comment || 'Sin comentario'}</p>
                      <div className="flex justify-between">
                        <button
                          onClick={() => approveUpload(upload.id)}
                          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition flex items-center"
                        >
                          <FaCheck className="mr-2" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => deleteUpload(upload.id, upload.image_url)}
                          className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition flex items-center"
                        >
                          <FaTrash className="mr-2" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <CarouselSettings />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default AdminPanel;