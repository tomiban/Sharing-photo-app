import Image from "next/image";
import UploadPhoto from "@/app/components/UploadPhoto"
export default function Home() {
  return (
    <main className="min-h-screen w-full relative">
      {/* Background image */}
      <div className="fixed inset-0">
        <Image 
          src="/background.jpg"
          alt="Background"
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
          quality={85}
        />
        {/* Purple gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 to-purple-800/30 backdrop-blur-[2px]" />
      </div>
      
      {/* Content */}
      <div className="relative">
        <UploadPhoto />
      </div>
    </main>
  );
}