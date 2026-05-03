import { snapshotState } from "./snapshot-state.mjs";

// Placeholder execution helper.
// In phase 2, this should call the real sign-effect engine once implemented.
export function applySigneEffect({ kamarade, signe }) {
  const before = snapshotState(kamarade);
  const after = snapshotState(kamarade);

  return {
    before,
    after,
    metadata: {
      signeSlug: signe.slug,
      applied: false,
      reason: "Sign effect engine is not wired yet."
    }
  };
}
