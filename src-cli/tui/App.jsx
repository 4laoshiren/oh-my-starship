import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';

import { getStarshipTomlPath } from '../utils/paths.js';
import { loadInitialSettings, persistSettings } from '../utils/settings-service.js';
import { LayoutEditor } from './components/PromptItemsEditor.jsx';
import { MainMenu } from './components/MainMenu.jsx';
import { MapEditor } from './components/MapEditor.jsx';
import { ModuleEditor } from './components/ModuleEditor.jsx';
import { ModuleList } from './components/ModuleList.jsx';
import { StatusPreview } from './components/StatusPreview.jsx';

const SCREENS = {
    MAIN: 'main',
    LAYOUT: 'layout',
    MODULES: 'modules',
    MODULE_EDITOR: 'module-editor',
    MAP_EDITOR: 'map-editor',
};

function App() {
    const { exit } = useApp();
    const [settings, setSettings] = useState(() => loadInitialSettings());
    const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(settings));
    const [screen, setScreen] = useState(SCREENS.MAIN);
    const [selectedModule, setSelectedModule] = useState('hostname');
    const [selectedMapField, setSelectedMapField] = useState(null);
    const [terminalWidth, setTerminalWidth] = useState(process.stdout.columns || 120);
    const [terminalHeight, setTerminalHeight] = useState(process.stdout.rows || 40);
    const [flash, setFlash] = useState({ color: 'green', text: 'Ready' });
    const interactive = Boolean(process.stdin.isTTY && process.stdin.setRawMode);
    const dirty = useMemo(
        () => JSON.stringify(settings) !== savedSnapshot,
        [savedSnapshot, settings]
    );

    useEffect(() => {
        const onResize = () => {
            setTerminalWidth(process.stdout.columns || 120);
            setTerminalHeight(process.stdout.rows || 40);
        };

        process.stdout.on('resize', onResize);
        return () => {
            process.stdout.off('resize', onResize);
        };
    }, []);

    useInput(
        (input, key) => {
            if (key.ctrl && input === 'c') {
                exit();
                return;
            }

            if (key.ctrl && input === 's') {
                saveCurrentSettings();
            }
        },
        { isActive: interactive }
    );

    function updateSettings(nextSettings) {
        setSettings(nextSettings);
        setFlash({ color: 'yellow', text: 'Preview updated. Save with Ctrl+S.' });
    }

    function reloadSettings() {
        const next = loadInitialSettings();
        setSettings(next);
        setSavedSnapshot(JSON.stringify(next));
        setFlash({ color: 'green', text: 'Reloaded from starship.toml' });
    }

    function saveCurrentSettings() {
        try {
            persistSettings(settings);
            setSavedSnapshot(JSON.stringify(settings));
            setFlash({ color: 'green', text: `Saved to ${getStarshipTomlPath()}` });
        } catch (error) {
            setFlash({
                color: 'red',
                text: error instanceof Error ? error.message : 'Save failed',
            });
        }
    }

    function handleMainSelect(action) {
        if (action === 'layout') {
            setScreen(SCREENS.LAYOUT);
            return;
        }
        if (action === 'modules') {
            setScreen(SCREENS.MODULES);
            return;
        }
        if (action === 'save') {
            saveCurrentSettings();
            return;
        }
        if (action === 'reload') {
            reloadSettings();
            return;
        }
        if (action === 'exit') {
            exit();
        }
    }

    function renderScreen() {
        if (screen === SCREENS.LAYOUT) {
            return (
                <LayoutEditor
                    settings={settings}
                    onChange={updateSettings}
                    onBack={() => setScreen(SCREENS.MAIN)}
                    interactive={interactive}
                    terminalHeight={terminalHeight}
                />
            );
        }

        if (screen === SCREENS.MODULES) {
            return (
                <ModuleList
                    settings={settings}
                    onBack={() => setScreen(SCREENS.MAIN)}
                    onSelect={(moduleKey) => {
                        if (!moduleKey) {
                            return;
                        }
                        setSelectedModule(moduleKey);
                        setScreen(SCREENS.MODULE_EDITOR);
                    }}
                    interactive={interactive}
                    terminalHeight={terminalHeight}
                />
            );
        }

        if (screen === SCREENS.MODULE_EDITOR) {
            return (
                <ModuleEditor
                    settings={settings}
                    moduleKey={selectedModule}
                    onBack={() => setScreen(SCREENS.MODULES)}
                    onChange={updateSettings}
                    onOpenMap={(moduleKey, fieldKey) => {
                        setSelectedModule(moduleKey);
                        setSelectedMapField(fieldKey);
                        setScreen(SCREENS.MAP_EDITOR);
                    }}
                    interactive={interactive}
                    terminalHeight={terminalHeight}
                />
            );
        }

        if (screen === SCREENS.MAP_EDITOR) {
            return (
                <MapEditor
                    settings={settings}
                    moduleKey={selectedModule}
                    fieldKey={selectedMapField}
                    onBack={() => setScreen(SCREENS.MODULE_EDITOR)}
                    onChange={updateSettings}
                    interactive={interactive}
                    terminalHeight={terminalHeight}
                />
            );
        }

        return <MainMenu dirty={dirty} onSelect={handleMainSelect} interactive={interactive} />;
    }

    return (
        <Box flexDirection="column">
            <StatusPreview settings={settings} dirty={dirty} terminalWidth={terminalWidth} />
            <Box marginTop={1}>
                <Text color={flash.color}>{flash.text}</Text>
                <Text dimColor>{`  Config: ${getStarshipTomlPath()}`}</Text>
            </Box>
            {!interactive && (
                <Text color="yellow">
                    Non-interactive terminal detected. Keyboard input is disabled.
                </Text>
            )}
            <Box marginTop={1}>{renderScreen()}</Box>
        </Box>
    );
}

export { App };
