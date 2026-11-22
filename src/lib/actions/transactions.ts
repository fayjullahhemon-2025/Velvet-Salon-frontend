"use server";

import {
  getAllTransactionsForAdmin,
  getTransactionById,
} from "@/lib/api/transactions";
import { requireAdminSession } from "@/lib/core/server";
import type { Transaction } from "@/types/transaction";

/**
 * Admin action to fetch all transactions.
 */
export async function fetchTransactionsForAdminAction(): Promise<{
  success: boolean;
  transactions: Transaction[];
  error?: string;
}> {
  try {
    await requireAdminSession();
    const transactions = await getAllTransactionsForAdmin();
    return { success: true, transactions };
  } catch (error) {
    return {
      success: false,
      transactions: [],
      error:
        error instanceof Error
          ? error.message
          : "Unauthorized: Admin session required.",
    };
  }
}

/**
 * Admin action to fetch single transaction details.
 */
export async function fetchTransactionDetailsAction(
  idOrSessionId: string,
): Promise<{
  success: boolean;
  transaction: Transaction | null;
  error?: string;
}> {
  try {
    await requireAdminSession();
    const transaction = await getTransactionById(idOrSessionId);
    return { success: true, transaction };
  } catch (error) {
    return {
      success: false,
      transaction: null,
      error:
        error instanceof Error
          ? error.message
          : "Unauthorized: Admin session required.",
    };
  }
}
