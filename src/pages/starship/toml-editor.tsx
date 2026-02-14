import { useState, useEffect } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useStarshipToml, useSaveStarshipToml } from '@/lib/query';

export function TomlEditor() {
    const { t } = useTranslation();
    const { data: tomlContent, isLoading } = useStarshipToml();
    const saveToml = useSaveStarshipToml();

    const [content, setContent] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (tomlContent !== undefined) {
            setContent(tomlContent);
            setHasChanges(false);
        }
    }, [tomlContent]);

    const handleContentChange = (value: string) => {
        setContent(value);
        setHasChanges(value !== tomlContent);
    };

    const handleSave = async () => {
        try {
            await saveToml.mutateAsync(content);
            setHasChanges(false);
            toast.success(t('starship.toml.saveSuccess'));
        } catch {
            toast.error(t('starship.toml.saveFailed'));
        }
    };

    const handleReset = () => {
        if (tomlContent !== undefined) {
            setContent(tomlContent);
            setHasChanges(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <span className="text-muted-foreground">{t('common.loading')}</span>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2" />
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        disabled={!hasChanges}
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {t('common.reset')}
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={!hasChanges || saveToml.isPending}
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {t('common.save')}
                    </Button>
                </div>
            </div>

            <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="flex-1 min-h-0 resize-none rounded-xl border border-input bg-background p-4 font-nerd text-sm shadow-sm transition-all duration-200 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                spellCheck={false}
                placeholder={t('starship.toml.placeholder')}
            />
        </div>
    );
}
