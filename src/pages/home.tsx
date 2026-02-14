import { NavLink, useLocation, useOutlet } from 'react-router-dom';
// useOutlet is used to solve the exit animation issue when using <Outlet> with <AnimatePresence>
// solution is simply replacing <Outlet> with useOutlet()
// see https://medium.com/@antonio.falcescu/animating-react-pages-with-react-router-dom-outlet-and-framer-motion-animatepresence-bd5438b3433b
// 9 Navlinks overall. Each Navlink contains a lucide-react icon and a text
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
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';

export function Home() {
    const { t } = useTranslation();
    const location = useLocation();

    return (
        <div className="flex h-full home-no-scrollbar">
            <aside className="w-48 border-r border-border bg-card p-4">
                <h1 className="mb-6 text-lg font-semibold tracking-tight">{t('nav.title')}</h1>
                <nav className="space-y-1">
                    <NavLink
                        to="/starship/presets"
                        end
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-primary/10 text-primary shadow-sm'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )
                        }
                    >
                        <Palette className="h-4 w-4" />
                        {t('starship.tabs.presets')}
                    </NavLink>
                    <NavLink
                        to="/starship/modules/character"
                        end
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-primary/10 text-primary shadow-sm'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )
                        }
                    >
                        <Terminal className="h-4 w-4" />
                        {t('starship.modules.character.name')}
                    </NavLink>
                    <NavLink
                        to="/starship/modules/directory"
                        end
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-primary/10 text-primary shadow-sm'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )
                        }
                    >
                        <FolderOpen className="h-4 w-4" />
                        {t('starship.modules.directory.name')}
                    </NavLink>
                    <NavLink
                        to="/starship/modules/git"
                        end
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-primary/10 text-primary shadow-sm'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )
                        }
                    >
                        <GitBranch className="h-4 w-4" />
                        {t('starship.modules.git.name')}
                    </NavLink>
                    <NavLink
                        to="/starship/modules/time"
                        end
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-primary/10 text-primary shadow-sm'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )
                        }
                    >
                        <Clock className="h-4 w-4" />
                        {t('starship.modules.time.name')}
                    </NavLink>
                    <NavLink
                        to="/starship/modules/languages"
                        end
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-primary/10 text-primary shadow-sm'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )
                        }
                    >
                        <Code className="h-4 w-4" />
                        {t('starship.modules.techStack.name')}
                    </NavLink>
                    <NavLink
                        to="/starship/toml"
                        end
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-primary/10 text-primary shadow-sm'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )
                        }
                    >
                        <FileText className="h-4 w-4" />
                        {t('starship.tabs.toml')}
                    </NavLink>
                    <NavLink
                        to="/config-list"
                        end
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-primary/10 text-primary shadow-sm'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )
                        }
                    >
                        <Archive className="h-4 w-4" />
                        {t('nav.backups')}
                    </NavLink>
                    <NavLink
                        to="/settings"
                        end
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-primary/10 text-primary shadow-sm'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )
                        }
                    >
                        <Settings className="h-4 w-4" />
                        {t('nav.settings')}
                    </NavLink>
                </nav>
            </aside>
            <main className="flex-1 overflow-auto p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="h-full pb-6 box-content"
                    >
                        {useOutlet()}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
