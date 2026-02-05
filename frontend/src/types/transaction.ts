export type ExpenseTransaction = {
  transactionId: number;
  payerId: number;
  payerName: string;
  receiverId: number;
  receiverName: string;
  amount: number;
};