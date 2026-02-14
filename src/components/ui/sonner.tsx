import { Toaster as SonnerToaster } from 'sonner';

function Sonner() {
    return (
        <SonnerToaster
            className="toaster group"
            toastOptions={{
                style: {
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    borderColor: 'var(--border)',
                },
                classNames: {
                    toast: 'group toast border-border shadow-lg',
                    description: '!text-primary-foreground/80',
                    actionButton: '!bg-primary-foreground !text-primary',
                    cancelButton: '!bg-muted !text-muted-foreground',
                },
            }}
        />
    );
}

export { Sonner };
export { Sonner as Toaster };
