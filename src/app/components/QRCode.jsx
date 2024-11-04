import { QRCodeSVG } from 'qrcode.react';

const QRCode = ({ url }) => (
  <div className="p-4 rounded-2xl">
    <h3 
      className="text-white text-2xl font-bold mb-3 text-center animate-pulse"
      style={{
        textShadow: `
          0 0 10px rgba(255,255,255,0.4),
          0 0 20px rgba(255,255,255,0.2)
        `,
        background: 'linear-gradient(to right, #fff, #e0e0e0, #fff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundSize: '200% auto',
        animation: 'shine 3s linear infinite'
      }}
    >
      ¡Dejanos tu Selfi!
    </h3>
    <div 
      style={{
        filter: `
          drop-shadow(0 0 10px rgba(255,255,255,0.3))
          drop-shadow(0 0 20px rgba(255,255,255,0.2))
        `,
        transition: 'all 0.3s ease'
      }}
      className="hover:brightness-110 hover:scale-105"
    >
      <QRCodeSVG
        value={url}
        size={200}
        bgColor="white"
        fgColor="#000000"
        level="L"
        className="rounded-lg"
      />
    </div>
    <style jsx>{`
      @keyframes shine {
        to {
          backgroundPosition: 200% center;
        }
      }
    `}</style>
  </div>
);

export default QRCode;