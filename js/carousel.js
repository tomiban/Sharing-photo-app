// carousel.js

// Reemplaza con tu URL y clave anónima de Supabase
const SUPABASE_URL = 'https://tusupabaseurl.supabase.co';
const SUPABASE_ANON_KEY = 'tu_anon_key';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elemento del DOM
const carouselPhotos = document.getElementById('carousel-photos');

async function fetchApprovedUploads() {
  const { data, error } = await supabase
    .from('uploads')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error al obtener las fotos aprobadas:', error);
    return;
  }

  // Limpiar el carrusel
  carouselPhotos.innerHTML = '';

  data.forEach(upload => {
    const slideDiv = document.createElement('div');
    slideDiv.classList.add('swiper-slide');

    slideDiv.innerHTML = `
      <img src="${upload.image_url}" alt="Foto aprobada">
      <p>${upload.comment || ''}</p>
    `;

    carouselPhotos.appendChild(slideDiv);
  });

  // Inicializar Swiper después de cargar las diapositivas
  initializeSwiper();
}

function initializeSwiper() {
  const swiper = new Swiper('.swiper-container', {
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    pagination: {
      el: '.swiper-pagination',
    },
  });
}

// Llamar a la función para cargar las fotos
fetchApprovedUploads();

// Opcional: Suscribirse a cambios en tiempo real
supabase
  .channel('public:uploads')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'uploads' }, payload => {
    if (payload.new.approved) {
      // Volver a cargar las fotos
      fetchApprovedUploads();
    }
  })
  .subscribe();
