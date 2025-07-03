// src/components/LogoutButton.tsx
'use client'; // This directive ensures that the component is a Client Component

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/signin');
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-blue-600 hover:text-blue-800 mx-4"
    >
      Logout
    </button>
  );
}