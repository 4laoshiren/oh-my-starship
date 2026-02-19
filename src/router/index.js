import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            component: () => import('@/views/HomeView.vue'),
            children: [
                {
                    path: '',
                    redirect: '/starship/presets',
                },
                {
                    path: 'starship/presets',
                    component: () => import('@/views/starship/PresetSelector.vue'),
                },
                {
                    path: 'starship/modules/character',
                    component: () => import('@/views/starship/modules/CharacterModule.vue'),
                },
                {
                    path: 'starship/modules/directory',
                    component: () => import('@/views/starship/modules/DirectoryModule.vue'),
                },
                {
                    path: 'starship/modules/git',
                    component: () => import('@/views/starship/modules/GitModule.vue'),
                },
                {
                    path: 'starship/modules/time',
                    component: () => import('@/views/starship/modules/TimeModule.vue'),
                },
                {
                    path: 'starship/modules/languages',
                    component: () => import('@/views/starship/modules/LanguageModules.vue'),
                },
                {
                    path: 'starship/toml',
                    component: () => import('@/views/starship/TomlEditor.vue'),
                },
                {
                    path: 'config-list',
                    component: () => import('@/views/ConfigListView.vue'),
                },
                {
                    path: 'settings',
                    component: () => import('@/views/SettingsView.vue'),
                },
            ],
        },
    ],
});

export { router };
