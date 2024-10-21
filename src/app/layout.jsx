// app/layout.jsx

import './globals.css'
import Navbar from './components/Navbar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="antialiased font-metropolis">
        <main>{children}</main>
        <ToastContainer />
      </body>
    </html>
  );
}
