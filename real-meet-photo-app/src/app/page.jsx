import UploadPhoto from './components/UploadPhoto';

export default function Home() {
  
  return (
    <main className="min-h-screen text-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8 text-center"></h1>
      <UploadPhoto />
    </main>
  );
}