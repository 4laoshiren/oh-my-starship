import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';

import App from './App.vue';
import { router } from '@/router/index.js';
import { i18n } from '@/i18n/index.js';
import { use_settings_store } from '@/stores/settings.js';
import { get_settings } from '@/services/cmds';
import { apply_theme, apply_theme_color } from '@/lib/utils';
import { Themes, ThemeColors } from '@/types';

const query_client = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: false,
        },
    },
});

async function bootstrap() {
    const settings = await get_settings();
    apply_theme(settings.theme !== Themes.System ? settings.theme : 'light');
    apply_theme_color(settings.themeColor ?? ThemeColors.Zinc);

    const app = createApp(App);
    const pinia = createPinia();

    app.use(pinia);
    app.use(router);
    app.use(i18n);
    app.use(VueQueryPlugin, { queryClient: query_client });

    const settings_store = use_settings_store();
    settings_store.init(settings);

    app.mount('#app');
}

bootstrap();
