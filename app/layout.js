import localFont from 'next/font/local';
import './globals.css';
import { AuthProvider } from '@/context/AuthProvider';
import { BookingProvider } from '@/context/BookingContext';
import { ToastProvider } from '@/context/ToastContext';
import Toast from '@/components/toast/Toast';
import MockModeBadge from '@/components/dev/MockModeBadge';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata = {
  title: 'Beverly Hills Hotel',
  description: 'Welcome to Beverly Hills Hotel',
};

const RootLayout = ({ children }) => {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          <AuthProvider>
            <BookingProvider>
              <div className="font-[family-name:var(--font-geist-sans)] font-medium">
                {children}
              </div>
            </BookingProvider>
          </AuthProvider>
          <Toast />
          <MockModeBadge />
        </ToastProvider>
      </body>
    </html>
  );
};

export default RootLayout;
