"use client";

import Link from "next/link";
import { UserButton, useUser, SignedIn } from "@clerk/nextjs";

export default function NavBar() {
    const { user } = useUser();

    return (
        <SignedIn>
            <nav className="flex items-center justify-between p-4 md:px-6 lg:px-10 border-b border-neutral-800 bg-neutral-950 text-white">
                <Link href="/projects" className="text-xl font-bold hover:text-neutral-300 transition-colors">
                    SpecForge AI
                </Link>

                <div className="flex items-center gap-3">
                    {user && (
                        <span className="text-sm text-neutral-400 hidden sm:inline">
                            {user.emailAddresses[0]?.emailAddress || user.firstName || "User"}
                        </span>
                    )}
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: "w-8 h-8",
                            },
                        }}
                    />
                </div>
            </nav>
        </SignedIn>
    );
}
