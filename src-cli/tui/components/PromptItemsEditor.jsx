import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';

import {
    addPromptItem,
    cyclePromptItemType,
    cyclePromptSeparator,
    removePromptItem,
    togglePromptSeparatorInvert,
    updateTextPromptItem,
} from '../../utils/settings-mutations.js';
import { resolveSeparatorChar } from '../../utils/renderer.js';

export function PromptItemsEditor({ settings, onChange, onBack, interactive }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [textEditMode, setTextEditMode] = useState(false);
    const [textBuffer, setTextBuffer] = useState('');
    const items = settings.prompt.items;

    useInput(
        (input, key) => {
            if (textEditMode) {
                if (key.escape) {
                    setTextEditMode(false);
                    setTextBuffer('');
                    return;
                }

                if (key.return) {
                    const nextSettings = updateTextPromptItem(settings, selectedIndex, textBuffer);
                    onChange(nextSettings);
                    setTextEditMode(false);
                    setTextBuffer('');
                    return;
                }

                if (key.backspace || key.delete) {
                    setTextBuffer((previous) => previous.slice(0, -1));
                    return;
                }

                if (input) {
                    setTextBuffer((previous) => previous + input);
                }
                return;
            }

            if (key.escape) {
                onBack();
                return;
            }

            if (key.upArrow) {
                setSelectedIndex((previous) => Math.max(0, previous - 1));
                return;
            }

            if (key.downArrow) {
                setSelectedIndex((previous) =>
                    Math.min(Math.max(0, items.length - 1), previous + 1)
                );
                return;
            }

            if (key.leftArrow) {
                onChange(handleLeftRight(settings, selectedIndex, -1));
                return;
            }

            if (key.rightArrow) {
                onChange(handleLeftRight(settings, selectedIndex, 1));
                return;
            }

            if (input === 'a' || input === 'A') {
                const { settings: nextSettings, index } = addPromptItem(
                    settings,
                    selectedIndex + 1,
                    'module'
                );
                onChange(nextSettings);
                setSelectedIndex(index);
                return;
            }

            if (input === 's' || input === 'S') {
                const { settings: nextSettings, index } = addPromptItem(
                    settings,
                    selectedIndex + 1,
                    'separator'
                );
                onChange(nextSettings);
                setSelectedIndex(index);
                return;
            }

            if (input === 't' || input === 'T') {
                const { settings: nextSettings, index } = addPromptItem(
                    settings,
                    selectedIndex + 1,
                    'text'
                );
                onChange(nextSettings);
                setSelectedIndex(index);
                return;
            }

            if (input === 'd' || input === 'D') {
                const { settings: nextSettings, index } = removePromptItem(settings, selectedIndex);
                onChange(nextSettings);
                setSelectedIndex(index);
                return;
            }

            if (input === 'v' || input === 'V') {
                onChange(togglePromptSeparatorInvert(settings, selectedIndex));
                return;
            }

            if (input === 'e' || input === 'E' || key.return) {
                const selected = items[selectedIndex];
                if (selected?.type === 'text') {
                    setTextBuffer(selected.value ?? '');
                    setTextEditMode(true);
                }
            }
        },
        { isActive: interactive }
    );

    const helpText = useMemo(() => {
        if (textEditMode) {
            return 'Text edit mode: type to edit, Enter save, ESC cancel';
        }

        return '↑↓ select, ←→ cycle module/separator, A add module, S add separator, T add text, D delete, V invert separator, E edit text, ESC back';
    }, [textEditMode]);

    return (
        <Box flexDirection="column">
            <Text bold>Prompt Items Editor</Text>
            <Text dimColor>{helpText}</Text>
            {textEditMode && (
                <Text color="cyan">
                    text: {textBuffer}
                    <Text inverse> </Text>
                </Text>
            )}
            <Box flexDirection="column" marginTop={1}>
                {items.length === 0 ? (
                    <Text dimColor>(empty) Press A/S/T to add first item.</Text>
                ) : (
                    items.map((item, index) => {
                        const selected = index === selectedIndex;
                        return (
                            <Text key={item.id} color={selected ? 'green' : undefined}>
                                {selected ? '▶ ' : '  '}
                                {formatPromptItem(item, settings)}
                            </Text>
                        );
                    })
                )}
            </Box>
        </Box>
    );
}

function handleLeftRight(settings, selectedIndex, step) {
    const item = settings.prompt.items[selectedIndex];
    if (!item) {
        return settings;
    }

    if (item.type === 'module') {
        return cyclePromptItemType(settings, selectedIndex, step);
    }

    if (item.type === 'separator') {
        return cyclePromptSeparator(settings, selectedIndex, step);
    }

    return settings;
}

function formatPromptItem(item, settings) {
    if (item.type === 'module') {
        return `[module] ${item.module}`;
    }

    if (item.type === 'separator') {
        const char = resolveSeparatorChar(item, settings);
        const invertMark = item.invertBackground ? ' (inverted)' : '';
        return `[separator] "${char}" preset#${item.separatorIndex}${invertMark}`;
    }

    if (item.type === 'text') {
        return `[text] "${item.value}"`;
    }

    return `[unknown] ${JSON.stringify(item)}`;
}
