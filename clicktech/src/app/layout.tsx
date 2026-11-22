import type { Metadata } from "next";
import { Orbitron, Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/domain/auth";
import { getPublicBusinessSettings } from "@/lib/domain/business-config";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ClickTechChatBot } from "@/components/chat/ClickTechChatBot";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "ClickTech | Tecnología a tu medida — Potosí, Bolivia",
  description:
    "Tienda de hardware, PCs armadas, configurador con compatibilidad verificable y servicio técnico con seguimiento en Potosí, Bolivia.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, settings] = await Promise.all([
    getCurrentUser().catch(() => null),
    getPublicBusinessSettings().catch(() => ({
      demoMode: true,
      whatsappNumber: "",
      publicPhone: "",
      publicEmail: "",
      physicalAddress: "",
      city: "Potosí, Bolivia",
      businessHours: "America/La_Paz",
      legalName: "ClickTech",
      nit: "",
      electronicInvoicingEnabled: false,
      demoPaymentSandboxEnabled: true,
      transferQrEnabled: true,
      payOnPickupEnabled: true,
      bankName: "Pendiente",
      accountNumber: "",
      accountHolder: "",
      qrConfigured: false,
      pendingKeys: [],
    })),
  ]);

  const initialUser = user
    ? { id: user.id, name: user.name, email: user.email, role: user.role }
    : null;

  return (
    <html
      lang="es"
      data-theme="dark"
      className={`${orbitron.variable} ${spaceGrotesk.variable} ${plusJakarta.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        <StoreProvider>
          <SiteHeader initialUser={initialUser} />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <SiteFooter settings={settings} />
          <ClickTechChatBot />
        </StoreProvider>
      </body>
    </html>
  );
}
