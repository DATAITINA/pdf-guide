import {
  emailAndPasswordEnabled,
  PUBLISHER_EMAIL,
  PUBLISHER_NAME,
  PUBLISHER_PASSWORD,
} from "./email-password";

/**
 * Create the Fieldnote publisher account if it does not already exist.
 * Safe to call on every seed — sign-up fails quietly when the email is taken.
 */
export async function ensurePublisherUser(): Promise<void> {
  if (!emailAndPasswordEnabled) return;
  try {
    const { auth } = await import("./server");
    await auth.api.signUpEmail({
      body: {
        email: PUBLISHER_EMAIL,
        password: PUBLISHER_PASSWORD,
        name: PUBLISHER_NAME,
      },
    });
  } catch {
    /* user already exists or auth not ready — ignore */
  }
}
