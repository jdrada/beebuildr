"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { MemberRole, OrganizationType } from "@/lib/auth-utils";

interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
}

interface OrganizationMembership {
  id: string;
  role: MemberRole;
  organization: Organization;
}

interface OrganizationContextType {
  memberships: OrganizationMembership[];
  activeOrganization: Organization | null;
  activeRole: MemberRole | null;
  isLoading: boolean;
  switchOrganization: (organizationId: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider"
    );
  }
  return context;
}

interface OrganizationProviderProps {
  children: ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const { data: session, status } = useSession();
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [activeOrganization, setActiveOrganization] =
    useState<Organization | null>(null);
  const [activeRole, setActiveRole] = useState<MemberRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data from session
  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    // Set memberships from session
    if (session.memberships) {
      setMemberships(session.memberships as OrganizationMembership[]);
    }

    // Set active organization from session
    if (session.activeOrganizationId && session.memberships) {
      const active = session.memberships.find(
        (m) => m.organization.id === session.activeOrganizationId
      );

      if (active) {
        setActiveOrganization(active.organization as Organization);
        setActiveRole(active.role as MemberRole);
      }
    }

    setIsLoading(false);
  }, [session, status]);

  // Function to switch active organization
  const switchOrganization = async (organizationId: string) => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/organizations/switch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to switch organization");
      }

      const result = await response.json();

      if (result.success) {
        // Find the membership in our local state
        const membership = memberships.find(
          (m) => m.organization.id === organizationId
        );

        if (membership) {
          setActiveOrganization(membership.organization);
          setActiveRole(membership.role);
        }
      }
    } catch (error) {
      console.error("Error switching organization:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    memberships,
    activeOrganization,
    activeRole,
    isLoading,
    switchOrganization,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}
