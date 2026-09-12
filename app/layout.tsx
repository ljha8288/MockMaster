import React from "react";

export const metadata = {
  title: "One Fight More - Mock Analysis Suite",
  description: "Personal AI Mock Test Analysis Platform",
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
      <body className="bg-[#090d16] text-white antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
