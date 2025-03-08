"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useSession } from "next-auth/react";
import { UserSearch, UserSearchResult } from "@/components/user-search";
import { useOrganization } from "@/contexts/organization-context";
import { MemberRole } from "@/lib/auth-utils";
import {
  Trash2,
  ShieldCheck,
  Eye,
  Settings,
  User,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import {
  useOrganizationMembers,
  useInviteUser,
  useRemoveMember,
  useUpdateMemberRole,
  Member,
} from "@/hooks/useTeam";

export default function TeamPage() {
  const { data: session } = useSession();
  const { activeOrganization, activeRole } = useOrganization();
  const [selectedRole, setSelectedRole] = useState<MemberRole>(
    MemberRole.MEMBER
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Use React Query hooks
  const {
    data: members = [],
    isLoading,
    isError,
    error: membersError,
  } = useOrganizationMembers(activeOrganization?.id);

  const inviteUser = useInviteUser();
  const removeMember = useRemoveMember();
  const updateMemberRole = useUpdateMemberRole();

  const isAdmin = activeRole === MemberRole.ADMIN;

  const handleInviteUser = async (user: UserSearchResult) => {
    if (!activeOrganization?.id || !isAdmin) return;

    setError("");
    setSuccess("");

    try {
      await inviteUser.mutateAsync({
        organizationId: activeOrganization.id,
        userId: user.id,
        role: selectedRole,
      });

      setSuccess(
        `${
          user.displayName
        } has been invited as a ${selectedRole.toLowerCase()}`
      );
    } catch (error) {
      console.error("Error inviting user:", error);
      setError(
        error instanceof Error ? error.message : "Failed to invite user"
      );
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeOrganization?.id || !isAdmin) return;

    // Don't allow removing yourself
    const memberToRemove = members.find((m) => m.id === memberId);
    if (memberToRemove?.user.id === session?.user?.id) {
      setError("You cannot remove yourself from the organization");
      return;
    }

    setError("");
    setSuccess("");

    try {
      await removeMember.mutateAsync({
        organizationId: activeOrganization.id,
        memberId,
      });

      setSuccess("Member has been removed from the organization");
    } catch (error) {
      console.error("Error removing member:", error);
      setError(
        error instanceof Error ? error.message : "Failed to remove member"
      );
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: MemberRole) => {
    if (!activeOrganization?.id || !isAdmin) return;

    // Don't allow changing your own role
    const memberToUpdate = members.find((m) => m.id === memberId);
    if (memberToUpdate?.user.id === session?.user?.id) {
      setError("You cannot change your own role");
      return;
    }

    setError("");
    setSuccess("");

    try {
      await updateMemberRole.mutateAsync({
        organizationId: activeOrganization.id,
        memberId,
        role: newRole,
      });

      // Update the local state for role dropdown
      const updatedMembers = members.map((m: Member) => ({
        ...m,
        showRoleDropdown: false,
        ...(m.id === memberId ? { role: newRole } : {}),
      }));

      setSuccess("Member role has been updated");
    } catch (error) {
      console.error("Error updating member role:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update member role"
      );
    }
  };

  const getRoleIcon = (role: MemberRole) => {
    switch (role) {
      case MemberRole.ADMIN:
        return <ShieldCheck className="w-4 h-4" />;
      case MemberRole.MEMBER:
        return <User className="w-4 h-4" />;
      case MemberRole.VIEWER:
        return <Eye className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Toggle role dropdown for a member
  const toggleRoleDropdown = (memberId: string) => {
    const memberToToggle = members.find((m) => m.id === memberId);
    if (memberToToggle) {
      const element = document.getElementById(`role-dropdown-${memberId}`);
      if (element) {
        element.classList.toggle("hidden");
      }
    }
  };

  if (!activeOrganization) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">
          <p>Please select an organization to manage team members.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage members and permissions for {activeOrganization.name}
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-600 rounded-md">
            {success}
          </div>
        )}

        {isAdmin && (
          <div className="border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Invite Team Members</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Find User
                </label>
                <UserSearch
                  onSelect={handleInviteUser}
                  excludeUserIds={members.map((m: Member) => m.user.id)}
                  placeholder="Search by username, email, or name..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <div className="flex space-x-4">
                  {Object.values(MemberRole).map((role) => (
                    <label key={role} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={selectedRole === role}
                        onChange={() => setSelectedRole(role as MemberRole)}
                        className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="flex items-center gap-1">
                        {getRoleIcon(role as MemberRole)}
                        <span>{role}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="border rounded-lg shadow-sm overflow-hidden">
          <div className="bg-muted p-4">
            <h2 className="text-lg font-semibold">Current Team Members</h2>
          </div>

          {isLoading ? (
            <div className="p-6 text-center">Loading members...</div>
          ) : isError ? (
            <div className="p-6 text-center text-red-600">
              {membersError instanceof Error
                ? membersError.message
                : "Failed to load team members"}
            </div>
          ) : members.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No team members found
            </div>
          ) : (
            <ul className="divide-y">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {member.user.image ? (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden">
                        <Image
                          src={member.user.image}
                          alt={member.user.name || "User"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                    )}

                    <div>
                      <div className="font-medium">
                        {member.user.name || "No Name"}
                      </div>
                      <div className="text-sm text-muted-foreground flex gap-2">
                        <span>{member.user.email}</span>
                        {member.user.username && (
                          <span className="text-muted-foreground">
                            @{member.user.username}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm">
                      {getRoleIcon(member.role)}
                      <span>{member.role}</span>
                    </div>

                    {isAdmin && member.user.id !== session?.user?.id && (
                      <div className="flex gap-2">
                        <div className="relative group">
                          <button
                            type="button"
                            className="p-1.5 rounded-md hover:bg-muted flex items-center gap-1"
                            onClick={() => toggleRoleDropdown(member.id)}
                            aria-label="Change role"
                            title="Change role"
                          >
                            <Settings className="w-4 h-4" />
                            <ChevronDown className="w-3 h-3" />
                          </button>

                          {member.showRoleDropdown && (
                            <div className="absolute right-0 mt-1 w-36 bg-background border rounded-md shadow-lg z-10">
                              <ul className="py-1">
                                {Object.values(MemberRole).map((role) => (
                                  <li key={role}>
                                    <button
                                      type="button"
                                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                                        member.role === role
                                          ? "bg-muted"
                                          : "hover:bg-muted"
                                      }`}
                                      onClick={() => {
                                        handleUpdateRole(
                                          member.id,
                                          role as MemberRole
                                        );
                                      }}
                                    >
                                      {getRoleIcon(role as MemberRole)}
                                      <span>{role}</span>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          className="p-1.5 rounded-md hover:bg-muted text-red-500"
                          onClick={() => handleRemoveMember(member.id)}
                          aria-label="Remove member"
                          title="Remove member"
                          disabled={removeMember.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
