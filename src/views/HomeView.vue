<script setup>
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

const route = useRoute();
const { t } = useI18n();

const nav_items = [
    { to: '/starship/presets', icon: 'i-lucide-palette', label: () => t('starship.tabs.presets') },
    {
        to: '/starship/modules/character',
        icon: 'i-lucide-terminal',
        label: () => t('starship.modules.character.name'),
    },
    {
        to: '/starship/modules/directory',
        icon: 'i-lucide-folder-open',
        label: () => t('starship.modules.directory.name'),
    },
    {
        to: '/starship/modules/git',
        icon: 'i-lucide-git-branch',
        label: () => t('starship.modules.git.name'),
    },
    {
        to: '/starship/modules/time',
        icon: 'i-lucide-clock',
        label: () => t('starship.modules.time.name'),
    },
    {
        to: '/starship/modules/languages',
        icon: 'i-lucide-code',
        label: () => t('starship.modules.techStack.name'),
    },
    { to: '/starship/toml', icon: 'i-lucide-file-text', label: () => t('starship.tabs.toml') },
    { to: '/config-list', icon: 'i-lucide-archive', label: () => t('nav.backups') },
    { to: '/settings', icon: 'i-lucide-settings', label: () => t('nav.settings') },
];
</script>

<template>
    <div class="flex h-full home-no-scrollbar">
        <aside class="w-48 border-r border-(--ui-border) bg-(--ui-bg-elevated) p-4">
            <h1 class="mb-6 text-lg font-semibold tracking-tight">{{ t('nav.title') }}</h1>
            <nav class="space-y-1">
                <RouterLink
                    v-for="item in nav_items"
                    v-bind:key="item.to"
                    v-bind:to="item.to"
                    v-bind:class="[
                        `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium
                        transition-all duration-200`,
                        route.path === item.to
                            ? 'bg-(--ui-primary)/10 text-(--ui-primary) shadow-sm'
                            : `text-(--ui-text-muted) hover:bg-(--ui-bg-accented)
                                hover:text-(--ui-text)`,
                    ]"
                >
                    <UIcon v-bind:name="item.icon" class="h-4 w-4" />
                    {{ item.label() }}
                </RouterLink>
            </nav>
        </aside>
        <main class="flex-1 overflow-auto p-6">
            <RouterView v-slot="{ Component }">
                <Transition name="page" mode="out-in">
                    <component v-bind:is="Component" v-bind:key="route.path" />
                </Transition>
            </RouterView>
        </main>
    </div>
</template>

<style scoped>
.page-enter-active,
.page-leave-active {
    transition: all 0.2s ease-in-out;
}
.page-enter-from {
    opacity: 0;
    transform: translateY(10px);
}
.page-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>
