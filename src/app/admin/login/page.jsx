import LoginForm from '../../components/LoginForm';

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen text-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Admin</h1>
      <LoginForm />
    </main>
  );
}