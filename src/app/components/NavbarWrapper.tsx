// app/components/NavbarWrapper.tsx
'use client';

import { usePathname } from 'next/navigation';
import Navbar from './navbar';

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSignInPage = pathname === '/signin';

  return (
    <>
      {!isSignInPage && <Navbar />}
      <main className={!isSignInPage ? 'pt-16' : ''}>
        {children}
      </main>
    </>
  );
}