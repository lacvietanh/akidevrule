#!/usr/bin/env node
// Fires on `compact` only: rule files read before a compaction are gone from context while the summary reads as if they were not. Rationale: docs/arch/rule-delivery-architecture.md § Compaction.
import { readFileSync } from "node:fs";

const NOTICE =
  "[akidevrule] Context was just compacted: rule files read before this point are no longer in context, and the route gate counts reads only after the compaction. Before the next edit, re-read the routed rule files it needs and emit a [RULES] line for the set now in context; before closing a multi-step task, re-read the originating request verbatim (agent.B7).";

try {
  const input = JSON.parse(readFileSync(0, "utf8"));
  if (input.source === "compact") {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: NOTICE }, suppressOutput: true }) + "\n");
  }
} catch {
  /* fail silent: a notice must never block a session start */
}
process.exit(0);
