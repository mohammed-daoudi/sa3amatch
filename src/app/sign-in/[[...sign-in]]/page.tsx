import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome back to Sa3aMatch
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to book your next football field
          </p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
