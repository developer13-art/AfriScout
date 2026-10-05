import { useCallback, useEffect, useState } from "react";
import type { Connection, Transaction } from "@solana/web3.js";

interface SolanaPublicKey {
  toString(): string;
  toBase58?(): string;
}

interface SolanaWalletProvider {
  publicKey?: SolanaPublicKey | null;
  isPhantom?: boolean;
  isSolflare?: boolean;
  isBackpack?: boolean;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{
    publicKey?: SolanaPublicKey;
  }>;
  disconnect?: () => Promise<void>;
  signMessage?: (
    message: Uint8Array,
    display?: "utf8" | "hex",
  ) => Promise<{ signature: Uint8Array }>;
  sendTransaction?: (
    transaction: Transaction,
    connection: Connection,
    options?: { preflightCommitment?: "processed" | "confirmed" | "finalized" },
  ) => Promise<string>;
  on?: (event: "connect" | "disconnect", listener: () => void) => void;
  off?: (event: "connect" | "disconnect", listener: () => void) => void;
}

declare global {
  interface Window {
    solana?: SolanaWalletProvider;
    phantom?: { solana?: SolanaWalletProvider };
    solflare?: SolanaWalletProvider;
    backpack?: { solana?: SolanaWalletProvider };
  }
}

function getProvider(): SolanaWalletProvider | undefined {
  return (
    window.phantom?.solana ??
    window.solflare ??
    window.backpack?.solana ??
    window.solana
  );
}

function walletLabel(provider: SolanaWalletProvider): string {
  if (provider.isPhantom) return "Phantom";
  if (provider.isSolflare) return "Solflare";
  if (provider.isBackpack) return "Backpack";
  return "Solana wallet";
}

function addressOf(value?: SolanaPublicKey | null): string | null {
  if (!value) return null;
  return value.toBase58?.() ?? value.toString();
}

export function useSolanaWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const provider = getProvider();
    setAvailable(Boolean(provider));
    if (provider) {
      setAddress(addressOf(provider.publicKey));
      if (provider.publicKey) setWalletName(walletLabel(provider));
    }

    const onConnect = () => {
      const current = getProvider();
      if (!current) return;
      setAddress(addressOf(current.publicKey));
      setWalletName(walletLabel(current));
    };
    const onDisconnect = () => {
      setAddress(null);
      setWalletName(null);
    };

    provider?.on?.("connect", onConnect);
    provider?.on?.("disconnect", onDisconnect);
    return () => {
      provider?.off?.("connect", onConnect);
      provider?.off?.("disconnect", onDisconnect);
    };
  }, []);

  const connect = useCallback(async (): Promise<string | null> => {
    const provider = getProvider();
    setError(null);
    if (!provider) {
      setError("No compatible Solana wallet was found in this browser.");
      return null;
    }

    setConnecting(true);
    try {
      const result = await provider.connect({ onlyIfTrusted: false });
      const connectedAddress = addressOf(result.publicKey ?? provider.publicKey);
      if (!connectedAddress) {
        throw new Error("The wallet connected without returning a public address.");
      }
      setAddress(connectedAddress);
      setWalletName(walletLabel(provider));
      return connectedAddress;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not connect to the wallet.",
      );
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  const signMessage = useCallback(async (message: string): Promise<Uint8Array> => {
    const provider = getProvider();
    if (!provider?.signMessage) {
      throw new Error("This wallet does not support message signing.");
    }
    const result = await provider.signMessage(new TextEncoder().encode(message), "utf8");
    if (!(result.signature instanceof Uint8Array) || result.signature.length !== 64) {
      throw new Error("The wallet returned an invalid message signature.");
    }
    return result.signature;
  }, []);

  const sendTransaction = useCallback(
    async (transaction: Transaction, connection: Connection): Promise<string> => {
      const provider = getProvider();
      if (!provider?.sendTransaction) {
        throw new Error("This wallet cannot send Solana transactions.");
      }
      return provider.sendTransaction(transaction, connection, {
        preflightCommitment: "confirmed",
      });
    },
    [],
  );

  const disconnect = useCallback(async () => {
    const provider = getProvider();
    setError(null);
    try {
      await provider?.disconnect?.();
      setAddress(null);
      setWalletName(null);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not disconnect the wallet.",
      );
    }
  }, []);

  return {
    address,
    walletName,
    available,
    error,
    connecting,
    connect,
    disconnect,
    signMessage,
    sendTransaction,
  };
}
