<script setup>
import { useI18n } from 'vue-i18n';
import { use_settings_store } from '@/stores/settings';
import { Themes, ThemeColors } from '@/types';

const { t, locale } = useI18n();
const settings_store = use_settings_store();

const theme_color_display_colors = {
    zinc: '#27272a',
    slate: '#64748b',
    red: '#dc2626',
    rose: '#e11d48',
    orange: '#f97316',
    green: '#16a34a',
    blue: '#2563eb',
    yellow: '#eab308',
    violet: '#7c3aed',
};

const theme_options = [
    { value: Themes.Light, label_key: 'settings.themes.light', icon: 'i-lucide-sun' },
    { value: Themes.Dark, label_key: 'settings.themes.dark', icon: 'i-lucide-moon' },
    { value: Themes.System, label_key: 'settings.themes.system', icon: 'i-lucide-monitor' },
];

const theme_color_options = [
    { value: ThemeColors.Zinc, label_key: 'settings.themeColors.zinc' },
    { value: ThemeColors.Slate, label_key: 'settings.themeColors.slate' },
    { value: ThemeColors.Red, label_key: 'settings.themeColors.red' },
    { value: ThemeColors.Rose, label_key: 'settings.themeColors.rose' },
    { value: ThemeColors.Orange, label_key: 'settings.themeColors.orange' },
    { value: ThemeColors.Green, label_key: 'settings.themeColors.green' },
    { value: ThemeColors.Blue, label_key: 'settings.themeColors.blue' },
    { value: ThemeColors.Yellow, label_key: 'settings.themeColors.yellow' },
    { value: ThemeColors.Violet, label_key: 'settings.themeColors.violet' },
];

const language_options = [
    { value: 'en', label_key: 'settings.languages.en' },
    { value: 'zh-TW', label_key: 'settings.languages.zh-TW' },
    { value: 'zh', label_key: 'settings.languages.zh' },
];

function handle_language_change(lng) {
    locale.value = lng;
    localStorage.setItem('language', lng);
}
</script>

<template>
    <div class="space-y-6">
        <h2 class="text-xl font-semibold">{{ t('settings.title') }}</h2>

        <div class="space-y-4">
            <div>
                <label class="text-sm font-medium">{{ t('settings.theme') }}</label>
                <div class="mt-3 flex gap-2">
                    <UButton
                        v-for="option in theme_options"
                        v-bind:key="option.value"
                        v-bind:variant="
                            settings_store.state.theme === option.value ? 'solid' : 'outline'
                        "
                        v-bind:icon="option.icon"
                        v-on:click="settings_store.update_setting('theme', option.value)"
                    >
                        {{ t(option.label_key) }}
                    </UButton>
                </div>
            </div>

            <div>
                <label class="text-sm font-medium">{{ t('settings.themeColor') }}</label>
                <div class="mt-3 grid grid-cols-4 gap-2.5 sm:grid-cols-6 md:grid-cols-9">
                    <button
                        v-for="option in theme_color_options"
                        v-bind:key="option.value"
                        v-on:click="settings_store.update_setting('theme_color', option.value)"
                        v-bind:class="[
                            'group flex cursor-pointer flex-col items-center gap-2 rounded-xl border bg-(--ui-bg-elevated) p-2.5 transition-all duration-200',
                            settings_store.state.theme_color === option.value
                                ? 'border-(--ui-primary)/50 ring-2 ring-(--ui-primary)/20 shadow-sm'
                                : 'border-(--ui-border) hover:border-(--ui-primary)/30 hover:shadow-sm active:scale-[0.98]',
                        ]"
                        v-bind:title="t(option.label_key)"
                    >
                        <div
                            v-bind:class="[
                                'relative flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-transform duration-200',
                                settings_store.state.theme_color !== option.value &&
                                    'group-hover:scale-110',
                            ]"
                            v-bind:style="{
                                backgroundColor: theme_color_display_colors[option.value],
                            }"
                        >
                            <UIcon
                                v-if="settings_store.state.theme_color === option.value"
                                v-bind:name="'i-lucide-check'"
                                class="h-4 w-4 text-white drop-shadow-sm"
                            />
                        </div>
                        <span
                            v-bind:class="[
                                'text-xs transition-colors',
                                settings_store.state.theme_color === option.value
                                    ? 'font-medium text-(--ui-text)'
                                    : 'text-(--ui-text-muted)',
                            ]"
                        >
                            {{ t(option.label_key) }}
                        </span>
                    </button>
                </div>
            </div>

            <div>
                <label class="text-sm font-medium">{{ t('settings.language') }}</label>
                <div class="mt-3 flex gap-2">
                    <UButton
                        v-for="option in language_options"
                        v-bind:key="option.value"
                        v-bind:variant="locale === option.value ? 'solid' : 'outline'"
                        v-bind:icon="'i-lucide-languages'"
                        v-on:click="handle_language_change(option.value)"
                    >
                        {{ t(option.label_key) }}
                    </UButton>
                </div>
            </div>
        </div>
    </div>
</template>
