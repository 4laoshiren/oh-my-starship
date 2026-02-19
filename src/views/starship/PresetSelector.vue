<script setup>
import { Check, Palette } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import Button from '@/components/ui/Button.vue';
import StarshipLayout from './StarshipLayout.vue';
import { presets } from '@/lib/presets';
import { use_apply_preset, use_starship_toml } from '@/composables/use-starship';
import { cn } from '@/lib/utils';

const { t } = useI18n();
const { data: current_toml } = use_starship_toml();
const apply_preset_mutation = use_apply_preset();

async function handle_apply_preset(preset_id) {
    const preset = presets.find((p) => p.id === preset_id);
    if (!preset) return;

    try {
        await apply_preset_mutation.mutateAsync(preset.toml);
        toast.success(t('starship.presets.applySuccess', { name: preset.name }));
    } catch {
        toast.error(t('starship.presets.applyFailed'));
    }
}

function is_preset_active(preset_toml) {
    if (!current_toml.value) return false;
    const normalized_current = current_toml.value.trim().replace(/\r\n/g, '\n');
    const normalized_preset = preset_toml.trim().replace(/\r\n/g, '\n');
    return normalized_current === normalized_preset;
}
</script>

<template>
    <StarshipLayout>
        <div class="space-y-4 pb-6">
            <p class="text-sm text-muted-foreground">{{ t('starship.presets.description') }}</p>

            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div
                    v-for="preset in presets"
                    v-bind:key="preset.id"
                    v-bind:class="
                        cn(
                            'group relative flex cursor-pointer flex-col rounded-xl border bg-card p-4 shadow-sm transition-all duration-200',
                            is_preset_active(preset.toml)
                                ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                                : 'border-border hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md'
                        )
                    "
                >
                    <div class="mb-3 flex items-center gap-2.5">
                        <div
                            v-bind:class="
                                cn(
                                    'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                                    is_preset_active(preset.toml) ? 'bg-primary/10' : 'bg-muted'
                                )
                            "
                        >
                            <Palette
                                v-bind:class="
                                    cn(
                                        'h-4 w-4',
                                        is_preset_active(preset.toml)
                                            ? 'text-primary'
                                            : 'text-muted-foreground'
                                    )
                                "
                            />
                        </div>
                        <h3 class="font-medium">{{ preset.name }}</h3>
                        <div
                            v-if="is_preset_active(preset.toml)"
                            class="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary"
                        >
                            <Check class="h-3 w-3 text-primary-foreground" />
                        </div>
                    </div>

                    <p class="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {{ preset.description }}
                    </p>

                    <Button
                        v-bind:variant="is_preset_active(preset.toml) ? 'secondary' : 'default'"
                        v-bind:size="'sm'"
                        v-on:click="handle_apply_preset(preset.id)"
                        v-bind:disabled="
                            apply_preset_mutation.isPending.value || is_preset_active(preset.toml)
                        "
                        v-bind:class="'w-full'"
                    >
                        {{ is_preset_active(preset.toml) ? t('common.active') : t('common.apply') }}
                    </Button>
                </div>
            </div>
        </div>
    </StarshipLayout>
</template>
