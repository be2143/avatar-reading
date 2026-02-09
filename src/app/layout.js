"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";


export default function RootLayout({ children }) {
  return (
    <DndProvider backend={HTML5Backend}>
      <html lang="en">
        <body>{children}</body>
      </html>
    </DndProvider>
  );
}

// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <body
//         className={`${geistSans.variable} ${geistMono.variable} antialiased`}
//       >
//         {children}
//       </body>
//     </html>
//   );
// }
