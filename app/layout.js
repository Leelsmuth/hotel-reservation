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
  display: 'swap',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
  display: 'swap',
});
// Headings. Bundled locally (SIL Open Font License, see
// fonts/PlayfairDisplay-OFL.txt) so builds never depend on Google Fonts.
const display = localFont({
  src: './fonts/PlayfairDisplayVF.woff2',
  variable: '--font-display',
  weight: '400 900',
  display: 'swap',
});

export const metadata = {
  title: 'Beverly Hills Hotel',
  description:
    'Book a room at Beverly Hills Hotel in Toronto. Check live availability, see clear nightly prices and reserve for free.',
};

export const viewport = {
  themeColor: '#1C1915',
};

const RootLayout = ({ children }) => {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${display.variable} font-sans antialiased`}
      >
        <ToastProvider>
          <AuthProvider>
            <BookingProvider>{children}</BookingProvider>
          </AuthProvider>
          <Toast />
          <MockModeBadge />
        </ToastProvider>
      </body>
    </html>
  );
};

export default RootLayout;
