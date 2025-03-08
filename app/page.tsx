import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto py-4 px-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">BeeBuildR</h1>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin" className="text-primary hover:underline">
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">
            Construction Budgeting Made Simple
          </h2>
          <p className="text-xl mb-8">
            Connect contractors and stores in one platform to streamline your
            construction budgeting process.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="border rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-2">For Contractors</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Create and manage project budgets</li>
                <li>Add items from various stores</li>
                <li>Track budget vs. actual costs</li>
                <li>Collaborate with team members</li>
              </ul>
            </div>

            <div className="border rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-2">For Stores</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Manage your product catalog</li>
                <li>Update prices in real-time</li>
                <li>Get visibility with contractors</li>
                <li>Track product usage in projects</li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/auth/signin"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-md inline-block text-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t">
        <div className="container mx-auto py-6 px-6">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} BeeBuildR. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
