"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  SquareStack,
  Library,
  FileText,
  ShoppingCart,
  Users,
  Settings,
  ChevronRight,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { NavUser } from "@/components/nav-user";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { useOrganization } from "@/contexts/organization-context";
import { OrganizationType } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";

// Map organization types to nav items
const getNavItems = (orgType: OrganizationType | undefined) => {
  const baseItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      url: "/dashboard",
      isActive: true,
    },
    {
      title: "Team",
      icon: Users,
      url: "/team",
    },
    {
      title: "Settings",
      icon: Settings,
      url: "/settings",
      items: [
        {
          title: "General",
          url: "/settings",
        },
        {
          title: "Profile",
          url: "/settings/profile",
        },
        {
          title: "Notifications",
          url: "/settings/notifications",
        },
      ],
    },
  ];

  if (orgType === OrganizationType.CONTRACTOR) {
    return [
      ...baseItems.slice(0, 1),
      {
        title: "Projects",
        icon: SquareStack,
        url: "/projects",
      },
      {
        title: "Unit Price Analyses",
        icon: FileText,
        url: "/unit-price-analyses",
      },
      {
        title: "Components Library",
        icon: Library,
        url: "/components-library",
      },
      {
        title: "Budgets",
        icon: Package,
        url: "/budgets",
      },
      ...baseItems.slice(1),
    ];
  }

  if (orgType === OrganizationType.STORE) {
    return [
      ...baseItems.slice(0, 1),
      {
        title: "Items",
        icon: ShoppingCart,
        url: "/items",
      },
      ...baseItems.slice(1),
    ];
  }

  return baseItems;
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { activeOrganization } = useOrganization();
  const navItems = getNavItems(activeOrganization?.type);
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrganizationSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={
                  item.isActive ||
                  (item.items &&
                    item.items.some((subItem) => pathname === subItem.url))
                }
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  {item.items ? (
                    <>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <Link
                                  href={subItem.url}
                                  className={cn(
                                    "w-full",
                                    pathname === subItem.url
                                      ? "font-medium"
                                      : ""
                                  )}
                                >
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={cn(
                        pathname === item.url
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : ""
                      )}
                    >
                      <Link href={item.url}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
