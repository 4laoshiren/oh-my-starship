import { createMemoryRouter, type RouteObject } from 'react-router-dom';

import { Home } from '@/pages/home';
import { ConfigList } from '@/pages/config-list';
import { StarshipLayout } from '@/pages/starship';
import { PresetSelector } from '@/pages/starship/preset-selector';
import { TomlEditor } from '@/pages/starship/toml-editor';
import { CharacterModule } from '@/pages/starship/modules/character-module';
import { DirectoryModule } from '@/pages/starship/modules/directory-module';
import { GitModule } from '@/pages/starship/modules/git-module';
import { TimeModule } from '@/pages/starship/modules/time-module';
import { LanguageModules } from '@/pages/starship/modules/language-modules';

const routes: RouteObject[] = [
    {
        path: '/',
        element: <Home />,
        children: [
            {
                path: 'starship/presets',
                element: (
                    <StarshipLayout>
                        <PresetSelector />
                    </StarshipLayout>
                ),
            },
            {
                path: 'config-list',
                element: (
                    <StarshipLayout>
                        <ConfigList />
                    </StarshipLayout>
                ),
            },
            {
                path: 'starship/modules/character',
                element: (
                    <StarshipLayout>
                        <CharacterModule />
                    </StarshipLayout>
                ),
            },
            {
                path: 'starship/modules/directory',
                element: (
                    <StarshipLayout>
                        <DirectoryModule />
                    </StarshipLayout>
                ),
            },
            {
                path: 'starship/modules/git',
                element: (
                    <StarshipLayout>
                        <GitModule />
                    </StarshipLayout>
                ),
            },
            {
                path: 'starship/modules/time',
                element: (
                    <StarshipLayout>
                        <TimeModule />
                    </StarshipLayout>
                ),
            },
            {
                path: 'starship/modules/languages',
                element: (
                    <StarshipLayout>
                        <LanguageModules />
                    </StarshipLayout>
                ),
            },
            {
                path: 'starship/toml',
                element: (
                    <StarshipLayout>
                        <TomlEditor />
                    </StarshipLayout>
                ),
            },
            {
                path: 'settings',
                lazy: () => import('@/pages/settings'),
            },
        ],
    },
];

export const router = createMemoryRouter(routes, {
    initialEntries: ['/starship/presets'],
});
