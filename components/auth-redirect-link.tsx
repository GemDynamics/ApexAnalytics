"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, useAuth } from "@clerk/nextjs";

interface AuthRedirectLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  signUpUrl?: string;
}

/**
 * AuthRedirectLink leitet nicht angemeldete Benutzer zum Login weiter,
 * während angemeldete Benutzer normal zum angegebenen Link navigieren können.
 */
export function AuthRedirectLink({ 
  href, 
  children, 
  className, 
  signUpUrl = "https://nearby-chow-71.accounts.dev/sign-up?redirect_url=http%3A%2F%2Flocalhost%3A3000%2F" 
}: AuthRedirectLinkProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const handleClick = (e: React.MouseEvent) => {
    if (!isSignedIn) {
      e.preventDefault();
      // Weiterleitung zur Anmelde-URL
      window.location.href = signUpUrl;
    }
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}

/**
 * Vereinfachte Version speziell für "Neue Analyse" Buttons
 */
export function NewAnalysisLink({ children, className }: Omit<AuthRedirectLinkProps, 'href' | 'signUpUrl'>) {
  return (
    <AuthRedirectLink 
      href="/neue-analyse" 
      className={className}
      signUpUrl="https://nearby-chow-71.accounts.dev/sign-up?redirect_url=http%3A%2F%2Flocalhost%3A3000%2F"
    >
      {children}
    </AuthRedirectLink>
  );
} 