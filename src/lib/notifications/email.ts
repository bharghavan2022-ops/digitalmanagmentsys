import { Resend } from "resend";

let client: Resend | null = null;

// Email is optional per PROJECT_CONTEXT.md §3.1 - without RESEND_API_KEY set,
// announcements stay in-app only and this is a silent no-op rather than an
// error.
function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new Resend(apiKey);
  return client;
}

/**
 * Best-effort announcement email. Sends one message per recipient rather
 * than a single call with everyone in `to`, so volunteers' addresses are
 * never exposed to each other. Never throws - a delivery failure must not
 * roll back an announcement that already saved successfully.
 */
export async function sendAnnouncementEmail(params: {
  recipients: string[];
  title: string;
  body: string;
}): Promise<void> {
  const resend = getClient();
  if (!resend || params.recipients.length === 0) return;

  const results = await Promise.allSettled(
    params.recipients.map((to) =>
      resend.emails.send({
        from: "NSS Connect <notifications@resend.dev>",
        to,
        subject: params.title,
        text: params.body,
      }),
    ),
  );

  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  if (failures.length > 0) {
    console.error({
      operation: "notifications.sendAnnouncementEmail",
      failureCount: failures.length,
      firstError: failures[0].reason,
    });
  }
}
