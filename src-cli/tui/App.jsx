import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';

import { getStarshipTomlPath } from '../utils/paths.js';
import { loadInitialSettings, persistSettings } from '../utils/settings-service.js';
import { LayoutEditor } from './components/PromptItemsEditor.jsx';
import { MainMenu } from './components/MainMenu.jsx';
import { MapEditor } from './components/MapEditor.jsx';
import { ModuleEditor } from './components/ModuleEditor.jsx';
import { PromptItemEditor } from './components/PromptItemEditor.jsx';
import { StatusPreview } from './components/StatusPreview.jsx';

const SCREENS = {
    MAIN: 'main',
    LAYOUT: 'layout',
    MODULE_EDITOR: 'module-editor',
    MAP_EDITOR: 'map-editor',
    PROMPT_ITEM_EDITOR: 'prompt-item-editor',
};

function App() {
    const { exit } = useApp();
    const [settings, setSettings] = useState(() => loadInitialSettings());
    const [previewState, setPreviewState] = useState(null);
    const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(settings));
    const [screen, setScreen] = useState(SCREENS.MAIN);
    const [selectedModule, setSelectedModule] = useState('hostname');
    const [selectedMapField, setSelectedMapField] = useState(null);
    const [layoutSelection, setLayoutSelection] = useState({
        mode: 'lines',
        lineIndex: 0,
        rowIndex: 0,
    });
    const [selectedPromptItem, setSelectedPromptItem] = useState({
        lineIndex: 0,
        itemIndex: 0,
    });
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

    const updateSettings = useCallback((nextSettings) => {
        setSettings(nextSettings);
        setPreviewState(null);
        setFlash({ color: 'yellow', text: 'Preview updated. Save with Ctrl+S.' });
    }, []);

    const updatePreviewState = useCallback((nextPreviewState) => {
        setPreviewState(nextPreviewState);
    }, []);

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

    function openModuleEditor(moduleKey) {
        if (!moduleKey) {
            return;
        }

        setSelectedModule(moduleKey);
        setScreen(SCREENS.MODULE_EDITOR);
    }

    function openPromptItemEditor(lineIndex, itemIndex) {
        setSelectedPromptItem({
            lineIndex,
            itemIndex,
        });
        setScreen(SCREENS.PROMPT_ITEM_EDITOR);
    }

    function renderScreen() {
        if (screen === SCREENS.LAYOUT) {
            return (
                <LayoutEditor
                    settings={settings}
                    onChange={updateSettings}
                    onPreviewChange={updatePreviewState}
                    initialSelection={layoutSelection}
                    onSelectionChange={setLayoutSelection}
                    onEditModule={openModuleEditor}
                    onEditPromptItem={({ lineIndex, itemIndex }) =>
                        openPromptItemEditor(lineIndex, itemIndex)
                    }
                    onBack={() => setScreen(SCREENS.MAIN)}
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
                    onBack={() => setScreen(SCREENS.LAYOUT)}
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

        if (screen === SCREENS.PROMPT_ITEM_EDITOR) {
            return (
                <PromptItemEditor
                    settings={settings}
                    lineIndex={selectedPromptItem.lineIndex}
                    itemIndex={selectedPromptItem.itemIndex}
                    onBack={() => setScreen(SCREENS.LAYOUT)}
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
            <StatusPreview
                settings={previewState?.settings || settings}
                fastMode={Boolean(previewState?.fastMode)}
                dirty={dirty}
                terminalWidth={terminalWidth}
            />
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
