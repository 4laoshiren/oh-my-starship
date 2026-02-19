<script setup>
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ColorPickerInput from '@/components/ui/ColorPickerInput.vue';
import StarshipLayout from '@/views/starship/StarshipLayout.vue';
import { use_starship_toml, use_save_starship_toml } from '@/composables/use-starship';
import { parse_toml_section, update_toml_section } from '@/lib/toml-utils';

const { t } = useI18n();
const toast = useToast();
const { data: toml, isLoading: is_loading } = use_starship_toml();
const { mutate: save_toml, isPending: is_pending } = use_save_starship_toml();

const defaults = {
    success_symbol: '[❯]( #22c55e)',
    error_symbol: '[❯]( #ef4444)',
    vimcmd_symbol: '[❮]( #22c55e)',
    vimcmd_replace_symbol: '[❮]( #a855f7)',
    vimcmd_visual_symbol: '[❮]( #eab308)',
    disabled: false,
};

const state = reactive({ ...defaults });

watch(
    toml,
    (val) => {
        if (val) {
            const section = parse_toml_section(val, 'character');
            Object.assign(state, { ...defaults, ...section });
        }
    },
    { immediate: true }
);

function on_submit() {
    if (!toml.value) return;
    const updated_toml = update_toml_section(toml.value, 'character', { ...state });
    save_toml(updated_toml, {
        onSuccess: () =>
            toast.add({ title: t('starship.modules.character.saveSuccess'), color: 'success' }),
        onError: (error) =>
            toast.add({
                title: t('starship.modules.saveFailed', { message: error.message }),
                color: 'error',
            }),
    });
}
</script>

<template>
    <StarshipLayout>
        <div v-if="is_loading" class="text-sm text-(--ui-text-muted)">
            {{ t('common.loading') }}
        </div>

        <form v-else v-on:submit.prevent="on_submit" class="space-y-6">
            <div class="flex gap-3 flex-row items-start justify-between">
                <div>
                    <h3 class="text-lg font-medium">
                        {{ t('starship.modules.character.title') }}
                    </h3>
                    <p class="text-sm text-(--ui-text-muted)">
                        {{ t('starship.modules.character.subtitle') }}
                    </p>
                </div>
                <UButton v-bind:type="'submit'" v-bind:disabled="is_pending">
                    {{ is_pending ? t('common.saving') : t('common.saveChanges') }}
                </UButton>
            </div>

            <div
                class="flex items-center justify-between rounded-xl border border-(--ui-border) bg-(--ui-bg-accented)/30 p-4 transition-colors hover:bg-(--ui-bg-accented)/50"
            >
                <div class="space-y-0.5">
                    <label v-bind:for="'disabled'" class="text-sm font-medium">
                        {{ t('starship.modules.character.hideCharacter') }}
                    </label>
                    <p class="text-xs text-(--ui-text-muted)">
                        {{ t('starship.modules.character.hideDescription') }}
                    </p>
                </div>
                <USwitch v-bind:id="'disabled'" v-model:model-value="state.disabled" />
            </div>

            <div class="grid gap-4">
                <UFormField
                    v-bind:label="t('starship.modules.character.successSymbol')"
                    v-bind:description="t('starship.modules.character.successSymbolDesc')"
                >
                    <ColorPickerInput
                        v-bind:id="'success_symbol'"
                        v-model:modelValue="state.success_symbol"
                        v-bind:placeholder="'[❯](bold #22c55e)'"
                        v-bind:disabled="state.disabled"
                    />
                </UFormField>

                <UFormField
                    v-bind:label="t('starship.modules.character.errorSymbol')"
                    v-bind:description="t('starship.modules.character.errorSymbolDesc')"
                >
                    <ColorPickerInput
                        v-bind:id="'error_symbol'"
                        v-model:modelValue="state.error_symbol"
                        v-bind:placeholder="'[❯](bold #ef4444)'"
                        v-bind:disabled="state.disabled"
                    />
                </UFormField>

                <UFormField
                    v-bind:label="t('starship.modules.character.vimcmdSymbol')"
                    v-bind:description="t('starship.modules.character.vimcmdSymbolDesc')"
                >
                    <ColorPickerInput
                        v-bind:id="'vimcmd_symbol'"
                        v-model:modelValue="state.vimcmd_symbol"
                        v-bind:placeholder="'[❮](bold #22c55e)'"
                        v-bind:disabled="state.disabled"
                    />
                </UFormField>

                <UFormField
                    v-bind:label="t('starship.modules.character.vimcmdReplaceSymbol')"
                    v-bind:description="t('starship.modules.character.vimcmdReplaceSymbolDesc')"
                >
                    <ColorPickerInput
                        v-bind:id="'vimcmd_replace_symbol'"
                        v-model:modelValue="state.vimcmd_replace_symbol"
                        v-bind:placeholder="'[❮](bold #a855f7)'"
                        v-bind:disabled="state.disabled"
                    />
                </UFormField>

                <UFormField
                    v-bind:label="t('starship.modules.character.vimcmdVisualSymbol')"
                    v-bind:description="t('starship.modules.character.vimcmdVisualSymbolDesc')"
                >
                    <ColorPickerInput
                        v-bind:id="'vimcmd_visual_symbol'"
                        v-model:modelValue="state.vimcmd_visual_symbol"
                        v-bind:placeholder="'[❮](bold #eab308)'"
                        v-bind:disabled="state.disabled"
                    />
                </UFormField>
            </div>
        </form>
    </StarshipLayout>
</template>
