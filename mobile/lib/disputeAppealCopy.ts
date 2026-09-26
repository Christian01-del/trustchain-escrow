export type DisputeAppealCopyInput = {
  appealDeadline?: string | null;
  isEligible?: boolean;
  now?: Date;
};

export function getDisputeAppealCopy({
  appealDeadline,
  isEligible = true,
  now = new Date(),
}: DisputeAppealCopyInput): string {
  if (!appealDeadline) {
    return 'Appeal availability has not been published yet. Refresh before submitting evidence.';
  }

  const deadline = new Date(appealDeadline);
  if (Number.isNaN(deadline.getTime())) {
    return 'Appeal deadline is unavailable. Contact support before submitting new evidence.';
  }

  if (deadline.getTime() <= now.getTime()) {
    return 'The appeal window is closed. You can still review the dispute outcome and contact support.';
  }

  const formattedDeadline = deadline.toLocaleString();
  if (!isEligible) {
    return `Appeal window closes ${formattedDeadline}, but this wallet is not eligible to appeal.`;
  }

  return `Appeal window closes ${formattedDeadline}. Submit any new evidence before the deadline.`;
}
