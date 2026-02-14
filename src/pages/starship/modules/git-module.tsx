import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPickerInput } from '@/components/ui/color-picker-input';
import { useStarshipToml, useSaveStarshipToml } from '@/lib/query';
import { parseTomlSection, updateTomlSection } from '../toml-utils';
import { AnimatePresence, motion } from 'motion/react';

interface GitBranchFormData {
    symbol: string;
    style: string;
    format: string;
    truncation_length: number;
    truncation_symbol: string;
    disabled: boolean;
}

interface GitStatusFormData {
    style: string;
    format: string;
    ahead: string;
    behind: string;
    diverged: string;
    conflicted: string;
    untracked: string;
    stashed: string;
    modified: string;
    staged: string;
    renamed: string;
    deleted: string;
    disabled: boolean;
}

const branchDefaults: GitBranchFormData = {
    symbol: ' ',
    style: '#a855f7',
    format: '[$symbol$branch(:$remote_branch)]($style) ',
    truncation_length: 9999,
    truncation_symbol: '…',
    disabled: false,
};

const statusDefaults: GitStatusFormData = {
    style: '#ef4444',
    format: '([$all_status$ahead_behind]($style)) ',
    ahead: '⇡${count}',
    behind: '⇣${count}',
    diverged: '⇕⇡${ahead_count}⇣${behind_count}',
    conflicted: '=${count}',
    untracked: '?${count}',
    stashed: '$${count}',
    modified: '!${count}',
    staged: '+${count}',
    renamed: '»${count}',
    deleted: '✘${count}',
    disabled: false,
};

export function GitModule() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('branch');
    const { data: toml, isLoading } = useStarshipToml();
    const { mutate: saveToml, isPending } = useSaveStarshipToml();
    const activeFormId = activeTab === 'branch' ? 'git-branch-form' : 'git-status-form';

    const branchForm = useForm<GitBranchFormData>({ defaultValues: branchDefaults });
    const statusForm = useForm<GitStatusFormData>({ defaultValues: statusDefaults });

    useEffect(() => {
        if (toml) {
            const branchSection = parseTomlSection<GitBranchFormData>(toml, 'git_branch');
            const statusSection = parseTomlSection<GitStatusFormData>(toml, 'git_status');
            branchForm.reset({ ...branchDefaults, ...branchSection });
            statusForm.reset({ ...statusDefaults, ...statusSection });
        }
    }, [toml, branchForm, statusForm]);

    const onBranchSubmit = (data: GitBranchFormData) => {
        if (!toml) return;

        const updatedToml = updateTomlSection(toml, 'git_branch', data);
        saveToml(updatedToml, {
            onSuccess: () => toast.success(t('starship.modules.git.branch.saveSuccess')),
            onError: (error) =>
                toast.error(t('starship.modules.saveFailed', { message: error.message })),
        });
    };

    const onStatusSubmit = (data: GitStatusFormData) => {
        if (!toml) return;

        const updatedToml = updateTomlSection(toml, 'git_status', data);
        saveToml(updatedToml, {
            onSuccess: () => toast.success(t('starship.modules.git.status.saveSuccess')),
            onError: (error) =>
                toast.error(t('starship.modules.saveFailed', { message: error.message })),
        });
    };

    if (isLoading) {
        return <div className="text-sm text-muted-foreground">{t('common.loading')}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="text-lg font-medium">{t('starship.modules.git.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('starship.modules.git.subtitle')}
                    </p>
                </div>
                <Button
                    type="submit"
                    form={activeFormId}
                    disabled={isPending}
                    className="sm:self-start"
                >
                    {isPending ? t('common.saving') : t('common.saveChanges')}
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="branch">{t('starship.modules.git.branch.tab')}</TabsTrigger>
                    <TabsTrigger value="status">{t('starship.modules.git.status.tab')}</TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                    {activeTab === 'branch' && (
                        <motion.div
                            key="branch"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                        >
                            <TabsContent value="branch" className="mt-4">
                                <form
                                    id="git-branch-form"
                                    onSubmit={branchForm.handleSubmit(onBranchSubmit)}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="branch-disabled">
                                                {t('starship.modules.git.branch.hide')}
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                {t('starship.modules.git.branch.hideDesc')}
                                            </p>
                                        </div>
                                        <Switch
                                            id="branch-disabled"
                                            checked={branchForm.watch('disabled')}
                                            onCheckedChange={(checked) =>
                                                branchForm.setValue('disabled', checked)
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="branch-symbol">
                                                {t('starship.modules.git.branch.symbol')}
                                            </Label>
                                            <Input
                                                id="branch-symbol"
                                                {...branchForm.register('symbol')}
                                                placeholder=" "
                                                disabled={branchForm.watch('disabled')}
                                                className="font-nerd"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="branch-style">
                                                {t('starship.modules.git.branch.style')}
                                            </Label>
                                            <ColorPickerInput
                                                id="branch-style"
                                                value={branchForm.watch('style')}
                                                onChange={(value) =>
                                                    branchForm.setValue('style', value)
                                                }
                                                placeholder="#a855f7"
                                                disabled={branchForm.watch('disabled')}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="branch-format">
                                                {t('starship.modules.git.branch.format')}
                                            </Label>
                                            <Input
                                                id="branch-format"
                                                {...branchForm.register('format')}
                                                placeholder="[$symbol$branch(:$remote_branch)]($style) "
                                                disabled={branchForm.watch('disabled')}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="branch-truncation_length">
                                                {t('starship.modules.git.branch.truncationLength')}
                                            </Label>
                                            <Input
                                                id="branch-truncation_length"
                                                type="number"
                                                {...branchForm.register('truncation_length', {
                                                    valueAsNumber: true,
                                                })}
                                                placeholder="9999"
                                                disabled={branchForm.watch('disabled')}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="branch-truncation_symbol">
                                                {t('starship.modules.git.branch.truncationSymbol')}
                                            </Label>
                                            <Input
                                                id="branch-truncation_symbol"
                                                {...branchForm.register('truncation_symbol')}
                                                placeholder="…"
                                                disabled={branchForm.watch('disabled')}
                                            />
                                        </div>
                                    </div>
                                </form>
                            </TabsContent>
                        </motion.div>
                    )}
                    {activeTab === 'status' && (
                        <motion.div
                            key="status"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                        >
                            <TabsContent value="status" className="mt-4">
                                <form
                                    id="git-status-form"
                                    onSubmit={statusForm.handleSubmit(onStatusSubmit)}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="status-disabled">
                                                {t('starship.modules.git.status.hide')}
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                {t('starship.modules.git.status.hideDesc')}
                                            </p>
                                        </div>
                                        <Switch
                                            id="status-disabled"
                                            checked={statusForm.watch('disabled')}
                                            onCheckedChange={(checked) =>
                                                statusForm.setValue('disabled', checked)
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="status-style">
                                                {t('starship.modules.git.status.style')}
                                            </Label>
                                            <ColorPickerInput
                                                id="status-style"
                                                value={statusForm.watch('style')}
                                                onChange={(value) =>
                                                    statusForm.setValue('style', value)
                                                }
                                                placeholder="#ef4444"
                                                disabled={statusForm.watch('disabled')}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status-format">
                                                {t('starship.modules.git.status.format')}
                                            </Label>
                                            <Input
                                                id="status-format"
                                                {...statusForm.register('format')}
                                                placeholder="([$all_status$ahead_behind]($style)) "
                                                disabled={statusForm.watch('disabled')}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status-ahead">
                                                {t('starship.modules.git.status.ahead')}
                                            </Label>
                                            <Input
                                                id="status-ahead"
                                                {...statusForm.register('ahead')}
                                                placeholder="⇡${count}"
                                                disabled={statusForm.watch('disabled')}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status-behind">
                                                {t('starship.modules.git.status.behind')}
                                            </Label>
                                            <Input
                                                id="status-behind"
                                                {...statusForm.register('behind')}
                                                placeholder="⇣${count}"
                                                disabled={statusForm.watch('disabled')}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status-diverged">
                                                {t('starship.modules.git.status.diverged')}
                                            </Label>
                                            <Input
                                                id="status-diverged"
                                                {...statusForm.register('diverged')}
                                                placeholder="⇕⇡${ahead_count}⇣${behind_count}"
                                                disabled={statusForm.watch('disabled')}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status-conflicted">
                                                {t('starship.modules.git.status.conflicted')}
                                            </Label>
                                            <Input
                                                id="status-conflicted"
                                                {...statusForm.register('conflicted')}
                                                placeholder="=${count}"
                                                disabled={statusForm.watch('disabled')}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status-untracked">
                                                {t('starship.modules.git.status.untracked')}
                                            </Label>
                                            <Input
                                                id="status-untracked"
                                                {...statusForm.register('untracked')}
                                                placeholder="?${count}"
                                                disabled={statusForm.watch('disabled')}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status-stashed">
                                                {t('starship.modules.git.status.stashed')}
                                            </Label>
                                            <Input
                                                id="status-stashed"
                                                {...statusForm.register('stashed')}
                                                placeholder="$${count}"
                                                disabled={statusForm.watch('disabled')}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status-modified">
                                                {t('starship.modules.git.status.modified')}
                                            </Label>
                                            <Input
                                                id="status-modified"
                                                {...statusForm.register('modified')}
                                                placeholder="!${count}"
                                                disabled={statusForm.watch('disabled')}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status-staged">
                                                {t('starship.modules.git.status.staged')}
                                            </Label>
                                            <Input
                                                id="status-staged"
                                                {...statusForm.register('staged')}
                                                placeholder="+${count}"
                                                disabled={statusForm.watch('disabled')}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status-renamed">
                                                {t('starship.modules.git.status.renamed')}
                                            </Label>
                                            <Input
                                                id="status-renamed"
                                                {...statusForm.register('renamed')}
                                                placeholder="»${count}"
                                                disabled={statusForm.watch('disabled')}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status-deleted">
                                                {t('starship.modules.git.status.deleted')}
                                            </Label>
                                            <Input
                                                id="status-deleted"
                                                {...statusForm.register('deleted')}
                                                placeholder="✘${count}"
                                                disabled={statusForm.watch('disabled')}
                                            />
                                        </div>
                                    </div>
                                </form>
                            </TabsContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Tabs>
        </div>
    );
}
