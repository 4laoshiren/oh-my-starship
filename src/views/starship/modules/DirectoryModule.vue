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
    truncation_length: 3,
    truncation_symbol: '…',
    truncate_to_repo: true,
    style: '#06b6d4',
    format: '[$path]($style)[$read_only]($read_only_style) ',
    read_only: '🔒',
    read_only_style: '#ef4444',
    home_symbol: '~',
    disabled: false,
};

const state = reactive({ ...defaults });

watch(
    toml,
    (val) => {
        if (val) {
            const section = parse_toml_section(val, 'directory');
            Object.assign(state, { ...defaults, ...section });
        }
    },
    { immediate: true }
);

function on_submit() {
    if (!toml.value) return;
    const updated_toml = update_toml_section(toml.value, 'directory', { ...state });
    save_toml(updated_toml, {
        onSuccess: () =>
            toast.add({ title: t('starship.modules.directory.saveSuccess'), color: 'success' }),
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
            <div class="flex gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 class="text-lg font-medium">
                        {{ t('starship.modules.directory.title') }}
                    </h3>
                    <p class="text-sm text-(--ui-text-muted)">
                        {{ t('starship.modules.directory.subtitle') }}
                    </p>
                </div>
                <UButton v-bind:type="'submit'" v-bind:disabled="is_pending" class="sm:self-start">
                    {{ is_pending ? t('common.saving') : t('common.saveChanges') }}
                </UButton>
            </div>

            <div
                class="flex items-center justify-between rounded-xl border border-(--ui-border) bg-(--ui-bg-accented)/30 p-4 transition-colors hover:bg-(--ui-bg-accented)/50"
            >
                <div class="space-y-0.5">
                    <label v-bind:for="'disabled'" class="text-sm font-medium">
                        {{ t('starship.modules.directory.hideDirectory') }}
                    </label>
                    <p class="text-xs text-(--ui-text-muted)">
                        {{ t('starship.modules.directory.hideDescription') }}
                    </p>
                </div>
                <USwitch v-bind:id="'disabled'" v-model:model-value="state.disabled" />
            </div>

            <div class="grid gap-4">
                <UFormField
                    v-bind:label="t('starship.modules.directory.truncationLength')"
                    v-bind:description="t('starship.modules.directory.truncationLengthDesc')"
                >
                    <UInput
                        v-bind:id="'truncation_length'"
                        v-bind:type="'number'"
                        v-model:model-value="state.truncation_length"
                        v-bind:placeholder="'3'"
                        v-bind:disabled="state.disabled"
                    />
                </UFormField>

                <UFormField
                    v-bind:label="t('starship.modules.directory.truncationSymbol')"
                    v-bind:description="t('starship.modules.directory.truncationSymbolDesc')"
                >
                    <UInput
                        v-bind:id="'truncation_symbol'"
                        v-model:model-value="state.truncation_symbol"
                        v-bind:placeholder="'…'"
                        v-bind:disabled="state.disabled"
                    />
                </UFormField>

                <div
                    class="flex items-center justify-between rounded-lg border border-(--ui-border) p-4"
                >
                    <div class="space-y-0.5">
                        <label v-bind:for="'truncate_to_repo'" class="text-sm font-medium">
                            {{ t('starship.modules.directory.truncateToRepo') }}
                        </label>
                        <p class="text-xs text-(--ui-text-muted)">
                            {{ t('starship.modules.directory.truncateToRepoDesc') }}
                        </p>
                    </div>
                    <USwitch
                        v-bind:id="'truncate_to_repo'"
                        v-model:model-value="state.truncate_to_repo"
                        v-bind:disabled="state.disabled"
                    />
                </div>

                <UFormField
                    v-bind:label="t('starship.modules.directory.style')"
                    v-bind:description="t('starship.modules.directory.styleDesc')"
                >
                    <ColorPickerInput
                        v-bind:id="'style'"
                        v-model:modelValue="state.style"
                        v-bind:placeholder="'#06b6d4'"
                        v-bind:disabled="state.disabled"
                    />
                </UFormField>

                <UFormField
                    v-bind:label="t('starship.modules.directory.format')"
                    v-bind:description="t('starship.modules.directory.formatDesc')"
                >
                    <UInput
                        v-bind:id="'format'"
                        v-model:model-value="state.format"
                        v-bind:placeholder="'[$path]($style)[$read_only]($read_only_style) '"
                        v-bind:disabled="state.disabled"
                    />
                </UFormField>

                <UFormField
                    v-bind:label="t('starship.modules.directory.homeSymbol')"
                    v-bind:description="t('starship.modules.directory.homeSymbolDesc')"
                >
                    <UInput
                        v-bind:id="'home_symbol'"
                        v-model:model-value="state.home_symbol"
                        v-bind:placeholder="'~'"
                        v-bind:disabled="state.disabled"
                    />
                </UFormField>

                <UFormField
                    v-bind:label="t('starship.modules.directory.readOnlySymbol')"
                    v-bind:description="t('starship.modules.directory.readOnlySymbolDesc')"
                >
                    <UInput
                        v-bind:id="'read_only'"
                        v-model:model-value="state.read_only"
                        v-bind:placeholder="'🔒'"
                        v-bind:disabled="state.disabled"
                        v-bind:class="'font-nerd'"
                    />
                </UFormField>

                <UFormField
                    v-bind:label="t('starship.modules.directory.readOnlyStyle')"
                    v-bind:description="t('starship.modules.directory.readOnlyStyleDesc')"
                >
                    <ColorPickerInput
                        v-bind:id="'read_only_style'"
                        v-model:modelValue="state.read_only_style"
                        v-bind:placeholder="'#ef4444'"
                        v-bind:disabled="state.disabled"
                    />
                </UFormField>
            </div>
        </form>
    </StarshipLayout>
</template>
