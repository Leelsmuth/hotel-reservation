import localFont from 'next/font/local';
import './globals.css';
import { AuthProvider } from '@/context/AuthProvider';
import { BookingProvider } from '@/context/BookingContext';

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
        <AuthProvider>
          <BookingProvider>
            <div className="font-[family-name:var(--font-geist-sans)] font-medium">
              {children}
            </div>
          </BookingProvider>
        </AuthProvider>
      </body>
    </html>
  );
};

export default RootLayout;
