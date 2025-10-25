// app/layout.js
export const metadata = { title: 'CRM SuperObozy' };

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
