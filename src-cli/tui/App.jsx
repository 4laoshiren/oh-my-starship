import React, { useMemo, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';

import { MainMenu } from './components/MainMenu.jsx';
import { ModuleEditor } from './components/ModuleEditor.jsx';
import { PromptItemsEditor } from './components/PromptItemsEditor.jsx';
import { SeparatorEditor } from './components/SeparatorEditor.jsx';
import { StatusPreview } from './components/StatusPreview.jsx';
import { loadInitialSettings, persistSettings } from '../utils/settings-service.js';

const MODULE_FIELD_MAP = {
    character: [
        { key: 'success_symbol', label: 'success_symbol', type: 'string' },
        { key: 'error_symbol', label: 'error_symbol', type: 'string' },
        { key: 'disabled', label: 'disabled', type: 'boolean' },
    ],
    directory: [
        { key: 'truncation_length', label: 'truncation_length', type: 'number' },
        { key: 'truncation_symbol', label: 'truncation_symbol', type: 'string' },
        { key: 'style', label: 'style', type: 'string' },
        { key: 'disabled', label: 'disabled', type: 'boolean' },
    ],
    git_branch: [
        { key: 'symbol', label: 'symbol', type: 'string' },
        { key: 'style', label: 'style', type: 'string' },
        { key: 'disabled', label: 'disabled', type: 'boolean' },
    ],
    git_status: [
        { key: 'style', label: 'style', type: 'string' },
        { key: 'ahead', label: 'ahead', type: 'string' },
        { key: 'behind', label: 'behind', type: 'string' },
        { key: 'modified', label: 'modified', type: 'string' },
        { key: 'staged', label: 'staged', type: 'string' },
        { key: 'deleted', label: 'deleted', type: 'string' },
        { key: 'untracked', label: 'untracked', type: 'string' },
        { key: 'disabled', label: 'disabled', type: 'boolean' },
    ],
    time: [
        { key: 'time_format', label: 'time_format', type: 'string' },
        { key: 'style', label: 'style', type: 'string' },
        { key: 'use_12hr', label: 'use_12hr', type: 'boolean' },
        { key: 'disabled', label: 'disabled', type: 'boolean' },
    ],
};

export function App() {
    const { exit } = useApp();
    const [settings, setSettings] = useState(() => loadInitialSettings());
    const [screen, setScreen] = useState('main');
    const [dirty, setDirty] = useState(false);
    const interactive = Boolean(process.stdin.isTTY && process.stdin.setRawMode);
    const [statusMessage, setStatusMessage] = useState({
        color: 'green',
        text: 'Ready',
    });

    const activeModule = useMemo(() => {
        if (!Object.hasOwn(MODULE_FIELD_MAP, screen)) {
            return null;
        }
        return screen;
    }, [screen]);

    useInput(
        (input, key) => {
            if (key.ctrl && input === 'c') {
                exit();
                return;
            }

            if (key.ctrl && input === 's') {
                safeSave(settings, {
                    onSuccess: () => {
                        setDirty(false);
                        setStatusMessage({
                            color: 'green',
                            text: 'Saved to ~/.config/starship.toml',
                        });
                    },
                    onError: (error) => {
                        setStatusMessage({ color: 'red', text: `Save failed: ${error.message}` });
                    },
                });
            }
        },
        { isActive: interactive }
    );

    const updateSettings = (nextSettings) => {
        setSettings(nextSettings);
        setDirty(true);
    };

    const handleMainSelect = (action) => {
        if (action === 'prompt-items') {
            setScreen('prompt-items');
            return;
        }

        if (action === 'separator-presets') {
            setScreen('separator-presets');
            return;
        }

        if (action === 'save') {
            safeSave(settings, {
                onSuccess: () => {
                    setDirty(false);
                    setStatusMessage({ color: 'green', text: 'Saved to ~/.config/starship.toml' });
                },
                onError: (error) => {
                    setStatusMessage({ color: 'red', text: `Save failed: ${error.message}` });
                },
            });
            return;
        }

        if (action === 'save-exit') {
            safeSave(settings, {
                onSuccess: () => {
                    exit();
                },
                onError: (error) => {
                    setStatusMessage({ color: 'red', text: `Save failed: ${error.message}` });
                },
            });
            return;
        }

        if (action === 'exit') {
            exit();
            return;
        }

        if (Object.hasOwn(MODULE_FIELD_MAP, action)) {
            setScreen(action);
        }
    };

    const renderBody = () => {
        if (screen === 'main') {
            return <MainMenu onSelect={handleMainSelect} interactive={interactive} />;
        }

        if (screen === 'prompt-items') {
            return (
                <PromptItemsEditor
                    settings={settings}
                    onChange={updateSettings}
                    onBack={() => setScreen('main')}
                    interactive={interactive}
                />
            );
        }

        if (screen === 'separator-presets') {
            return (
                <SeparatorEditor
                    settings={settings}
                    onChange={updateSettings}
                    onBack={() => setScreen('main')}
                    interactive={interactive}
                />
            );
        }

        if (activeModule) {
            return (
                <ModuleEditor
                    moduleKey={activeModule}
                    moduleConfig={settings.modules[activeModule]}
                    fields={MODULE_FIELD_MAP[activeModule]}
                    onChange={(updatedModule) => {
                        updateSettings({
                            ...settings,
                            modules: {
                                ...settings.modules,
                                [activeModule]: updatedModule,
                            },
                        });
                    }}
                    onBack={() => setScreen('main')}
                    interactive={interactive}
                />
            );
        }

        return (
            <Box flexDirection="column">
                <Text color="red">Unknown screen: {screen}</Text>
                <Text dimColor>Press Ctrl+C to quit.</Text>
            </Box>
        );
    };

    return (
        <Box flexDirection="column">
            <StatusPreview settings={settings} dirty={dirty} />
            <Box marginTop={1}>
                <Text color={statusMessage.color}>{statusMessage.text}</Text>
            </Box>
            {!interactive && (
                <Box marginTop={1}>
                    <Text color="yellow">
                        Non-interactive terminal detected. Keyboard input is disabled.
                    </Text>
                </Box>
            )}
            <Box marginTop={1} flexDirection="column">
                {renderBody()}
            </Box>
        </Box>
    );
}

function safeSave(settings, { onSuccess, onError }) {
    try {
        persistSettings(settings);
        onSuccess();
    } catch (error) {
        if (error instanceof Error) {
            onError(error);
            return;
        }
        onError(new Error('Unknown save error'));
    }
}
