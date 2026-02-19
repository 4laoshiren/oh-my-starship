<script setup>
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ColorPickerInput from '@/components/ui/ColorPickerInput.vue';
import StarshipLayout from '@/views/starship/StarshipLayout.vue';
import { use_starship_toml, use_save_starship_toml } from '@/composables/use-starship';
import { parse_toml_section, update_toml_section } from '@/lib/toml-utils';
import { open_external } from '@/services/cmds';

const { t } = useI18n();
const toast = useToast();
const { data: toml, isLoading: is_loading } = use_starship_toml();
const { mutate: save_toml, isPending: is_pending } = use_save_starship_toml();

const defaults = {
    disabled: true,
    time_format: '%T',
    format: '[$time]($style) ',
    style: '#eab308',
    use_12hr: false,
};

const time_format_examples = [
    { label: '24-hour (14:30:00)', value: '%T' },
    { label: '12-hour (02:30:00 PM)', value: '%r' },
    { label: 'Hour:Minute (14:30)', value: '%R' },
    { label: 'Custom (2:30 PM)', value: '%-I:%M %p' },
];

const state = reactive({ ...defaults });

watch(
    toml,
    (val) => {
        if (val) {
            const section = parse_toml_section(val, 'time');
            Object.assign(state, { ...defaults, ...section });
        }
    },
    { immediate: true }
);

function on_submit() {
    if (!toml.value) return;
    const updated_toml = update_toml_section(toml.value, 'time', { ...state });
    save_toml(updated_toml, {
        onSuccess: () =>
            toast.add({ title: t('starship.modules.time.saveSuccess'), color: 'success' }),
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
                    <h3 class="text-lg font-medium">{{ t('starship.modules.time.title') }}</h3>
                    <p class="text-sm text-(--ui-text-muted)">
                        {{ t('starship.modules.time.subtitle') }}
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
                        {{ t('starship.modules.time.hideTime') }}
                    </label>
                    <p class="text-xs text-(--ui-text-muted)">
                        {{ t('starship.modules.time.hideDescription') }}
                    </p>
                </div>
                <USwitch v-bind:id="'disabled'" v-model:model-value="state.disabled" />
            </div>

            <div class="grid gap-4">
                <UFormField v-bind:label="t('starship.modules.time.timeFormat')">
                    <UInput
                        v-bind:id="'time_format'"
                        v-model:model-value="state.time_format"
                        v-bind:placeholder="'%T'"
                        v-bind:disabled="state.disabled"
                    />
                    <template #description>
                        <div class="space-y-1">
                            <p>{{ t('starship.modules.time.timeFormatDesc') }}</p>
                            <ul class="list-inside list-disc ml-2">
                                <li
                                    v-for="example in time_format_examples"
                                    v-bind:key="example.value"
                                >
                                    <code class="bg-(--ui-bg-accented) px-1 rounded">{{
                                        example.value
                                    }}</code>
                                    - {{ example.label }}
                                </li>
                            </ul>
                            <p>
                                <UButton
                                    v-bind:variant="'link'"
                                    v-on:click="
                                        open_external(
                                            'https://docs.rs/chrono/0.4.7/chrono/format/strftime/index.html'
                                        )
                                    "
                                >
                                    {{ t('starship.modules.time.chronoStrftimeDoc') }}
                                </UButton>
                            </p>
                        </div>
                    </template>
                </UFormField>

                <UFormField
                    v-bind:label="t('starship.modules.time.displayFormat')"
                    v-bind:description="t('starship.modules.time.displayFormatDesc')"
                >
                    <UInput
                        v-bind:id="'format'"
                        v-model:model-value="state.format"
                        v-bind:placeholder="'[$time]($style) '"
                        v-bind:disabled="state.disabled"
                        v-bind:class="'font-nerd'"
                    />
                </UFormField>

                <UFormField
                    v-bind:label="t('starship.modules.time.style')"
                    v-bind:description="t('starship.modules.time.styleDesc')"
                >
                    <ColorPickerInput
                        v-bind:id="'style'"
                        v-model:modelValue="state.style"
                        v-bind:placeholder="'#eab308'"
                        v-bind:disabled="state.disabled"
                    />
                </UFormField>

                <div
                    class="flex items-center justify-between rounded-xl border border-(--ui-border) bg-(--ui-bg-accented)/30 p-4 transition-colors hover:bg-(--ui-bg-accented)/50"
                >
                    <div class="space-y-0.5">
                        <label v-bind:for="'use_12hr'" class="text-sm font-medium">
                            {{ t('starship.modules.time.use12hr') }}
                        </label>
                        <p class="text-xs text-(--ui-text-muted)">
                            {{ t('starship.modules.time.use12hrDesc') }}
                        </p>
                    </div>
                    <USwitch
                        v-bind:id="'use_12hr'"
                        v-model:model-value="state.use_12hr"
                        v-bind:disabled="state.disabled"
                    />
                </div>
            </div>
        </form>
    </StarshipLayout>
</template>
