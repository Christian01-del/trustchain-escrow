# Transaction Monitor Runbook

Use this runbook when Stellar transactions are stuck, failed, or waiting for
manual review.

## Triage

- Check monitor worker health and queue depth.
- Locate the transaction by hash, tenant id, and correlation id.
- Confirm whether the transaction reached Horizon or RPC submission.
- Compare ledger age with the monitor timeout policy.

## Stuck Transactions

1. Verify RPC provider status.
2. Re-query transaction status by hash.
3. If not found, check whether the submission job failed before broadcast.
4. Mark as retryable only when duplicate submission is safe.
5. Escalate to manual review when payment state is ambiguous.

## Failed Transactions

- `tx_bad_seq`: refresh account sequence and retry if policy allows.
- `tx_insufficient_fee`: retry with configured fee bump guardrails.
- `op_underfunded`: do not retry automatically; notify the payer.
- timeout: retry only after confirming no final ledger result exists.

## Manual Review

Manual review requires transaction hash, source account, expected amount, escrow
id, last monitor status, and operator decision. Every decision should include a
reason and correlation id.
