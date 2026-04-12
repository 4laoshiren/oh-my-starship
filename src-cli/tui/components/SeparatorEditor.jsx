import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';

import {
    cyclePowerlineEndCap,
    cyclePowerlineSeparator,
    cyclePowerlineStartCap,
    insertPowerlineSeparator,
    removePowerlineSeparator,
    resetPowerlineSeparators,
    togglePowerlineEnabled,
    togglePowerlineSeparatorInvert,
    updatePowerlineArrayEntry,
} from '../../utils/settings-mutations.js';
import { END_CAP_PRESETS, SEPARATOR_PRESETS, START_CAP_PRESETS } from '../../types/settings.js';

const SCREEN_MENU = 'menu';
const SCREEN_SEPARATOR = 'separator';
const SCREEN_START_CAP = 'startCap';
const SCREEN_END_CAP = 'endCap';

const SCREEN_LABELS = {
    [SCREEN_SEPARATOR]: 'Separator',
    [SCREEN_START_CAP]: 'Start Cap',
    [SCREEN_END_CAP]: 'End Cap',
};

const SEPARATOR_NAMES = {
    '': 'round right',
    '': 'triangle right',
    '': 'thin round right',
    '': 'thin triangle right',
    '': 'round left',
    '': 'triangle left',
    '': 'thin round left',
    '': 'thin triangle left',
};

const START_CAP_NAMES = {
    '': 'round',
    '': 'triangle',
    '': 'lower triangle',
    '': 'diagonal',
};

const END_CAP_NAMES = {
    '': 'round',
    '': 'triangle',
    '': 'lower triangle',
    '': 'diagonal',
};

function PowerlineFrameEditor({ settings, onChange, onBack, interactive }) {
    const [screen, setScreen] = useState(SCREEN_MENU);
    const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
    const [selectedValueIndex, setSelectedValueIndex] = useState(0);
    const [inputMode, setInputMode] = useState(null);
    const [buffer, setBuffer] = useState('');

    const setupRows = useMemo(() => buildSetupRows(settings), [settings]);
    const editorRows = useMemo(() => buildEditorRows(settings, screen), [settings, screen]);
    const safeMenuIndex = clamp(selectedMenuIndex, 0, Math.max(0, setupRows.length - 1));
    const safeValueIndex = clamp(selectedValueIndex, 0, Math.max(0, editorRows.length - 1));
    const selectedSetupRow = setupRows[safeMenuIndex];
    const selectedEditorRow = editorRows[safeValueIndex];

    useInput(
        (input, key) => {
            if (inputMode) {
                if (key.escape) {
                    resetInputMode();
                    return;
                }

                if (key.return) {
                    if (selectedEditorRow) {
                        const value =
                            selectedEditorRow.arrayKey === 'separators'
                                ? buffer || SEPARATOR_PRESETS[0] || ''
                                : buffer;
                        onChange(
                            updatePowerlineArrayEntry(
                                settings,
                                selectedEditorRow.arrayKey,
                                selectedEditorRow.slotIndex,
                                value
                            )
                        );
                    }
                    resetInputMode();
                    return;
                }

                if (key.backspace || key.delete) {
                    setBuffer((previous) => previous.slice(0, -1));
                    return;
                }

                if (input) {
                    setBuffer((previous) => previous + input);
                }
                return;
            }

            if (screen === SCREEN_MENU) {
                handleMenuInput(input, key);
                return;
            }

            handleEditorInput(input, key);
        },
        { isActive: interactive }
    );

    const helpText = useMemo(() => {
        if (inputMode) {
            return 'Editing custom glyph. Enter save  ESC cancel';
        }

        if (screen === SCREEN_MENU) {
            return '↑↓ select  Enter open  T toggle powerline  ESC back';
        }

        if (screen === SCREEN_SEPARATOR) {
            return '↑↓ select  ←→ cycle preset  A add after  I insert  D delete  T invert  E custom glyph  C reset  ESC back';
        }

        return '↑↓ select  ←→ cycle preset  E custom glyph  C clear  ESC back';
    }, [inputMode, screen]);

    const presetText =
        screen === SCREEN_SEPARATOR
            ? `Presets: ${SEPARATOR_PRESETS.map(formatVisibleGlyph).join(' ')}`
            : screen === SCREEN_START_CAP
              ? `Presets: ${['', ...START_CAP_PRESETS].map(formatVisibleGlyph).join(' ')}`
              : screen === SCREEN_END_CAP
                ? `Presets: ${['', ...END_CAP_PRESETS].map(formatVisibleGlyph).join(' ')}`
                : null;

    return (
        <Box flexDirection="column" borderStyle="round" borderColor="magenta" paddingX={1}>
            <Text bold>Powerline Frame</Text>
            <Text dimColor>
                Prompt Layout only edits content lines. All implicit frame pieces live here.
            </Text>
            <Text dimColor>{helpText}</Text>
            {inputMode && (
                <Text color="cyan">
                    glyph: {formatVisibleGlyph(buffer)}
                    <Text inverse> </Text>
                </Text>
            )}

            {screen === SCREEN_MENU ? (
                <MenuView
                    settings={settings}
                    rows={setupRows}
                    selectedIndex={safeMenuIndex}
                    selectedRow={selectedSetupRow}
                />
            ) : (
                <EditorView
                    screen={screen}
                    rows={editorRows}
                    selectedIndex={safeValueIndex}
                    selectedRow={selectedEditorRow}
                    presetText={presetText}
                />
            )}
        </Box>
    );

    function handleMenuInput(input, key) {
        if (key.escape) {
            onBack();
            return;
        }

        if (key.upArrow) {
            setSelectedMenuIndex((previous) => clamp(previous - 1, 0, setupRows.length - 1));
            return;
        }

        if (key.downArrow) {
            setSelectedMenuIndex((previous) => clamp(previous + 1, 0, setupRows.length - 1));
            return;
        }

        if (input === 't' || input === 'T') {
            onChange(togglePowerlineEnabled(settings));
            return;
        }

        if (key.return && selectedSetupRow && settings.powerline.enabled) {
            setScreen(selectedSetupRow.key);
            setSelectedValueIndex(0);
        }
    }

    function handleEditorInput(input, key) {
        if (key.escape) {
            setScreen(SCREEN_MENU);
            setSelectedValueIndex(0);
            resetInputMode();
            return;
        }

        if (key.upArrow) {
            setSelectedValueIndex((previous) => clamp(previous - 1, 0, editorRows.length - 1));
            return;
        }

        if (key.downArrow) {
            setSelectedValueIndex((previous) => clamp(previous + 1, 0, editorRows.length - 1));
            return;
        }

        if (!selectedEditorRow) {
            return;
        }

        if (key.leftArrow) {
            onChange(cycleCurrentValue(-1));
            return;
        }

        if (key.rightArrow) {
            onChange(cycleCurrentValue(1));
            return;
        }

        if (screen === SCREEN_SEPARATOR) {
            if (input === 'a' || input === 'A') {
                const result = insertPowerlineSeparator(
                    settings,
                    selectedEditorRow.slotIndex,
                    'after'
                );
                onChange(result.settings);
                setSelectedValueIndex(result.slotIndex);
                return;
            }

            if (input === 'i' || input === 'I') {
                const result = insertPowerlineSeparator(
                    settings,
                    selectedEditorRow.slotIndex,
                    'before'
                );
                onChange(result.settings);
                setSelectedValueIndex(result.slotIndex);
                return;
            }

            if (input === 'd' || input === 'D') {
                const result = removePowerlineSeparator(settings, selectedEditorRow.slotIndex);
                onChange(result.settings);
                setSelectedValueIndex(result.slotIndex);
                return;
            }

            if (input === 'c' || input === 'C') {
                onChange(resetPowerlineSeparators(settings));
                setSelectedValueIndex(0);
                return;
            }

            if (input === 't' || input === 'T') {
                onChange(togglePowerlineSeparatorInvert(settings, selectedEditorRow.slotIndex));
                return;
            }
        } else if (input === 'c' || input === 'C') {
            onChange(
                updatePowerlineArrayEntry(
                    settings,
                    selectedEditorRow.arrayKey,
                    selectedEditorRow.slotIndex,
                    ''
                )
            );
            return;
        }

        if (input === 'e' || input === 'E' || key.return) {
            setInputMode('glyph');
            setBuffer(selectedEditorRow.value || '');
        }
    }

    function cycleCurrentValue(step) {
        if (!selectedEditorRow) {
            return settings;
        }

        if (screen === SCREEN_SEPARATOR) {
            return cyclePowerlineSeparator(settings, selectedEditorRow.slotIndex, step);
        }

        if (screen === SCREEN_START_CAP) {
            return cyclePowerlineStartCap(settings, selectedEditorRow.slotIndex, step);
        }

        return cyclePowerlineEndCap(settings, selectedEditorRow.slotIndex, step);
    }

    function resetInputMode() {
        setInputMode(null);
        setBuffer('');
    }
}

function MenuView({ settings, rows, selectedIndex, selectedRow }) {
    return (
        <Box marginTop={1} flexDirection="column">
            <Text>
                Powerline Mode:{' '}
                <Text color={settings.powerline.enabled ? 'green' : 'red'}>
                    {settings.powerline.enabled ? 'enabled' : 'disabled'}
                </Text>
                <Text dimColor> (toggle with T)</Text>
            </Text>
            <Text dimColor>
                {settings.powerline.enabled
                    ? 'Frame tokens stay invisible in Prompt Layout.'
                    : 'Enable powerline first, then configure joins and caps.'}
            </Text>
            <Box marginTop={1} flexDirection="column">
                {rows.map((row, index) => {
                    const selected = index === selectedIndex;
                    return (
                        <Text key={row.key} color={selected ? 'green' : undefined}>
                            {selected ? '▶ ' : '  '}
                            {row.label.padEnd(12)}
                            <Text dimColor>{`(${row.summary})`}</Text>
                        </Text>
                    );
                })}
            </Box>
            {selectedRow && (
                <Box marginTop={1}>
                    <Text dimColor>{selectedRow.description}</Text>
                </Box>
            )}
        </Box>
    );
}

function EditorView({ screen, rows, selectedIndex, selectedRow, presetText }) {
    return (
        <Box marginTop={1} flexDirection="column">
            <Text bold>{SCREEN_LABELS[screen]}</Text>
            <Text dimColor>{getScreenDescription(screen)}</Text>
            {presetText ? <Text dimColor>{presetText}</Text> : null}
            <Box marginTop={1} flexDirection="column">
                {rows.map((row, index) => {
                    const selected = index === selectedIndex;
                    return (
                        <Text key={row.id} color={selected ? 'green' : undefined}>
                            {selected ? '▶ ' : '  '}
                            {row.label.padEnd(12)}
                            {formatVisibleGlyph(row.value)}
                            {row.invert ? <Text dimColor> [invert]</Text> : null}
                        </Text>
                    );
                })}
            </Box>
            {selectedRow && (
                <Box marginTop={1}>
                    <Text dimColor>{describeSelectedRow(screen, selectedRow)}</Text>
                </Box>
            )}
        </Box>
    );
}

function buildSetupRows(settings) {
    const powerline = settings.powerline;
    return [
        {
            key: SCREEN_SEPARATOR,
            label: 'Separator',
            summary: summarizeSeparators(powerline.separators),
            description: 'Choose the implicit join inserted between adjacent content segments.',
        },
        {
            key: SCREEN_START_CAP,
            label: 'Start Cap',
            summary: summarizeCaps(settings, 'startCaps', START_CAP_NAMES),
            description: 'Configure the glyph shown before the first content segment on each line.',
        },
        {
            key: SCREEN_END_CAP,
            label: 'End Cap',
            summary: summarizeCaps(settings, 'endCaps', END_CAP_NAMES),
            description: 'Configure the glyph shown after the last content segment on each line.',
        },
    ];
}

function buildEditorRows(settings, screen) {
    if (screen === SCREEN_SEPARATOR) {
        return settings.powerline.separators.map((value, index) => ({
            id: `separator-${index}`,
            label: `Join ${index + 1}`,
            value,
            invert: Boolean(settings.powerline.separatorInvertBackground[index]),
            slotIndex: index,
            arrayKey: 'separators',
        }));
    }

    if (screen === SCREEN_START_CAP) {
        return settings.prompt.lines.map((_, index) => ({
            id: `start-cap-${index}`,
            label: `Line ${index + 1}`,
            value: settings.powerline.startCaps[index] || '',
            slotIndex: index,
            arrayKey: 'startCaps',
        }));
    }

    if (screen === SCREEN_END_CAP) {
        return settings.prompt.lines.map((_, index) => ({
            id: `end-cap-${index}`,
            label: `Line ${index + 1}`,
            value: settings.powerline.endCaps[index] || '',
            slotIndex: index,
            arrayKey: 'endCaps',
        }));
    }

    return [];
}

function summarizeSeparators(separators) {
    if (!Array.isArray(separators) || separators.length === 0) {
        return 'none';
    }

    if (separators.length > 1) {
        return 'multiple';
    }

    return describeGlyph(separators[0], SEPARATOR_NAMES);
}

function summarizeCaps(settings, key, presetNames) {
    const lineCount = settings.prompt.lines.length;
    const values = settings.powerline[key].slice(0, lineCount);
    const normalized = values.map((value) => value || '');

    if (normalized.every((value) => !value)) {
        return 'none';
    }

    const unique = Array.from(new Set(normalized));
    if (unique.length > 1) {
        return 'multiple';
    }

    return describeGlyph(unique[0], presetNames);
}

function describeSelectedRow(screen, row) {
    if (screen === SCREEN_SEPARATOR) {
        return `${describeGlyph(row.value, SEPARATOR_NAMES)}${row.invert ? ' with inverted background flow.' : ' with normal background flow.'}`;
    }

    if (screen === SCREEN_START_CAP) {
        return `${describeGlyph(row.value, START_CAP_NAMES)} before Line ${row.slotIndex + 1}.`;
    }

    return `${describeGlyph(row.value, END_CAP_NAMES)} after Line ${row.slotIndex + 1}.`;
}

function describeGlyph(value, presetNames) {
    if (!value) {
        return 'none';
    }

    const trimmed = value.trim();
    const name = presetNames[trimmed];
    if (name) {
        return `${formatVisibleGlyph(value)} - ${name}`;
    }

    return `${formatVisibleGlyph(value)} - custom`;
}

function getScreenDescription(screen) {
    if (screen === SCREEN_SEPARATOR) {
        return 'Separators are implicit. Prompt Layout never shows these frame tokens.';
    }

    if (screen === SCREEN_START_CAP) {
        return 'Start caps are rendered before the first content segment of each line.';
    }

    return 'End caps are rendered after the last content segment of each line.';
}

function formatVisibleGlyph(value) {
    if (!value) {
        return '(none)';
    }

    return String(value).replaceAll(' ', '␠');
}

function clamp(value, min, max) {
    if (max < min) {
        return min;
    }
    return Math.max(min, Math.min(value, max));
}

export { PowerlineFrameEditor };
