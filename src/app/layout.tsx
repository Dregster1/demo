// app/layout.tsx
import './globals.css';
import AuthGuard from './components/AuthGuard';
import NavbarWrapper from './components/NavbarWrapper';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-900 text-white">
        <AuthGuard>
          <NavbarWrapper>
            {children}
          </NavbarWrapper>
        </AuthGuard>
      </body>
    </html>
  );
}