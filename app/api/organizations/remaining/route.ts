import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getRemainingOrganizationCount } from "@/lib/limits";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Default to 1 for new users (they should be able to create their first org)
    let remaining = 1;

    try {
      remaining = await getRemainingOrganizationCount(session.user.id);
      console.log("Remaining orgs:", remaining, "for user:", session.user.id);
    } catch (error) {
      console.error("Error getting remaining orgs:", error);
    }

    return NextResponse.json({ remaining });
  } catch (error) {
    console.error("Error checking remaining organizations:", error);
    return NextResponse.json(
      { error: "Failed to check remaining organizations" },
      { status: 500 }
    );
  }
}
