import "next-auth";
import { MemberRole, OrganizationType } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string | null;
    };
    memberships: {
      id: string;
      role: MemberRole;
      organization: {
        id: string;
        name: string;
        type: OrganizationType;
      };
    }[];
    activeOrganizationId?: string;
  }
}
