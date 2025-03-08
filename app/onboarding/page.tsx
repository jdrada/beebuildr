"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OrganizationType } from "@/lib/auth-utils";
import { FREE_TIER_LIMITS } from "@/lib/limits";
import { useSession } from "next-auth/react";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState<OrganizationType | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [remainingOrgs, setRemainingOrgs] = useState<number | null>(null);
  const router = useRouter();
  const { data: session } = useSession();

  // Fetch remaining organization count
  useEffect(() => {
    const fetchLimits = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/organizations");
        if (response.ok) {
          const data = await response.json();
          console.log("API Response:", data);

          // Default to 1 for new users (ensure they can create their first org)
          if (data.limits.remaining === 0 && data.organizations.length === 0) {
            console.log("New user with no orgs, setting remaining to 1");
            setRemainingOrgs(1);
          } else {
            setRemainingOrgs(data.limits.remaining);
          }
        } else {
          console.error(
            "Failed to fetch organization limits:",
            await response.text()
          );
          // Default to 1 for errors
          setRemainingOrgs(1);
        }
      } catch (error) {
        console.error("Error fetching organization limits:", error);
        // Default to 1 for errors
        setRemainingOrgs(1);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchLimits();
    }
  }, [session]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgName || !orgType) {
      setError("Please provide both organization name and type.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("Creating organization:", { name: orgName, type: orgType });
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: orgName,
          type: orgType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("API Error Response:", data);
        throw new Error(
          data.message || data.error || "Failed to create organization"
        );
      }

      const data = await response.json();
      console.log("Organization created:", data);

      // Redirect to the dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating organization:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create organization"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Default to 1 for new users before we get the API response
  if (remainingOrgs === null && !isLoading) {
    setRemainingOrgs(1);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto py-4 px-6">
          <Link href="/" className="text-2xl font-bold">
            BeeBuildR
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-12 px-6 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="border rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-2 text-center">
              Let&apos;s Get Started
            </h2>

            {remainingOrgs !== null && (
              <p className="text-center text-sm text-muted-foreground mb-6">
                {remainingOrgs > 0
                  ? `You can create ${remainingOrgs} organization${
                      remainingOrgs > 1 ? "s" : ""
                    } with your free account.`
                  : "You've reached your limit of free organizations."}
              </p>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
                {error}
              </div>
            )}

            {isLoading && remainingOrgs === null ? (
              <div className="py-8 text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>Loading...</p>
              </div>
            ) : remainingOrgs === 0 ? (
              <div className="text-center">
                <p className="mb-4">
                  You&apos;ve reached the limit of{" "}
                  {FREE_TIER_LIMITS.MAX_ORGANIZATIONS} free organization.
                </p>
                <div className="p-4 border rounded-md bg-muted mb-4">
                  <h3 className="font-medium mb-2">
                    Upgrade to create more organizations
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    With our paid plans, you can create multiple organizations
                    to manage different projects or businesses.
                  </p>
                  <button
                    className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md"
                    onClick={() => router.push("/settings/billing")}
                  >
                    View Pricing
                  </button>
                </div>
                <Link
                  href="/dashboard"
                  className="text-primary hover:underline"
                >
                  Go to Dashboard
                </Link>
              </div>
            ) : step === 1 ? (
              <div>
                <p className="mb-6 text-center text-muted-foreground">
                  First, let&apos;s create your organization.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setStep(2);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="orgName"
                      className="block text-sm font-medium mb-1"
                    >
                      Organization Name
                    </label>
                    <input
                      id="orgName"
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Acme Construction"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md"
                    disabled={!orgName}
                  >
                    Continue
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <p className="mb-6 text-center text-muted-foreground">
                  What type of organization are you creating?
                </p>

                <form onSubmit={handleCreateOrg} className="space-y-4">
                  <div className="space-y-3">
                    <div
                      className="border rounded-md p-4 cursor-pointer hover:border-primary"
                      onClick={() => setOrgType(OrganizationType.CONTRACTOR)}
                    >
                      <div
                        className={`flex items-center gap-3 ${
                          orgType === OrganizationType.CONTRACTOR
                            ? "text-primary"
                            : ""
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border ${
                            orgType === OrganizationType.CONTRACTOR
                              ? "bg-primary border-primary"
                              : "border-muted-foreground"
                          }`}
                        />
                        <div>
                          <h3 className="font-medium">Contractor</h3>
                          <p className="text-sm text-muted-foreground">
                            I manage construction projects and need to create
                            budgets
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className="border rounded-md p-4 cursor-pointer hover:border-primary"
                      onClick={() => setOrgType(OrganizationType.STORE)}
                    >
                      <div
                        className={`flex items-center gap-3 ${
                          orgType === OrganizationType.STORE
                            ? "text-primary"
                            : ""
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border ${
                            orgType === OrganizationType.STORE
                              ? "bg-primary border-primary"
                              : "border-muted-foreground"
                          }`}
                        />
                        <div>
                          <h3 className="font-medium">Store</h3>
                          <p className="text-sm text-muted-foreground">
                            I sell construction materials and supplies
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 border px-4 py-2 rounded-md"
                    >
                      Back
                    </button>

                    <button
                      type="submit"
                      className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md disabled:opacity-50"
                      disabled={!orgType || isLoading}
                    >
                      {isLoading ? "Creating..." : "Create Organization"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
