"use client";

import { useState } from "react";

interface Props {
  participantId: string;
  paymentStatus: string | null;
  invoiceAmountCents: number | null;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function statusBadge(status: string | null) {
  switch (status) {
    case "paid":
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
          Paid
        </span>
      );
    case "invoiced":
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
          Invoiced
        </span>
      );
    default:
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
          Unpaid
        </span>
      );
  }
}

export default function PaymentActions({
  participantId,
  paymentStatus,
  invoiceAmountCents,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/participants/${participantId}/payment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update payment status");
        return;
      }
      window.location.reload();
    } catch {
      alert("Failed to update payment status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="font-semibold text-gray-800 mb-4">Payment / Invoice</h2>
      <div className="flex items-center gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Invoice Amount</p>
          <p className="text-xl font-bold text-gray-900">
            {invoiceAmountCents != null ? formatCents(invoiceAmountCents) : "--"}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Status</p>
          {statusBadge(paymentStatus)}
        </div>
      </div>
      <div className="flex gap-3">
        {paymentStatus !== "invoiced" && (
          <button
            onClick={() => updateStatus("invoiced")}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              loading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-yellow-500 hover:bg-yellow-600 text-white"
            }`}
          >
            Mark as Invoiced
          </button>
        )}
        {paymentStatus !== "paid" && (
          <button
            onClick={() => updateStatus("paid")}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              loading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            Mark as Paid
          </button>
        )}
        {paymentStatus === "paid" && (
          <button
            onClick={() => updateStatus("unpaid")}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              loading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            Revert to Unpaid
          </button>
        )}
      </div>
    </div>
  );
}
