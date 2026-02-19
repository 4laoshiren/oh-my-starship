import { createI18n } from 'vue-i18n';

import en from './locales/en.json';
import zh from './locales/zh.json';
import zhTW from './locales/zh-TW.json';

const i18n = createI18n({
    legacy: false,
    locale: localStorage.getItem('language') || 'zh',
    fallbackLocale: 'en',
    messages: {
        en,
        zh,
        'zh-TW': zhTW,
    },
});

export { i18n };
