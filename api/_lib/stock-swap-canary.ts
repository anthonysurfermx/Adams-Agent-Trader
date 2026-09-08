import { isAddress, zeroAddress } from 'viem';

/** Additive restriction: only an ABSENT variable permits the public rollout.
 * A defined empty, malformed or zero-address list blocks every stock recipient.
 * This restricts calldata issuance; it cannot cancel an already signed transaction.
 */
export function stockSwapCanaryReason(recipient: string, configured: string | undefined): string | null {
  if (configured === undefined) return null;
  const wallets = configured.split(',').map((value) => value.trim());
  if (wallets.some((wallet) => !isAddress(wallet, { strict: false }) || wallet.toLowerCase() === zeroAddress)) {
    return 'stock swap canary configuration is invalid; execution withheld';
  }
  if (!wallets.some((wallet) => wallet.toLowerCase() === recipient.toLowerCase())) {
    return 'stock swaps are limited to launch canary wallets';
  }
  return null;
}
