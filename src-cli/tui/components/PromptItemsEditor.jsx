import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';

import {
    addPromptItem,
    addPromptLine,
    cyclePromptModule,
    movePromptItem,
    removePromptItem,
    removePromptLine,
    togglePromptItemMerge,
    updatePromptItem,
} from '../../utils/settings-mutations.js';
import { formatPromptItemLabel, formatPromptLineSummary } from '../../utils/prompt-format.js';

function LayoutEditor({ settings, onChange, onBack, interactive }) {
    const [mode, setMode] = useState('lines');
    const [selectedLineIndex, setSelectedLineIndex] = useState(0);
    const [selectedItemIndex, setSelectedItemIndex] = useState(0);
    const [inputMode, setInputMode] = useState(null);
    const [buffer, setBuffer] = useState('');
    const lines = settings.prompt.lines;
    const selectedLine = lines[selectedLineIndex] || [];
    const selectedItem = selectedLine[selectedItemIndex];

    useInput(
        (input, key) => {
            if (inputMode) {
                if (key.escape) {
                    resetInputMode();
                    return;
                }

                if (key.return) {
                    if (selectedItem) {
                        if (inputMode === 'text') {
                            onChange(
                                updatePromptItem(settings, selectedLineIndex, selectedItemIndex, {
                                    text: buffer,
                                })
                            );
                        }
                        if (inputMode === 'style' && selectedItem.type === 'styledText') {
                            onChange(
                                updatePromptItem(settings, selectedLineIndex, selectedItemIndex, {
                                    style: buffer || 'none',
                                })
                            );
                        }
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

            if (mode === 'lines') {
                if (key.escape) {
                    onBack();
                    return;
                }

                if (key.upArrow) {
                    setSelectedLineIndex((previous) => clamp(previous - 1, 0, lines.length - 1));
                    return;
                }

                if (key.downArrow) {
                    setSelectedLineIndex((previous) => clamp(previous + 1, 0, lines.length - 1));
                    return;
                }

                if (input === 'a' || input === 'A') {
                    const result = addPromptLine(settings, selectedLineIndex);
                    onChange(result.settings);
                    setSelectedLineIndex(result.lineIndex);
                    return;
                }

                if (input === 'd' || input === 'D') {
                    const result = removePromptLine(settings, selectedLineIndex);
                    onChange(result.settings);
                    setSelectedLineIndex(result.lineIndex);
                    setSelectedItemIndex(0);
                    return;
                }

                if (key.return || input === 'e' || input === 'E') {
                    setMode('items');
                    setSelectedItemIndex(0);
                }
                return;
            }

            if (key.escape) {
                setMode('lines');
                resetInputMode();
                return;
            }

            if (key.upArrow) {
                setSelectedItemIndex((previous) =>
                    clamp(previous - 1, 0, Math.max(0, selectedLine.length - 1))
                );
                return;
            }

            if (key.downArrow) {
                setSelectedItemIndex((previous) =>
                    clamp(previous + 1, 0, Math.max(0, selectedLine.length - 1))
                );
                return;
            }

            if (key.leftArrow) {
                onChange(cyclePromptModule(settings, selectedLineIndex, selectedItemIndex, -1));
                return;
            }

            if (key.rightArrow) {
                onChange(cyclePromptModule(settings, selectedLineIndex, selectedItemIndex, 1));
                return;
            }

            if (input === 'a' || input === 'A') {
                const result = addPromptItem(
                    settings,
                    selectedLineIndex,
                    selectedItemIndex,
                    'styledText'
                );
                onChange(result.settings);
                setSelectedItemIndex(result.itemIndex);
                return;
            }

            if (input === 'm' || input === 'M') {
                const result = addPromptItem(
                    settings,
                    selectedLineIndex,
                    selectedItemIndex,
                    'module'
                );
                onChange(result.settings);
                setSelectedItemIndex(result.itemIndex);
                return;
            }

            if (input === 'r' || input === 'R') {
                const result = addPromptItem(
                    settings,
                    selectedLineIndex,
                    selectedItemIndex,
                    'rawText'
                );
                onChange(result.settings);
                setSelectedItemIndex(result.itemIndex);
                return;
            }

            if (input === 'd' || input === 'D') {
                const result = removePromptItem(settings, selectedLineIndex, selectedItemIndex);
                onChange(result.settings);
                setSelectedItemIndex(result.itemIndex);
                return;
            }

            if (input === 'u' || input === 'U') {
                const result = movePromptItem(settings, selectedLineIndex, selectedItemIndex, -1);
                onChange(result.settings);
                setSelectedItemIndex(result.itemIndex);
                return;
            }

            if (input === 'j' || input === 'J') {
                const result = movePromptItem(settings, selectedLineIndex, selectedItemIndex, 1);
                onChange(result.settings);
                setSelectedItemIndex(result.itemIndex);
                return;
            }

            if (input === 't' || input === 'T') {
                onChange(togglePromptItemMerge(settings, selectedLineIndex, selectedItemIndex));
                return;
            }

            if (input === 'e' || input === 'E' || key.return) {
                if (selectedItem?.type === 'styledText' || selectedItem?.type === 'rawText') {
                    setInputMode('text');
                    setBuffer(selectedItem.text || '');
                }
                return;
            }

            if (input === 's' || input === 'S') {
                if (selectedItem?.type === 'styledText') {
                    setInputMode('style');
                    setBuffer(selectedItem.style || 'none');
                }
            }
        },
        { isActive: interactive }
    );

    const helpText = useMemo(() => {
        if (inputMode === 'text') {
            return 'Editing item text. Enter save  ESC cancel';
        }
        if (inputMode === 'style') {
            return 'Editing Starship style string. Enter save  ESC cancel';
        }
        if (mode === 'lines') {
            return '↑↓ select line  Enter edit line  A add line  D delete line  ESC back';
        }
        return '↑↓ select item  ←→ cycle module  A add styled  M add module  R add raw  U/J move  T merge next  E edit text  S edit style  D delete  ESC lines';
    }, [inputMode, mode]);

    return (
        <TitledBox flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1} titles={['Prompt Layout']}>

            <Text dimColor>
                Only real content items appear here. Implicit powerline frame lives in Powerline
                Frame.
            </Text>
            <Text dimColor>{helpText}</Text>
            {inputMode && (
                <Text color="cyan">
                    {inputMode}: {buffer}
                    <Text inverse> </Text>
                </Text>
            )}

            {mode === 'lines' ? (
                <Box marginTop={1} flexDirection="column">
                    {lines.map((line, index) => {
                        const selected = index === selectedLineIndex;
                        return (
                            <Text key={`line-${index}`} color={selected ? 'green' : undefined}>
                                {selected ? '▶ ' : '  '}
                                {`Line ${index + 1}`.padEnd(8)}
                                {formatPromptLineSummary(line)}
                            </Text>
                        );
                    })}
                </Box>
            ) : (
                <Box marginTop={1} flexDirection="column">
                    <Text dimColor>{`Editing Line ${selectedLineIndex + 1}`}</Text>
                    {selectedLine.length === 0 ? (
                        <Text dimColor>(empty)</Text>
                    ) : (
                        selectedLine.map((item, index) => {
                            const selected = index === selectedItemIndex;
                            return (
                                <Text key={item.id} color={selected ? 'green' : undefined}>
                                    {selected ? '▶ ' : '  '}
                                    {formatPromptItemLabel(item, index)}
                                </Text>
                            );
                        })
                    )}
                </Box>
            )}
        </TitledBox>
    );

    function resetInputMode() {
        setInputMode(null);
        setBuffer('');
    }
}

function clamp(value, min, max) {
    if (max < min) {
        return min;
    }
    return Math.max(min, Math.min(value, max));
}

export { LayoutEditor };
