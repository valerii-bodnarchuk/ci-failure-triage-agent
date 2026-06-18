import { describe, expect, it } from "vitest";
import { reconcilePayments, type LedgerEntry, type PspPayment } from "./reconcile.js";

describe("reconcilePayments", () => {
  it("marks a matched PSP payment as reconciled", () => {
    const payments: PspPayment[] = [
      { id: "pay_001", amount: 5000, currency: "USD", status: "settled" }
    ];
    const ledgerEntries: LedgerEntry[] = [
      { id: "ledger_001", amount: 5000, currency: "USD", paymentId: "pay_001" }
    ];

    expect(reconcilePayments(payments, ledgerEntries)).toEqual([
      {
        paymentId: "pay_001",
        status: "reconciled",
        reason: "Ledger entry matches PSP payment"
      }
    ]);
  });

  it("marks an unmatched PSP payment as pending_investigation", () => {
    const payments: PspPayment[] = [
      { id: "pay_002", amount: 1200, currency: "USD", status: "settled" }
    ];
    const ledgerEntries: LedgerEntry[] = [];

    expect(reconcilePayments(payments, ledgerEntries)).toEqual([
      {
        paymentId: "pay_002",
        status: "pending_investigation",
        reason: "No ledger entry found"
      }
    ]);
  });

  it("marks an amount mismatch as pending_investigation", () => {
    const payments: PspPayment[] = [
      { id: "pay_003", amount: 2000, currency: "USD", status: "settled" }
    ];
    const ledgerEntries: LedgerEntry[] = [
      { id: "ledger_003", amount: 1999, currency: "USD", paymentId: "pay_003" }
    ];

    expect(reconcilePayments(payments, ledgerEntries)).toEqual([
      {
        paymentId: "pay_003",
        status: "pending_investigation",
        reason: "Ledger entry amount or currency does not match PSP payment"
      }
    ]);
  });
});
