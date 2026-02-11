import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { convexClient } from "@convex-dev/better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [convexClient(), adminClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  admin,
  getSession,
  updateUser,
} = authClient;
