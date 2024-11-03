"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaCheck, FaTrash, FaCog, FaImages, FaSignOutAlt } from "react-icons/fa";
import { supabase } from "../../utils/supabaseClient";
import { toast } from "react-toastify";
import CarouselSettings from "@/app/components/CarouselSettings";
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
        router.push("/admin/login");
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          fetchPendingUploads();
        } else {
          setUploads([]);
          router.push("/admin/login");
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
      .from("uploads")
      .select("*")
      .eq("approved", false)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Error al obtener las fotos pendientes");
    } else {
      setUploads(data);
    }
    setLoading(false);
  };

  const approveUpload = async (id) => {
    const { error } = await supabase
      .from("uploads")
      .update({ approved: true })
      .eq("id", id);

    if (error) {
      toast.error("Error al aprobar la foto");
    } else {
      toast.success("Foto aprobada exitosamente");
      fetchPendingUploads();
    }
  };

  const deleteUpload = async (id, image_url) => {
    const imagePath = image_url.split("/storage/v1/object/public/photos/")[1];

    const { error: deleteError } = await supabase
      .from("uploads")
      .delete()
      .eq("id", id);

    if (deleteError) {
      toast.error("Error al eliminar el registro");
      return;
    }

    const { error: storageError } = await supabase.storage
      .from("photos")
      .remove([imagePath]);

    if (storageError) {
      toast.error("Error al eliminar la imagen");
    } else {
      toast.success("Foto eliminada exitosamente");
      fetchPendingUploads();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 flex flex-col items-center justify-start p-2 sm:p-4 md:p-8">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-4 sm:mb-8 bg-gray-800/50 p-4 sm:p-6 rounded-xl backdrop-blur-sm border border-gray-700/50 shadow-lg">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Panel de Administración
            </h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">
              Gestión de fotos y configuración del carrusel
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto bg-red-600/90 hover:bg-red-700 text-white py-2.5 px-5 rounded-lg transition-all 
            duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-red-600/25 active:scale-95
            border border-red-500/20 backdrop-blur-sm text-sm sm:text-base"
          >
            <FaSignOutAlt />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {/* Tabs Container */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 shadow-lg backdrop-blur-sm overflow-hidden">
          <Tabs defaultValue="photos" className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-0 h-14 sm:h-12 bg-gray-900/50">
              <TabsTrigger 
                value="photos" 
                className="w-full h-full flex items-center justify-center gap-2
                  data-[state=active]:bg-purple-600 data-[state=active]:text-white 
                  data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:bg-gray-800/50
                  transition-all duration-200 rounded-none border-0 text-sm sm:text-base"
              >
                <FaImages className="text-lg" />
                <span className="font-medium">Fotos Pendientes</span>
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="w-full h-full flex items-center justify-center gap-2
                  data-[state=active]:bg-purple-600 data-[state=active]:text-white 
                  data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:bg-gray-800/50
                  transition-all duration-200 rounded-none border-0 text-sm sm:text-base"
              >
                <FaCog className="text-lg" />
                <span className="font-medium">Configuración</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="photos" className="mt-0 p-2 sm:p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4" />
                  <p className="text-gray-400 text-sm sm:text-base">Cargando fotos pendientes...</p>
                </div>
              ) : uploads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <FaImages className="text-4xl sm:text-5xl mb-4 opacity-50" />
                  <p className="text-base sm:text-lg">No hay fotos pendientes de aprobación</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {uploads.map((upload) => (
                    <div
                      key={upload.id}
                      className="group bg-gray-700/50 rounded-xl overflow-hidden border border-gray-600/50 
                      shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-700"
                    >
                      <div className="relative h-48 sm:h-56 overflow-hidden">
                        <img
                          src={upload.image_url}
                          alt="Foto pendiente"
                          className="w-full h-full object-cover transition-transform duration-300 
                          group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 
                          group-hover:opacity-60 transition-opacity duration-300" />
                      </div>
                      <div className="p-4 sm:p-5">
                        <p className="mb-4 sm:mb-5 text-gray-300 text-sm sm:text-base">
                          {upload.comment || (
                            <span className="text-gray-500 italic">Sin comentario</span>
                          )}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                          <button
                            onClick={() => approveUpload(upload.id)}
                            className="flex-1 bg-green-600/90 hover:bg-green-700 text-white py-2.5 px-4 
                            rounded-lg transition-all duration-200 flex items-center justify-center gap-2
                            shadow-lg hover:shadow-green-600/25 active:scale-95 border border-green-500/20
                            text-sm sm:text-base"
                          >
                            <FaCheck />
                            <span>Aprobar</span>
                          </button>
                          <button
                            onClick={() => deleteUpload(upload.id, upload.image_url)}
                            className="flex-1 bg-red-600/90 hover:bg-red-700 text-white py-2.5 px-4 
                            rounded-lg transition-all duration-200 flex items-center justify-center gap-2
                            shadow-lg hover:shadow-red-600/25 active:scale-95 border border-red-500/20
                            text-sm sm:text-base"
                          >
                            <FaTrash />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="p-2 sm:p-4">
              <CarouselSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
};

export default AdminPanel;