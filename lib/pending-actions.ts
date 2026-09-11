export const PENDING_ACTION_KEY = "pulseboard:pending-action";

export type PendingAction =
  | { type: "vote"; returnTo: string; feedbackId: string }
  | { type: "comment"; returnTo: string; feedbackId: string; body: string }
  | { type: "feedback"; returnTo: string; workspaceId: string; boardId: string; title: string; body: string };

export function rememberPendingAction(action: PendingAction) {
  window.sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(action));
}

export function readPendingAction(): PendingAction | null {
  const raw = window.sessionStorage.getItem(PENDING_ACTION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingAction;
    return parsed && typeof parsed === "object" && "type" in parsed && "returnTo" in parsed ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPendingAction() {
  window.sessionStorage.removeItem(PENDING_ACTION_KEY);
}
