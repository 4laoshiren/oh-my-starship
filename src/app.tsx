import './global.css';

import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';

import { router } from '@/routes';
import { AppProvider } from '@/app-context';
import type { Settings } from '@/types';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: false,
        },
    },
});

export function App({ settings }: { settings: Settings }) {
    return (
        <QueryClientProvider client={queryClient}>
            <AppProvider settings={settings}>
                <RouterProvider router={router} />
                <Toaster />
            </AppProvider>
        </QueryClientProvider>
    );
}
