# Expiry Worker Operations

The expiry worker finds escrows whose deadlines have passed and applies the
configured expiry behavior without double-processing completed work.

## Scheduling

- Run on a fixed interval with jitter to avoid instance lockstep.
- Use tenant-aware cursors for large backlogs.
- Keep one active worker per shard or protect each batch with advisory locks.

## Catch-Up Windows

When the worker is down, it should process missed deadlines in bounded batches.
Use checkpoint timestamps so a restart resumes from the last completed window.

## Idempotency

- Each expiry action must record escrow id, action type, and deadline version.
- Re-running the same window should skip already processed records.
- Contract calls should use deterministic idempotency keys where supported.

## Alerting

Alert when:

- worker heartbeat is missing
- backlog age exceeds the SLO
- lock acquisition fails for consecutive intervals
- expiry actions fail after retry exhaustion

## Rollback

Pause the worker first, confirm no in-flight jobs remain, then repair affected
escrows from the audit trail before resuming.
