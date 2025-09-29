type VerifyLoginPageProps = {
  searchParams?: {
    email?: string;
  };
};

export default function VerifyLoginPage({ searchParams }: VerifyLoginPageProps) {
  const email = searchParams?.email;

  return (
    <div className="container flex justify-center">
      <main className="card mt-16 w-full max-w-lg space-y-4 p-10 text-center">
        <h1 className="text-3xl font-semibold text-[#0f172a]">Check your inbox</h1>
        <p className="text-sm text-neutral-600">
          We just sent a secure sign-in link{email ? ` to ${email}` : ""}. Click it to verify your email and
          unlock your dashboard.
        </p>
        <p className="text-sm text-neutral-500">
          Once verified, you can return here and sign in with your password or continue with Google or GitHub.
        </p>
      </main>
    </div>
  );
}
