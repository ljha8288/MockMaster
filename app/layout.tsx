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
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
