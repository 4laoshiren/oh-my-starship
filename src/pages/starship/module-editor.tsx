// Legacy issue: Originally, character\directory\git\time\languages were all written in one navlink in home.tsx, named module-editor
// Now the navlinks are separated, but the module-editor component is still retained as a unified abstraction for these five navlinks
// 历史遗留问题：原本character\directory\git\time\languages全部写在home.tsx上的一个navlink里，就名为module-editor
// 现在将这些navlink分开，但仍然保留module-editor这个组件，作为这五个navlink的统一抽象
import { useState } from 'react';
import { ChevronRight, Terminal, FolderOpen, GitBranch, Clock, Code } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { CharacterModule } from './modules/character-module';
import { DirectoryModule } from './modules/directory-module';
import { GitModule } from './modules/git-module';
import { TimeModule } from './modules/time-module';
import { LanguageModules } from './modules/language-modules';
import { cn } from '@/lib/utils';

type ModuleSection = 'character' | 'directory' | 'git' | 'time' | 'languages';

export function ModuleEditor() {
    const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState<ModuleSection>('character');

    const sections = [
        {
            id: 'character' as const,
            name: t('starship.modules.character.name'),
            icon: Terminal,
            description: t('starship.modules.character.description'),
        },
        {
            id: 'directory' as const,
            name: t('starship.modules.directory.name'),
            icon: FolderOpen,
            description: t('starship.modules.directory.description'),
        },
        {
            id: 'git' as const,
            name: t('starship.modules.git.name'),
            icon: GitBranch,
            description: t('starship.modules.git.description'),
        },
        {
            id: 'time' as const,
            name: t('starship.modules.time.name'),
            icon: Clock,
            description: t('starship.modules.time.description'),
        },
        {
            id: 'languages' as const,
            name: t('starship.modules.techStack.name'),
            icon: Code,
            description: t('starship.modules.techStack.description'),
        },
    ];

    return (
        <div className="flex h-[calc(100vh-140px)] gap-4">
            <nav className="w-56 space-y-1.5 overflow-y-auto rounded-xl border border-border bg-card p-2.5 shadow-sm">
                {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;

                    return (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={cn(
                                'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-200',
                                isActive
                                    ? 'bg-primary/10 shadow-sm'
                                    : 'hover:bg-accent/70 active:bg-accent'
                            )}
                        >
                            <div
                                className={cn(
                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                                    isActive ? 'bg-primary/15' : 'bg-muted'
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'h-4 w-4',
                                        isActive ? 'text-primary' : 'text-muted-foreground'
                                    )}
                                />
                            </div>
                            <div className="flex-1 truncate">
                                <div
                                    className={cn(
                                        'font-medium transition-colors',
                                        isActive ? 'text-primary' : 'text-foreground'
                                    )}
                                >
                                    {section.name}
                                </div>
                                <div
                                    className={cn(
                                        'text-xs transition-colors',
                                        isActive ? 'text-primary/70' : 'text-muted-foreground'
                                    )}
                                >
                                    {section.description}
                                </div>
                            </div>
                            <ChevronRight
                                className={cn(
                                    'h-4 w-4 transition-all duration-200',
                                    isActive ? 'rotate-90 text-primary' : 'text-muted-foreground'
                                )}
                            />
                        </button>
                    );
                })}
            </nav>

            <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-sm">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                        {activeSection === 'character' && <CharacterModule />}
                        {activeSection === 'directory' && <DirectoryModule />}
                        {activeSection === 'git' && <GitModule />}
                        {activeSection === 'time' && <TimeModule />}
                        {activeSection === 'languages' && <LanguageModules />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
