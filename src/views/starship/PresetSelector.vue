<script setup>
import { useI18n } from 'vue-i18n';
import StarshipLayout from './StarshipLayout.vue';
import { presets } from '@/lib/presets';
import { use_apply_preset, use_starship_toml } from '@/composables/use-starship';

const { t } = useI18n();
const toast = useToast();
const { data: current_toml } = use_starship_toml();
const apply_preset_mutation = use_apply_preset();

async function handle_apply_preset(preset_id) {
    const preset = presets.find((p) => p.id === preset_id);
    if (!preset) return;

    try {
        await apply_preset_mutation.mutateAsync(preset.toml);
        toast.add({
            title: t('starship.presets.applySuccess', { name: preset.name }),
            color: 'success',
        });
    } catch {
        toast.add({ title: t('starship.presets.applyFailed'), color: 'error' });
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
            <p class="text-sm text-(--ui-text-muted)">{{ t('starship.presets.description') }}</p>

            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div
                    v-for="preset in presets"
                    v-bind:key="preset.id"
                    v-bind:class="[
                        'group relative flex cursor-pointer flex-col rounded-xl border p-4 shadow-sm transition-all duration-200',
                        is_preset_active(preset.toml)
                            ? 'border-(--ui-primary)/50 bg-(--ui-primary)/5 ring-1 ring-(--ui-primary)/20'
                            : 'border-(--ui-border) bg-(--ui-bg-elevated) hover:-translate-y-0.5 hover:border-(--ui-primary)/30 hover:shadow-md',
                    ]"
                >
                    <div class="mb-3 flex items-center gap-2.5">
                        <div
                            v-bind:class="[
                                'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                                is_preset_active(preset.toml)
                                    ? 'bg-(--ui-primary)/10'
                                    : 'bg-(--ui-bg-accented)',
                            ]"
                        >
                            <UIcon
                                v-bind:name="'i-lucide-palette'"
                                v-bind:class="[
                                    'h-4 w-4',
                                    is_preset_active(preset.toml)
                                        ? 'text-(--ui-primary)'
                                        : 'text-(--ui-text-muted)',
                                ]"
                            />
                        </div>
                        <h3 class="font-medium">{{ preset.name }}</h3>
                        <div
                            v-if="is_preset_active(preset.toml)"
                            class="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-(--ui-primary)"
                        >
                            <UIcon v-bind:name="'i-lucide-check'" class="h-3 w-3 text-(--ui-bg)" />
                        </div>
                    </div>

                    <p class="mb-4 flex-1 text-sm leading-relaxed text-(--ui-text-muted)">
                        {{ preset.description }}
                    </p>

                    <UButton
                        v-bind:variant="is_preset_active(preset.toml) ? 'soft' : 'solid'"
                        v-bind:size="'sm'"
                        v-on:click="handle_apply_preset(preset.id)"
                        v-bind:disabled="
                            apply_preset_mutation.isPending.value || is_preset_active(preset.toml)
                        "
                        v-bind:class="'w-full'"
                    >
                        {{ is_preset_active(preset.toml) ? t('common.active') : t('common.apply') }}
                    </UButton>
                </div>
            </div>
        </div>
    </StarshipLayout>
</template>
