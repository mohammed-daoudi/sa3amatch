import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Join Sa3aMatch
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create an account to start booking football fields
          </p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
