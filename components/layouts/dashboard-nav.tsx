import {
  FolderOpen,
  Calculator,
  Package,
  Settings,
  Database,
} from "lucide-react";
import { MemberRole, OrganizationType } from "@prisma/client";

const navItems = [
  {
    title: "Projects",
    href: "/projects",
    icon: <FolderOpen className="w-4 h-4" />,
    roles: [MemberRole.ADMIN, MemberRole.MEMBER, MemberRole.VIEWER],
    orgTypes: [OrganizationType.CONTRACTOR],
  },
  {
    title: "Unit Price Analyses",
    href: "/unit-price-analyses",
    icon: <Calculator className="w-4 h-4" />,
    roles: [MemberRole.ADMIN, MemberRole.MEMBER, MemberRole.VIEWER],
    orgTypes: [OrganizationType.CONTRACTOR],
  },
  {
    title: "Components Library",
    href: "/components-library",
    icon: <Database className="w-4 h-4" />,
    roles: [MemberRole.ADMIN, MemberRole.MEMBER, MemberRole.VIEWER],
    orgTypes: [OrganizationType.CONTRACTOR],
  },
  {
    title: "Items",
    href: "/items",
    icon: <Package className="w-4 h-4" />,
    roles: [MemberRole.ADMIN, MemberRole.MEMBER, MemberRole.VIEWER],
    orgTypes: [OrganizationType.STORE],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="w-4 h-4" />,
    roles: [MemberRole.ADMIN, MemberRole.MEMBER, MemberRole.VIEWER],
    orgTypes: [OrganizationType.CONTRACTOR, OrganizationType.STORE],
  },
];

export { navItems };
