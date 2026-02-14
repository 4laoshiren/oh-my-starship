import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './dropdown-menu';

interface ColorPickerInputProps extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'onChange'
> {
    value: string;
    onChange: (value: string) => void;
}

const DEFAULT_PICKER_COLOR = '#98C379';

function normalizeHexColor(value: string): string | null {
    const match = value.match(/^#([0-9A-Fa-f]{6})$/);
    return match ? `#${match[1].toUpperCase()}` : null;
}

function extractHexColor(value: string): string | null {
    const match = value.match(/#([0-9A-Fa-f]{6})/);
    return match ? `#${match[1].toUpperCase()}` : null;
}

function applyHexColor(value: string, newColor: string): string {
    const normalizedColor = normalizeHexColor(newColor);
    if (!normalizedColor) {
        return value;
    }

    if (/#[0-9A-Fa-f]{6}/i.test(value)) {
        return value.replace(/#[0-9A-Fa-f]{6}/i, normalizedColor);
    }

    const styleMatch = value.match(/\(([^)]*)\)/);
    if (styleMatch) {
        return value.replace(/\([^)]*\)/, `(${normalizedColor})`);
    }

    return value;
}

const ColorPickerInput = React.forwardRef<HTMLInputElement, ColorPickerInputProps>(
    ({ className, value, onChange, disabled, ...props }, ref) => {
        const { t } = useTranslation();
        const [open, setOpen] = React.useState(false);

        const currentColor = extractHexColor(value) || DEFAULT_PICKER_COLOR;
        const [customColor, setCustomColor] = React.useState(currentColor);

        React.useEffect(() => {
            setCustomColor(currentColor);
        }, [currentColor]);

        const handleColorSelect = (color: string) => {
            onChange(applyHexColor(value, color));
        };

        const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const color = normalizeHexColor(e.target.value);
            if (!color) return;
            setCustomColor(color);
            handleColorSelect(color);
        };

        return (
            <div className="relative flex items-center gap-2">
                <Input
                    ref={ref}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className={cn('pr-10 font-nerd', className)}
                    {...props}
                />
                <DropdownMenu open={open} onOpenChange={setOpen}>
                    <DropdownMenuTrigger asChild disabled={disabled}>
                        <button
                            type="button"
                            className={cn(
                                'absolute right-1 flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                                disabled && 'pointer-events-none'
                            )}
                            disabled={disabled}
                        >
                            <div
                                className="h-5 w-5 rounded border border-border shadow-sm"
                                style={{ backgroundColor: currentColor }}
                            />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-3" sideOffset={8}>
                        <div className="space-y-3">
                            <div className="mb-2 text-xs font-medium text-muted-foreground">
                                {t('colorPicker.customColor')}
                            </div>
                            <div className="relative">
                                <input
                                    type="color"
                                    value={customColor}
                                    onChange={handleColorPickerChange}
                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                />
                                <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm">
                                    <Palette className="h-4 w-4 text-muted-foreground" />
                                    <span className="flex-1 text-muted-foreground">
                                        {t('colorPicker.selectColor')}
                                    </span>
                                    <div
                                        className="h-5 w-5 rounded border border-border"
                                        style={{ backgroundColor: customColor }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="text"
                                    value={customColor}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                            setCustomColor(val);
                                            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                                handleColorSelect(val.toUpperCase());
                                            }
                                        }
                                    }}
                                    placeholder="#RRGGBB"
                                    className="h-8 font-mono text-xs"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (/^#[0-9A-Fa-f]{6}$/.test(customColor)) {
                                            handleColorSelect(customColor.toUpperCase());
                                            setOpen(false);
                                        }
                                    }}
                                    className="h-8 whitespace-nowrap rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                                >
                                    {t('colorPicker.apply')}
                                </button>
                            </div>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    }
);
ColorPickerInput.displayName = 'ColorPickerInput';

export { ColorPickerInput };
