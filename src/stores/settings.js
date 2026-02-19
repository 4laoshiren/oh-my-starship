import { defineStore } from 'pinia';
import { reactive, watch } from 'vue';
import { update_settings } from '@/services/cmds';
import { apply_theme, apply_theme_color } from '@/lib/utils';
import { Themes } from '@/types';

const use_settings_store = defineStore('settings', () => {
    const state = reactive({
        theme: 'light',
        theme_color: 'zinc',
        language: 'zh',
    });

    function init(settings) {
        state.theme = settings.theme;
        state.theme_color = settings.themeColor;
        state.language = settings.language;
    }

    async function update_setting(key, value) {
        state[key] = value;
        await update_settings({
            theme: state.theme,
            themeColor: state.theme_color,
            language: state.language,
        });
    }

    watch(
        () => state.theme,
        (theme) => {
            apply_theme(theme !== Themes.System ? theme : 'light');
        }
    );

    watch(
        () => state.theme_color,
        (color) => {
            apply_theme_color(color);
        }
    );

    return { state, init, update_setting };
});

export { use_settings_store };
