// src/libs/components/Web3ContextProvider.tsx
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/config/reown'

interface Web3ContextProviderProps {
  children: React.ReactNode;
}

const queryClient = new QueryClient()

// `reconnectOnMount` defaults to true, which makes wagmi re-open the last used
// connector on every page load. With a wallet extension installed that wakes it
// and the visitor is met by an unlock prompt before they have asked for
// anything — the desk is anonymous-first, so nothing may touch a wallet until
// the visitor clicks connect themselves.
export default function Web3ContextProvider({ children }: Web3ContextProviderProps) {
  return (
    <WagmiProvider config={config} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
