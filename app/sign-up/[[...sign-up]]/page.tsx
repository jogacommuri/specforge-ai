import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-neutral-900 border border-neutral-800",
            headerTitle: "text-white",
            headerSubtitle: "text-neutral-400",
            socialButtonsBlockButton: "bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700",
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
            formFieldInput: "bg-neutral-800 border-neutral-700 text-white",
            formFieldLabel: "text-neutral-300",
            footerActionLink: "text-blue-400 hover:text-blue-300",
            identityPreviewText: "text-neutral-300",
            identityPreviewEditButton: "text-blue-400",
          },
        }}
      />
    </div>
  );
}
