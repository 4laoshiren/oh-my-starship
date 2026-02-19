<script setup>
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
    Clock,
    Code,
    FileText,
    FolderOpen,
    GitBranch,
    Palette,
    Archive,
    Settings,
    Terminal,
} from 'lucide-vue-next';
import { cn } from '@/lib/utils';

const route = useRoute();
const { t } = useI18n();

const nav_items = [
    { to: '/starship/presets', icon: Palette, label: () => t('starship.tabs.presets') },
    {
        to: '/starship/modules/character',
        icon: Terminal,
        label: () => t('starship.modules.character.name'),
    },
    {
        to: '/starship/modules/directory',
        icon: FolderOpen,
        label: () => t('starship.modules.directory.name'),
    },
    { to: '/starship/modules/git', icon: GitBranch, label: () => t('starship.modules.git.name') },
    { to: '/starship/modules/time', icon: Clock, label: () => t('starship.modules.time.name') },
    {
        to: '/starship/modules/languages',
        icon: Code,
        label: () => t('starship.modules.techStack.name'),
    },
    { to: '/starship/toml', icon: FileText, label: () => t('starship.tabs.toml') },
    { to: '/config-list', icon: Archive, label: () => t('nav.backups') },
    { to: '/settings', icon: Settings, label: () => t('nav.settings') },
];
</script>

<template>
    <div class="flex h-full home-no-scrollbar">
        <aside class="w-48 border-r border-border bg-card p-4">
            <h1 class="mb-6 text-lg font-semibold tracking-tight">{{ t('nav.title') }}</h1>
            <nav class="space-y-1">
                <RouterLink
                    v-for="item in nav_items"
                    v-bind:key="item.to"
                    v-bind:to="item.to"
                    v-bind:class="
                        cn(
                            'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                            route.path === item.to
                                ? 'bg-primary/10 text-primary shadow-sm'
                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        )
                    "
                >
                    <component v-bind:is="item.icon" class="h-4 w-4" />
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
