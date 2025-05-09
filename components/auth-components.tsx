"use client";

import { UserButton, SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";

export function AuthButtons() {
  return (
    <>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
      <SignedOut>
        <SignInButton />
        <SignUpButton />
      </SignedOut>
    </>
  );
} 