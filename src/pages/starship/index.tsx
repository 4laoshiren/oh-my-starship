import { useState, type ReactNode } from 'react';
import { ArchiveRestore } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setBackupName } from '@/lib/backup-names';
import { useCreateStarshipBackup } from '@/lib/query';
import { PresetSelector } from './preset-selector';

type StarshipLayoutProps = {
    children: ReactNode;
};

export function StarshipLayout({ children }: StarshipLayoutProps) {
    const { t } = useTranslation();
    const { mutate: createBackup, isPending } = useCreateStarshipBackup();
    const [nameDialogOpen, setNameDialogOpen] = useState(false);
    const [backupName, setBackupNameInput] = useState('');
    const canSaveName = backupName.trim().length > 0;

    const handleCreateBackup = () => {
        if (!canSaveName) return;
        createBackup(undefined, {
            onSuccess: (backupPath) => {
                setBackupName(backupPath, backupName);
                toast.success(t('starship.backupSuccess'));
                setNameDialogOpen(false);
                setBackupNameInput('');
            },
            onError: (error) => {
                toast.error(t('starship.backupError', { error: error.message }));
            },
        });
    };

    const openNameDialog = () => {
        setBackupNameInput('');
        setNameDialogOpen(true);
    };

    return (
        <div className="flex h-full flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t('starship.title')}</h2>
                <Button variant="outline" size="sm" onClick={openNameDialog} disabled={isPending}>
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                    {t('starship.backup')}
                </Button>
            </div>

            <div className="flex-1">{children}</div>

            <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('backups.nameTitle')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="backup-name">{t('backups.nameLabel')}</Label>
                            <Input
                                id="backup-name"
                                value={backupName}
                                onChange={(e) => setBackupNameInput(e.target.value)}
                                placeholder={t('backups.namePlaceholder')}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && canSaveName) {
                                        handleCreateBackup();
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNameDialogOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={handleCreateBackup} disabled={isPending || !canSaveName}>
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export function Component() {
    return (
        <StarshipLayout>
            <PresetSelector />
        </StarshipLayout>
    );
}
