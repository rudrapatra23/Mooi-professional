import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script"; // <-- add this

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: '--font-outfit',
});

export const metadata = {
  title: "Mooi Professional",
  description: "Mooi Professional",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#000000',
          colorText: '#000000',
          colorBackground: '#ffffff',
          colorInputBackground: '#ffffff',
          colorInputText: '#000000',
          borderRadius: '0px',
          fontFamily: 'var(--font-outfit)',
        },
        elements: {
          card: 'rounded-none border border-black shadow-none',
          formButtonPrimary: 'bg-black text-white hover:bg-neutral-800 rounded-none uppercase text-xs font-bold tracking-[0.2em] py-4',
          formFieldInput: 'rounded-none border border-gray-300 focus:border-black bg-transparent px-4 py-3 placeholder:uppercase placeholder:text-xs placeholder:tracking-wider',
          formFieldLabel: 'uppercase text-xs font-bold tracking-widest text-gray-500 mb-2',
          headerTitle: 'font-serif text-2xl font-bold uppercase tracking-widest text-black',
          headerSubtitle: 'text-xs uppercase tracking-widest text-gray-500',
          footerActionLink: 'text-black font-bold underline decoration-1 underline-offset-4 hover:decoration-2',
          socialButtonsIconButton: 'rounded-none border border-gray-300 hover:border-black hover:bg-gray-50 transition-all',
          socialButtonsBlockButton: 'rounded-none border border-black hover:bg-gray-50 text-xs font-bold uppercase tracking-widest',
          dividerLine: 'bg-gray-200',
          dividerText: 'text-xs uppercase tracking-widest text-gray-400',
        }
      }}
    >
      <html lang="en">
        <head>
          {/* Razorpay checkout script */}
          <Script
            src="https://checkout.razorpay.com/v1/checkout.js"
            strategy="beforeInteractive"
          />
        </head>
        <body className={`${outfit.variable} antialiased`}>
          <StoreProvider>
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: '#000',
                  color: '#fff',
                  borderRadius: '0',
                  padding: '16px 24px',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  border: '1px solid #000',
                },
                success: {
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#000',
                  },
                },
                error: {
                  style: {
                    background: '#fff',
                    color: '#000',
                    border: '1px solid #000',
                  },
                  iconTheme: {
                    primary: '#000',
                    secondary: '#fff',
                  },
                },
              }}
            />
            {children}
          </StoreProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
