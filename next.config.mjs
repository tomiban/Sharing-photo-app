/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['jnujnmneeokpkqpghcoj.supabase.co'], // replace with your Supabase project domain
  },
  transpilePackages: ['swiper', 'ssr-window', 'dom7'],
};
  
  export default nextConfig;