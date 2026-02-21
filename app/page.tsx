import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold mb-2">SpecForge AI</h1>
        <p className="text-neutral-400 text-lg">
          Forging product intent into production-ready architecture
        </p>
        <div className="mt-8">
          <SignedIn>
            <Link
              href="/projects"
              className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Go to Projects
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-medium transition-colors">
                Sign In to Get Started
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </main>
  );
}