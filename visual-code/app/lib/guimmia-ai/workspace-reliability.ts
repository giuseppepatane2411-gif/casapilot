// A late network response must never replace the conversation now on screen.
export function createLatestRequestGate() {
  let version = 0;
  return {
    next: () => ++version,
    isCurrent: (ticket: number) => ticket === version,
    invalidate: () => { version += 1; },
  };
}

// Insert the SAME message ID on retry. A lost acknowledgement is not a new
// message: verify the existing row through the authenticated, RLS-scoped client.
// No model request, upsert, UPDATE permission, or local persistent copy is used.
export async function confirmMessageSave(
  insert: () => Promise<{ error: unknown }>,
  matchesStoredMessage: () => Promise<boolean>,
): Promise<boolean> {
  try {
    const result = await insert();
    if (!result.error) return true;
  } catch {
    // The server might have committed before the connection was interrupted.
  }
  try {
    return await matchesStoredMessage();
  } catch {
    return false;
  }
}
