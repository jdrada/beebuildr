"use client";

import React from "react";
import { useOrganization } from "@/contexts/organization-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building, ChevronsUpDown, Plus, Store } from "lucide-react";
import { OrganizationType } from "@/lib/auth-utils";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// Helper function to get the icon based on organization type
const getOrganizationIcon = (type: OrganizationType) => {
  switch (type) {
    case OrganizationType.CONTRACTOR:
      return Building;
    case OrganizationType.STORE:
      return Store;
    default:
      return Building;
  }
};

// Helper function to get a plan label (you can modify this based on your actual data model)
const getPlanLabel = (type: OrganizationType) => {
  switch (type) {
    case OrganizationType.CONTRACTOR:
      return "Contractor";
    case OrganizationType.STORE:
      return "Store";
    default:
      return "Free Plan";
  }
};

export function OrganizationSwitcher() {
  const { memberships, activeOrganization, isLoading, switchOrganization } =
    useOrganization();
  const { isMobile } = useSidebar();

  if (isLoading || !activeOrganization || memberships.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Building className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {isLoading ? "Loading..." : "No Organizations"}
              </span>
              <span className="truncate text-xs">-</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Get the icon component for the active organization
  const ActiveOrgIcon = getOrganizationIcon(activeOrganization.type);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <ActiveOrgIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeOrganization.name}
                </span>
                <span className="truncate text-xs">
                  {getPlanLabel(activeOrganization.type)}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizations
            </DropdownMenuLabel>
            {memberships.map((membership, index) => {
              const OrgIcon = getOrganizationIcon(membership.organization.type);
              return (
                <DropdownMenuItem
                  key={membership.organization.id}
                  onClick={() => switchOrganization(membership.organization.id)}
                  className="gap-2 p-2 cursor-pointer"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <OrgIcon className="size-4 shrink-0" />
                  </div>
                  <span>{membership.organization.name}</span>
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2 cursor-pointer"
              onClick={() =>
                (window.location.href = "/settings/organizations/new")
              }
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Add organization
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
