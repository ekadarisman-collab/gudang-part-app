import "./globals.css";

export const metadata = {
  title: "Gudang Part | Forklift & Kendaraan",
  description: "Aplikasi pengelolaan spare part & ban forklift dan mobil operasional",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
