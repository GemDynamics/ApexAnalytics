"use client"

import React from "react"

export default function AnalytikLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Dieses Layout übergibt einfach seine Kinder
  // Die eigentliche Layout-Logik ist in der AnalyticsLayout-Komponente
  return children;
}
