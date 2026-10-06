import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { UnauthorizedError, ValidationError } from "../../utils/errors";

export const solanaDevnet = new Connection("https://api.devnet.solana.com", "confirmed");
export const memoProgramId = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);

export async function createMemoTransaction(payerAddress: string, memo: string) {
  let payer: PublicKey;
  try {
    payer = new PublicKey(payerAddress);
  } catch {
    throw new ValidationError("A valid Solana wallet address is required");
  }
  const latest = await solanaDevnet.getLatestBlockhash("confirmed");
  const transaction = new Transaction({
    feePayer: payer,
    recentBlockhash: latest.blockhash,
  }).add(
    new TransactionInstruction({
      programId: memoProgramId,
      keys: [],
      data: Buffer.from(memo, "utf8"),
    }),
  );
  return transaction
    .serialize({ requireAllSignatures: false, verifySignatures: false })
    .toString("base64");
}

export async function verifyMemoReceipt(
  signature: string,
  expectedSigner: string,
  expectedMemo: string,
) {
  let transaction;
  try {
    transaction = await solanaDevnet.getParsedTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
  } catch {
    throw new ValidationError("Could not verify this receipt on Solana Devnet");
  }
  if (!transaction || transaction.meta?.err) {
    throw new ValidationError("This receipt is not confirmed on Solana Devnet");
  }
  const payer = transaction.transaction.message.accountKeys[0];
  if (!payer?.signer || payer.pubkey.toBase58() !== expectedSigner) {
    throw new UnauthorizedError("This receipt was not signed by your linked wallet");
  }
  const memoFound = transaction.transaction.message.instructions.some((instruction) =>
    instruction.programId.toBase58() === memoProgramId.toBase58() &&
    "parsed" in instruction &&
    instruction.parsed === expectedMemo,
  );
  if (!memoFound) {
    throw new ValidationError("This transaction does not contain the expected Scout proof");
  }
}
