import { prisma } from "@/lib/prisma";

/**
 * Generate a username based on the user's name or email
 * If name is provided, use that; otherwise use the part of email before @
 */
export async function generateUsername(
  name?: string | null,
  email?: string | null
): Promise<string> {
  let baseUsername = "";

  // Try to use name first
  if (name) {
    // Convert to lowercase, replace spaces with dots, remove special chars
    baseUsername = name
      .toLowerCase()
      .replace(/\s+/g, ".")
      .replace(/[^a-z0-9.]/g, "");
  }
  // Fall back to email if no name
  else if (email) {
    // Use part before @ in email
    baseUsername = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "");
  }
  // Last resort: generate a random username
  else {
    baseUsername = `user${Math.floor(Math.random() * 10000)}`;
  }

  // Make sure username is not too long
  if (baseUsername.length > 20) {
    baseUsername = baseUsername.substring(0, 20);
  }

  // Check if username is available
  let username = baseUsername;
  let count = 0;

  // Keep trying with incremented number until we find an available username
  while (true) {
    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (!existing) {
      break; // Username is available
    }

    count++;
    username = `${baseUsername}${count}`;
  }

  return username;
}

/**
 * Check if a username is valid (right format, not taken)
 */
export async function isUsernameValid(
  username: string
): Promise<{ valid: boolean; message?: string }> {
  // Check format (3-20 chars, alphanumeric, dots, no spaces)
  if (!username.match(/^[a-z0-9.]{3,20}$/)) {
    return {
      valid: false,
      message:
        "Username must be 3-20 characters and can only contain lowercase letters, numbers, and dots.",
    };
  }

  // Check availability
  const existing = await prisma.user.findUnique({
    where: { username },
  });

  if (existing) {
    return { valid: false, message: "This username is already taken." };
  }

  return { valid: true };
}

/**
 * Ensure all users have usernames
 * This is meant to be run once to set usernames for existing users
 */
export async function ensureAllUsersHaveUsernames(): Promise<void> {
  // Get all users without usernames
  const users = await prisma.user.findMany({
    where: { username: null },
  });

  console.log(`Found ${users.length} users without usernames`);

  // Generate and set usernames for each user
  for (const user of users) {
    const username = await generateUsername(user.name, user.email);

    await prisma.user.update({
      where: { id: user.id },
      data: { username },
    });

    console.log(`Set username ${username} for user ${user.id}`);
  }
}
