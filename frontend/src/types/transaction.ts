export type ExpenseTransaction = {
  id: number;
  payerId: number;
  payerName: string;
  receiverId: number;
  receiverName: string;
  amount: number;
};