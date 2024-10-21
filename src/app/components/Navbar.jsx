// src/components/Navbar.jsx

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Navbar = () => {
  return (
    <nav className="bg-primary-dark text-white py-4">
      <div className="container mx-auto flex justify-between items-center px-4">
        <Link href="/">
        <Image
            src="/logo.png" // Ruta relativa a la carpeta public
            alt="Logo"
            width={60} // Ajusta el ancho del logo
            height={50}  // Ajusta el alto del logo
          />
        </Link>
        <div className="space-x-4">
          <Link href="/">
          Inicio
          </Link>
          <Link href="/carousel/">
            Carousel
          </Link>
          <Link href="/admin/">
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
