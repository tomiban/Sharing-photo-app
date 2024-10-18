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
    const reader = new FileReader();
    reader.onload = (e) => {
      photoPreview.innerHTML = `<img src="${e.target.result}" alt="Party photo preview">`;
    };
    reader.readAsDataURL(file);
  }
});

// Subir la foto y el comentario a través de la API
uploadButton.addEventListener('click', () => {
  const file = photoInput.files[0];
  const comment = commentInput.value;

  if (!file) {
    alert('Please take a photo first!');
    return;
  }

  const formData = new FormData();
  formData.append('photo', file); // Agrega la foto al FormData
  formData.append('comment', comment); // Agrega el comentario

  // Realiza la solicitud POST usando Axios
  axios.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
    .then(response => {
      // Manejo de la respuesta exitosa
      alert('Photo uploaded successfully!');
      photoPreview.innerHTML = '<p>No photo selected</p>';
      commentInput.value = '';
    })
    .catch(error => {
      // Manejo de errores en la subida
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    });
});
