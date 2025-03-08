"use client";

import React from "react";
import { useOrganization } from "@/contexts/organization-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Building, ChevronDown, Users } from "lucide-react";
import { OrganizationType } from "@/lib/auth-utils";

export function OrganizationSwitcher() {
  const { memberships, activeOrganization, isLoading, switchOrganization } =
    useOrganization();

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="w-[200px]">
        <span className="animate-pulse">Loading...</span>
      </Button>
    );
  }

  if (!activeOrganization || memberships.length === 0) {
    return (
      <Button variant="outline" disabled className="w-[200px]">
        No Organizations
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          <div className="flex items-center">
            {activeOrganization.type === OrganizationType.CONTRACTOR ? (
              <Building className="mr-2 h-4 w-4" />
            ) : (
              <Users className="mr-2 h-4 w-4" />
            )}
            <span className="truncate">{activeOrganization.name}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]">
        {memberships.map((membership) => (
          <DropdownMenuItem
            key={membership.organization.id}
            onClick={() => switchOrganization(membership.organization.id)}
            className="flex justify-between cursor-pointer"
          >
            <div className="flex items-center">
              {membership.organization.type === OrganizationType.CONTRACTOR ? (
                <Building className="mr-2 h-4 w-4" />
              ) : (
                <Users className="mr-2 h-4 w-4" />
              )}
              <span>{membership.organization.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {membership.role.toLowerCase()}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
