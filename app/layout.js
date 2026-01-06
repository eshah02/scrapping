export const metadata = {
  title: "Resend Assistant",
  description: "AI assistant for Resend documentation",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
