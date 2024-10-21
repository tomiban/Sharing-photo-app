// admin.js

// Reemplaza con tu URL y clave anónima de Supabase
const SUPABASE_URL = '';
const SUPABASE_ANON_KEY = '';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos del DOM
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('login-button');
const adminPanel = document.getElementById('admin-panel');
const logoutButton = document.getElementById('logout-button');
const pendingUploadsDiv = document.getElementById('pending-uploads');

loginButton.addEventListener('click', async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  const { error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    alert('Error al iniciar sesión: ' + error.message);
  } else {
    loginForm.style.display = 'none';
    adminPanel.style.display = 'block';
    fetchPendingUploads();
  }
});

logoutButton.addEventListener('click', async () => {
  await supabase.auth.signOut();
  loginForm.style.display = 'block';
  adminPanel.style.display = 'none';
});

async function fetchPendingUploads() {
  const { data, error } = await supabase
    .from('uploads')
    .select('*')
    .eq('approved', false)
    .order('created_at', { ascending: true });

  if (error) {
    alert('Error al obtener las fotos pendientes: ' + error.message);
    return;
  }

  pendingUploadsDiv.innerHTML = '';

  data.forEach(upload => {
    const uploadDiv = document.createElement('div');
    uploadDiv.classList.add('upload-item');

    uploadDiv.innerHTML = `
      <img src="${upload.image_url}" alt="Foto pendiente">
      <p>${upload.comment || 'Sin comentario'}</p>
      <div>
        <button class="approve-button" data-id="${upload.id}">Aprobar</button>
        <button class="delete-button" data-id="${upload.id}">Eliminar</button>
      </div>
    `;

    pendingUploadsDiv.appendChild(uploadDiv);
  });

  // Añadir eventos a los botones
  document.querySelectorAll('.approve-button').forEach(button => {
    button.addEventListener('click', () => approveUpload(button.dataset.id));
  });

  document.querySelectorAll('.delete-button').forEach(button => {
    button.addEventListener('click', () => deleteUpload(button.dataset.id));
  });
}

async function approveUpload(id) {
  const { error } = await supabase
    .from('uploads')
    .update({ approved: true })
    .eq('id', id);

  if (error) {
    alert('Error al aprobar la foto: ' + error.message);
  } else {
    alert('Foto aprobada.');
    fetchPendingUploads();
  }
}

async function deleteUpload(id) {
  // Primero, obtenemos el registro para obtener el path de la imagen
  const { data, error: fetchError } = await supabase
    .from('uploads')
    .select('image_url')
    .eq('id', id)
    .single();

  if (fetchError) {
    alert('Error al obtener el registro: ' + fetchError.message);
    return;
  }

  // Extraer el path de la URL de la imagen
  const imageUrl = data.image_url;
  const imagePath = imageUrl.split('/storage/v1/object/public/photos/')[1];

  // Eliminar el registro de la base de datos
  const { error: deleteError } = await supabase
    .from('uploads')
    .delete()
    .eq('id', id);

  if (deleteError) {
    alert('Error al eliminar el registro: ' + deleteError.message);
    return;
  }

  // Eliminar la imagen del almacenamiento
  const { error: storageError } = await supabase.storage
    .from('photos')
    .remove([imagePath]);

  if (storageError) {
    alert('Error al eliminar la imagen: ' + storageError.message);
  } else {
    alert('Foto eliminada.');
    fetchPendingUploads();
  }
}
