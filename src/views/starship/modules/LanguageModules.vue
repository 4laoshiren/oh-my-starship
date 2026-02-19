<script setup>
import { reactive, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ColorPickerInput from '@/components/ui/ColorPickerInput.vue';
import StarshipLayout from '@/views/starship/StarshipLayout.vue';
import { use_starship_toml, use_save_starship_toml } from '@/composables/use-starship';
import { parse_toml_section, update_toml_section } from '@/lib/toml-utils';

const { t } = useI18n();
const toast = useToast();
const { data: toml, isLoading: is_loading } = use_starship_toml();
const { mutate: save_toml, isPending: is_pending } = use_save_starship_toml();

const languages = [
    {
        id: 'nodejs',
        name: 'Node.js',
        section_name: 'nodejs',
        defaults: {
            symbol: ' ',
            style: '#22c55e',
            format: '[$symbol($version )]($style)',
            version_format: 'v${raw}',
            disabled: false,
        },
    },
    {
        id: 'python',
        name: 'Python',
        section_name: 'python',
        defaults: {
            symbol: '🐍 ',
            style: '#eab308',
            format: '[$symbol$pyenv_prefix($version )(\($virtualenv\) )]($style)',
            version_format: 'v${raw}',
            disabled: false,
        },
    },
    {
        id: 'rust',
        name: 'Rust',
        section_name: 'rust',
        defaults: {
            symbol: '🦀 ',
            style: '#ef4444',
            format: '[$symbol($version )]($style)',
            version_format: 'v${raw}',
            disabled: false,
        },
    },
    {
        id: 'golang',
        name: 'Go',
        section_name: 'golang',
        defaults: {
            symbol: '🐹 ',
            style: '#06b6d4',
            format: '[$symbol($version )]($style)',
            version_format: 'v${raw}',
            disabled: false,
        },
    },
    {
        id: 'java',
        name: 'Java',
        section_name: 'java',
        defaults: {
            symbol: '☕ ',
            style: '#ef4444',
            format: '[$symbol($version )]($style)',
            version_format: 'v${raw}',
            disabled: false,
        },
    },
    {
        id: 'php',
        name: 'PHP',
        section_name: 'php',
        defaults: {
            symbol: '🐘 ',
            style: '#a855f7',
            format: '[$symbol($version )]($style)',
            version_format: 'v${raw}',
            disabled: false,
        },
    },
    {
        id: 'ruby',
        name: 'Ruby',
        section_name: 'ruby',
        defaults: {
            symbol: '💎 ',
            style: '#ef4444',
            format: '[$symbol($version )]($style)',
            version_format: 'v${raw}',
            disabled: false,
        },
    },
    {
        id: 'docker_context',
        name: 'Docker',
        section_name: 'docker_context',
        defaults: {
            symbol: '🐳 ',
            style: '#3b82f6',
            format: '[$symbol$context]($style) ',
            version_format: 'v${raw}',
            disabled: false,
        },
    },
];

const state = reactive({
    selected_lang: languages[0].id,
    symbol: '',
    style: '',
    format: '',
    version_format: '',
    disabled: false,
});

const current_lang = computed(
    () => languages.find((l) => l.id === state.selected_lang) || languages[0]
);

watch(
    [toml, () => state.selected_lang],
    () => {
        if (toml.value && current_lang.value) {
            const section = parse_toml_section(toml.value, current_lang.value.section_name);
            const merged = { ...current_lang.value.defaults, ...section };
            state.symbol = merged.symbol;
            state.style = merged.style;
            state.format = merged.format;
            state.version_format = merged.version_format;
            state.disabled = merged.disabled;
        }
    },
    { immediate: true }
);

function on_submit() {
    if (!toml.value || !current_lang.value) return;
    const data = {
        symbol: state.symbol,
        style: state.style,
        format: state.format,
        version_format: state.version_format,
        disabled: state.disabled,
    };
    const updated_toml = update_toml_section(toml.value, current_lang.value.section_name, data);
    save_toml(updated_toml, {
        onSuccess: () =>
            toast.add({
                title: t('starship.modules.techStack.saveSuccess', {
                    name: current_lang.value.name,
                }),
                color: 'success',
            }),
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

        <div v-else class="space-y-6">
            <div class="flex gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 class="text-lg font-medium">
                        {{ t('starship.modules.techStack.title') }}
                    </h3>
                    <p class="text-sm text-(--ui-text-muted)">
                        {{ t('starship.modules.techStack.subtitle') }}
                    </p>
                </div>
                <UButton v-on:click="on_submit" v-bind:disabled="is_pending" class="sm:self-start">
                    {{
                        is_pending
                            ? t('common.saving')
                            : t('starship.modules.techStack.saveButton', {
                                  name: current_lang.name,
                              })
                    }}
                </UButton>
            </div>

            <div class="flex flex-wrap gap-2">
                <button
                    v-for="lang in languages"
                    v-bind:key="lang.id"
                    type="button"
                    v-on:click="state.selected_lang = lang.id"
                    v-bind:class="[
                        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        state.selected_lang === lang.id
                            ? 'bg-(--ui-primary) text-(--ui-bg)'
                            : 'bg-(--ui-bg-accented) hover:bg-(--ui-bg-accented)/80',
                    ]"
                >
                    {{ lang.name }}
                </button>
            </div>

            <form v-on:submit.prevent="on_submit" class="space-y-4">
                <div
                    class="flex items-center justify-between rounded-xl border border-(--ui-border) bg-(--ui-bg-accented)/30 p-4 transition-colors hover:bg-(--ui-bg-accented)/50"
                >
                    <div class="space-y-0.5">
                        <label v-bind:for="'disabled'" class="text-sm font-medium">
                            {{
                                t('starship.modules.techStack.disable', {
                                    name: current_lang.name,
                                })
                            }}
                        </label>
                        <p class="text-xs text-(--ui-text-muted)">
                            {{
                                t('starship.modules.techStack.disableDesc', {
                                    name: current_lang.name,
                                })
                            }}
                        </p>
                    </div>
                    <USwitch v-bind:id="'disabled'" v-model:model-value="state.disabled" />
                </div>

                <div class="grid gap-4">
                    <UFormField
                        v-bind:label="t('starship.modules.techStack.symbol')"
                        v-bind:description="t('starship.modules.techStack.symbolDesc')"
                    >
                        <UInput
                            v-bind:id="'symbol'"
                            v-model:model-value="state.symbol"
                            v-bind:placeholder="current_lang.defaults.symbol"
                            v-bind:disabled="state.disabled"
                            v-bind:class="'font-nerd'"
                        />
                    </UFormField>

                    <UFormField
                        v-bind:label="t('starship.modules.techStack.style')"
                        v-bind:description="t('starship.modules.techStack.styleDesc')"
                    >
                        <ColorPickerInput
                            v-bind:id="'style'"
                            v-model:modelValue="state.style"
                            v-bind:placeholder="current_lang.defaults.style"
                            v-bind:disabled="state.disabled"
                        />
                    </UFormField>

                    <UFormField
                        v-bind:label="t('starship.modules.techStack.format')"
                        v-bind:description="t('starship.modules.techStack.formatDesc')"
                    >
                        <UInput
                            v-bind:id="'format'"
                            v-model:model-value="state.format"
                            v-bind:placeholder="current_lang.defaults.format"
                            v-bind:disabled="state.disabled"
                        />
                    </UFormField>

                    <UFormField
                        v-bind:label="t('starship.modules.techStack.versionFormat')"
                        v-bind:description="t('starship.modules.techStack.versionFormatDesc')"
                    >
                        <UInput
                            v-bind:id="'version_format'"
                            v-model:model-value="state.version_format"
                            v-bind:placeholder="'v${raw}'"
                            v-bind:disabled="state.disabled"
                        />
                    </UFormField>
                </div>
            </form>
        </div>
    </StarshipLayout>
</template>
