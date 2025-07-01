// src/components/LogoutButton.tsx
'use client'; // This directive ensures that the component is a Client Component

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/auth/signin' })}
      className="text-blue-600 hover:text-blue-800 mx-4"
    >
      Logout
    </button>
  );
}