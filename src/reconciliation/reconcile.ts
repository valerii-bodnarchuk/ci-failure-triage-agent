export type PspPayment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

export type LedgerEntry = {
  id: string;
  amount: number;
  currency: string;
  paymentId: string;
};

export type ReconciliationResult = {
  paymentId: string;
  status: "reconciled" | "pending_investigation";
  reason: string;
};

export function reconcilePayments(
  payments: PspPayment[],
  ledgerEntries: LedgerEntry[]
): ReconciliationResult[] {
  return payments.map((payment) => {
    const ledgerEntry = ledgerEntries.find((entry) => entry.paymentId === payment.id);

    if (!ledgerEntry) {
      return {
        paymentId: payment.id,
        status: "reconciled",
        reason: "No ledger entry found"
      };
    }

    if (ledgerEntry.amount !== payment.amount || ledgerEntry.currency !== payment.currency) {
      return {
        paymentId: payment.id,
        status: "pending_investigation",
        reason: "Ledger entry amount or currency does not match PSP payment"
      };
    }

    return {
      paymentId: payment.id,
      status: "reconciled",
      reason: "Ledger entry matches PSP payment"
    };
  });
}
