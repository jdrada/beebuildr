"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { OrganizationSwitcher } from "./organization-switcher";
import { useOrganization } from "@/contexts/organization-context";
import { OrganizationType } from "@/lib/auth-utils";
import { useSession } from "next-auth/react";

interface NavItem {
  title: string;
  href: string;
  showFor: OrganizationType[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    showFor: [OrganizationType.CONTRACTOR, OrganizationType.STORE],
  },
  {
    title: "Projects",
    href: "/projects",
    showFor: [OrganizationType.CONTRACTOR],
  },
  {
    title: "Unit Price Analyses",
    href: "/unit-price-analyses",
    showFor: [OrganizationType.CONTRACTOR],
  },
  {
    title: "Components Library",
    href: "/components-library",
    showFor: [OrganizationType.CONTRACTOR],
  },
  {
    title: "Budgets",
    href: "/budgets",
    showFor: [OrganizationType.CONTRACTOR],
  },
  {
    title: "Items",
    href: "/items",
    showFor: [OrganizationType.STORE],
  },
  {
    title: "Team",
    href: "/team",
    showFor: [OrganizationType.CONTRACTOR, OrganizationType.STORE],
  },
  {
    title: "Settings",
    href: "/settings",
    showFor: [OrganizationType.CONTRACTOR, OrganizationType.STORE],
  },
];

export function MainNav() {
  const pathname = usePathname();
  const { activeOrganization } = useOrganization();
  const { data: session } = useSession();

  // Filter nav items based on active organization type
  const filteredNavItems = navItems.filter(
    (item) =>
      activeOrganization && item.showFor.includes(activeOrganization.type)
  );

  return (
    <div className="flex items-center space-x-4 lg:space-x-6">
      <OrganizationSwitcher />

      {activeOrganization && (
        <nav className="flex items-center space-x-4 lg:space-x-6">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      )}

      {session?.user && (
        <div className="text-sm text-muted-foreground ml-2 hidden md:block">
          Logged in as{" "}
          <span className="font-medium">
            {session.user.name || session.user.email}
          </span>
        </div>
      )}
    </div>
  );
}
