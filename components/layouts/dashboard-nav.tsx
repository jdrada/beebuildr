import { FolderOpen } from "lucide-react";

const navItems = [
  {
    title: "Projects",
    href: "/projects",
    icon: <FolderOpen className="w-4 h-4" />,
    roles: [MemberRole.ADMIN, MemberRole.MEMBER, MemberRole.VIEWER],
    orgTypes: [OrganizationType.CONTRACTOR],
  },
];
