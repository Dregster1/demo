'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from "next/image";
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Obtener la sesión del usuario
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_OUT') {
        router.refresh(); // Forzar actualización al cerrar sesión
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Función mejorada para cerrar sesión
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Redirección forzada con recarga
      window.location.href = '/signin';
      
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('No se pudo cerrar sesión. Intente nuevamente.');
    }
  };

  // Función para cerrar el menú
  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className=" bg-[#3e5c3d] fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600">
      <div className="max-w-screen-x2 flex flex-wrap items-center justify-between mx-auto p-4">
        <Link
          href="/"
          className="flex items-center space-x-3 rtl:space-x-reverse"
          onClick={closeMenu}
        >
          <Image
            src="/images/logo.jpg"
            width={128}
            height={128}
            alt="Logo de la empresa"
            className='justify-between'
            priority // Opcional: para imágenes críticas
          />
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
            ASD
          </span>
        </Link>

        <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
          {/* Mostrar información del usuario si está logueado */}
          {user && (
            <div className="hidden md:flex items-center gap-4">
              <span className="text-gray-900 dark:text-white">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-gray-900 dark:text-white hover:text-black dark:hover:text-black"
              >
                Cerrar sesión
              </button>
            </div>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600"
            aria-controls="navbar-sticky"
            aria-expanded={isOpen}
          >
            <span className="sr-only">Abrir menú</span>
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 17 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M1 1h15M1 7h15M1 13h15"
              />
            </svg>
          </button>
        </div>

        <div
          className={`${isOpen ? 'flex' : 'hidden'} items-center justify-between w-full md:flex md:w-auto md:order-1`}
          id="navbar-sticky"
        >
          <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 md:mt-0 md:border-0 md:bg-[#3e5c3d] dark:bg-[#3e5c3d] md:dark:bg-[#3e5c3d] dark:border-gray-700">
            {[
              { href: "/", text: "Inicio" },
              { href: "/prestamos", text: "Préstamos" },
              { href: "/prestamos/nuevo", text: "Nuevo Prestamo" },
              { href: "/clientes", text: "Clientes" },
              { href: "/clientes/nuevo", text: "Añadir cliente" },
              { href: "/balance", text: "Balance" },
              { href: "/balance/nuevo", text: "Añadir bienes" },
              { href: "/registro", text: "Registro"}
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={closeMenu}
                  className={`block py-2 px-3 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-black md:p-0 dark:text-white dark:hover:bg-gray-700 md:dark:hover:bg-transparent ${pathname === link.href
                    ? 'text-white bg-black md:bg-transparent md:text-blue-700 dark:text-white'
                    : 'text-gray-900 dark:text-white'
                    }`}
                >
                  {link.text}
                </Link>
              </li>
            ))}


            {/* Versión móvil del sign out */}
            {user && (
              <li className="md:hidden">
                <div className="flex flex-col p-2">
                  <span className="text-gray-900 dark:text-white px-3 py-2">
                    {user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-left text-gray-900 dark:text-white hover:text-black dark:hover:text-black px-3 py-2"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}