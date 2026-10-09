import { Keypair, Transaction, TransactionInstruction } from "@solana/web3.js";
import { env } from "../../config/env";
import { ValidationError } from "../../utils/errors";
import { memoProgramId, solanaDevnet } from "./solanaReceipt.service";

export interface BatchSigningResult {
  signature: string;
  payer: string;
}

export function getBatchSigner(): Keypair | null {
  if (!env.SOLANA_BATCH_SIGNER_PRIVATE_KEY) return null;
  try {
    return Keypair.fromSecretKey(Buffer.from(env.SOLANA_BATCH_SIGNER_PRIVATE_KEY, "base64"));
  } catch {
    throw new ValidationError("SOLANA_BATCH_SIGNER_PRIVATE_KEY is not a valid base64 private key");
  }
}

export async function signVerificationBatch(
  sourceRunId: string,
  rootHash: string,
): Promise<BatchSigningResult> {
  const signer = getBatchSigner();
  if (!signer) {
    throw new ValidationError("SOLANA_BATCH_SIGNER_PRIVATE_KEY is required for batch verification");
  }

  const memo = JSON.stringify({
    protocol: "scout-verification-batch-v1",
    sourceRunId,
    rootHash,
    network: "devnet",
  });
  const transaction = await createSignedMemoTransaction(signer, memo);
  const signature = await solanaDevnet.sendTransaction(transaction, [signer], {
    skipPreflight: false,
    preflightCommitment: env.SOLANA_BATCH_VERIFY_COMMITMENT,
  });
  const receipt = await solanaDevnet.getSignatureStatus(signature, {
    searchTransactionHistory: false,
  });
  if (receipt.value?.err) {
    throw new ValidationError("Solana Devnet rejected the verification batch transaction");
  }
  if (
    receipt.value?.confirmationStatus !== "confirmed" &&
    receipt.value?.confirmationStatus !== "finalized"
  ) {
    throw new ValidationError("Solana Devnet did not confirm the verification batch transaction");
  }

  return { signature, payer: signer.publicKey.toBase58() };
}

async function createSignedMemoTransaction(signer: Keypair, memo: string): Promise<Transaction> {
  const latest = await solanaDevnet.getLatestBlockhash(env.SOLANA_BATCH_VERIFY_COMMITMENT);
  const transaction = new Transaction({
    feePayer: signer.publicKey,
    recentBlockhash: latest.blockhash,
  }).add(
    new TransactionInstruction({
      programId: memoProgramId,
      keys: [],
      data: Buffer.from(memo, "utf8"),
    }),
  );
  transaction.sign(signer);
  return transaction;
}
