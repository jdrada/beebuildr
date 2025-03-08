"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useOrganization } from "@/contexts/organization-context";
import { useProjectLimit } from "@/hooks/useProjects";

export default function DashboardPage() {
  const [remainingOrgs, setRemainingOrgs] = useState<number>(0);
  const { activeOrganization } = useOrganization();

  // Add the project limit hook
  const {
    data: projectLimit = {
      remaining: 0,
      limitReached: false,
      total: 0,
      limit: 0,
    },
    isLoading: isLoadingProjectLimit,
  } = useProjectLimit(activeOrganization?.id);

  // Get the remaining organization count for the user
  useEffect(() => {
    const fetchRemainingOrgs = async () => {
      try {
        const response = await fetch("/api/organizations/remaining");
        const data = await response.json();
        setRemainingOrgs(data.remaining);
      } catch (error) {
        console.error("Error fetching remaining organizations:", error);
        setRemainingOrgs(0);
      }
    };

    fetchRemainingOrgs();
  }, []);

  return (
    <DashboardLayout>
      {remainingOrgs === 0 && (
        <div className="mb-6 p-4 bg-muted border rounded-lg flex items-center justify-between">
          <div>
            <h3 className="font-medium">Organization Limit Reached</h3>
            <p className="text-sm text-muted-foreground">
              You&apos;ve reached your limit of free organizations. Upgrade to
              create more organizations.
            </p>
          </div>
          <Link
            href="/settings/billing"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm flex items-center gap-1"
          >
            View Plans
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Welcome to BeeBuildR</h2>
          <p className="text-muted-foreground">
            Your construction budgeting platform for contractors and stores.
          </p>
        </div>

        <div className="border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Quick Actions</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/budgets" className="text-blue-600 hover:underline">
                Manage Budgets
              </Link>
            </li>
            <li>
              <Link href="/items" className="text-blue-600 hover:underline">
                Manage Items
              </Link>
            </li>
            <li>
              <Link href="/team" className="text-blue-600 hover:underline">
                Invite Team Members
              </Link>
            </li>
          </ul>
        </div>

        <div className="border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Organizations</h2>
          <p className="text-muted-foreground mb-4">
            {remainingOrgs > 0
              ? `You can create ${remainingOrgs} more organization${
                  remainingOrgs > 1 ? "s" : ""
                }.`
              : "You have reached your organization limit."}
          </p>
          <Link
            href={remainingOrgs > 0 ? "/onboarding" : "/settings/billing"}
            className="text-blue-600 hover:underline"
          >
            {remainingOrgs > 0 ? "Create an Organization" : "Upgrade Your Plan"}
          </Link>
        </div>

        <div className="border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Projects</h2>
          <p className="text-muted-foreground mb-4">
            {activeOrganization ? (
              <>
                {projectLimit.limitReached
                  ? `You have reached your project limit (${projectLimit.total}/${projectLimit.limit}).`
                  : `You can create ${projectLimit.remaining} more project${
                      projectLimit.remaining !== 1 ? "s" : ""
                    } (${projectLimit.total}/${projectLimit.limit}).`}
              </>
            ) : (
              "Select an organization to see your project limits."
            )}
          </p>
          <Link
            href={
              projectLimit.limitReached ? "/settings/billing" : "/projects/new"
            }
            className="text-blue-600 hover:underline"
          >
            {projectLimit.limitReached
              ? "Upgrade Your Plan"
              : "Create a Project"}
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
