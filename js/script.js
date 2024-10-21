// script.js

document.addEventListener('DOMContentLoaded', () => {
  // Reemplaza con tu URL y clave anónima de Supabase
  const SUPABASE_URL = 'https://tusupabaseurl.supabase.co';
  const SUPABASE_ANON_KEY = 'tu_anon_key';

  const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Selección de elementos del DOM
  const photoInput = document.getElementById('photo-input');
  const photoPreview = document.getElementById('photo-preview');
  const takePhotoButton = document.getElementById('take-photo');
  const commentInput = document.getElementById('comment-input');
  const uploadButton = document.getElementById('upload-button');

  // Evento para abrir el selector de fotos
  takePhotoButton.addEventListener('click', () => {
    photoInput.click();
  });

  // Mostrar la foto seleccionada en el preview
  photoInput.addEventListener('change', (event) => {
    const file = event.target.files[0];

    if (file) {
      // Validar que el archivo sea una imagen
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecciona un archivo de imagen válido.');
        photoInput.value = '';
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        photoPreview.innerHTML = `<img src="${e.target.result}" alt="Vista previa de la foto">`;
      };

      reader.readAsDataURL(file);
    } else {
      photoPreview.innerHTML = '<p>No hay foto seleccionada</p>';
    }
  });

  // Subir la foto y el comentario a través de Supabase
  uploadButton.addEventListener('click', async () => {
    const file = photoInput.files[0];
    const comment = commentInput.value.trim();

    if (!file) {
      alert('Por favor, selecciona una foto antes de compartir.');
      return;
    }

    uploadButton.disabled = true;
    uploadButton.textContent = 'Compartiendo...';

    try {
      // Subir la imagen al bucket de Supabase
      const fileName = `${Date.now()}_${file.name}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('photos')
        .upload(fileName, file);

      if (storageError) {
        throw storageError;
      }

      // Obtener la URL pública de la imagen
      const { data: publicUrlData } = supabase.storage
        .from('photos')
        .getPublicUrl(storageData.path);

      const imageUrl = publicUrlData.publicUrl;

      // Insertar registro en la tabla 'uploads'
      const { data: insertData, error: insertError } = await supabase
        .from('uploads')
        .insert([
          { image_url: imageUrl, comment: comment },
        ]);

      if (insertError) {
        throw insertError;
      }

      alert('¡Foto compartida exitosamente! Pendiente de aprobación.');

      // Restablecer el formulario
      photoPreview.innerHTML = '<p>No hay foto seleccionada</p>';
      commentInput.value = '';
      photoInput.value = '';
    } catch (error) {
      console.error('Error al subir la foto:', error);
      alert('Hubo un problema al compartir la foto. Por favor, inténtalo de nuevo.');
    } finally {
      uploadButton.disabled = false;
      uploadButton.textContent = 'Compartir foto';
    }
  });
});
