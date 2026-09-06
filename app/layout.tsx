import React from "react";

export const metadata = {
  title: "MockMaster - Mock Test Analysis",
  description: "Advanced performance analytics & OCR scorecard tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-slate-900 text-white antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
