import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';

import { removeMapEntry, upsertMapEntry } from '../../utils/settings-mutations.js';

const MIN_VIEWPORT_ROWS = 4;
const MAX_VIEWPORT_ROWS = 12;
const VIEWPORT_RESERVED_ROWS = 18;

function MapEditor({
    settings,
    moduleKey,
    fieldKey,
    onBack,
    onChange,
    interactive,
    terminalHeight,
}) {
    const entries = useMemo(() => {
        const value = settings.modules[moduleKey]?.[fieldKey];
        return Object.entries(value || {});
    }, [fieldKey, moduleKey, settings.modules]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [inputMode, setInputMode] = useState(false);
    const [buffer, setBuffer] = useState('');
    const viewport = buildViewport(
        entries,
        selectedIndex,
        Math.max(1, resolveViewportRowCount(terminalHeight) - 2)
    );

    useInput(
        (input, key) => {
            if (inputMode) {
                if (key.escape) {
                    resetInput();
                    return;
                }

                if (key.return) {
                    const [entryKey, ...valueParts] = buffer.split('=');
                    const value = valueParts.join('=');
                    onChange(upsertMapEntry(settings, moduleKey, fieldKey, entryKey || '', value));
                    resetInput();
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

            if (key.escape) {
                onBack();
                return;
            }

            if (key.upArrow) {
                setSelectedIndex((previous) => clamp(previous - 1, 0, entries.length - 1));
                return;
            }

            if (key.downArrow) {
                setSelectedIndex((previous) => clamp(previous + 1, 0, entries.length - 1));
                return;
            }

            if (input === 'a' || input === 'A') {
                setInputMode(true);
                setBuffer('key=value');
                return;
            }

            if (input === 'e' || input === 'E' || key.return) {
                const entry = entries[selectedIndex];
                if (!entry) {
                    return;
                }
                setInputMode(true);
                setBuffer(`${entry[0]}=${entry[1]}`);
                return;
            }

            if (input === 'd' || input === 'D') {
                const entry = entries[selectedIndex];
                if (!entry) {
                    return;
                }
                onChange(removeMapEntry(settings, moduleKey, fieldKey, entry[0]));
                setSelectedIndex((previous) => clamp(previous, 0, entries.length - 2));
            }
        },
        { isActive: interactive }
    );

    return (
        <TitledBox
            flexDirection="column"
            borderStyle="round"
            borderColor="magenta"
            paddingX={1}
            titles={[`${moduleKey}.${fieldKey}`]}
        >
            <Text dimColor>A add E edit D delete ESC back</Text>
            {inputMode && (
                <Text color="cyan">
                    pair: {buffer}
                    <Text inverse> </Text>
                </Text>
            )}
            <Box marginTop={1} flexDirection="column">
                {entries.length === 0 ? (
                    <Text dimColor>(no entries)</Text>
                ) : (
                    <>
                        {viewport.hiddenBefore > 0 ? (
                            <Text
                                dimColor
                            >{`↑ ${viewport.hiddenBefore} more entry${viewport.hiddenBefore === 1 ? '' : 's'}`}</Text>
                        ) : null}
                        {viewport.items.map((entry, offset) => {
                            const index = viewport.startIndex + offset;
                            const selected = index === selectedIndex;
                            return (
                                <Text
                                    key={entry[0]}
                                    color={selected ? 'green' : undefined}
                                    wrap="truncate-end"
                                >
                                    {selected ? '▶ ' : '  '}
                                    {entry[0]} = {entry[1]}
                                </Text>
                            );
                        })}
                        {viewport.hiddenAfter > 0 ? (
                            <Text
                                dimColor
                            >{`↓ ${viewport.hiddenAfter} more entry${viewport.hiddenAfter === 1 ? '' : 's'}`}</Text>
                        ) : null}
                    </>
                )}
            </Box>
        </TitledBox>
    );

    function resetInput() {
        setInputMode(false);
        setBuffer('');
    }
}

function resolveViewportRowCount(terminalHeight, reservedRows = VIEWPORT_RESERVED_ROWS) {
    const fallbackHeight = process.stdout.rows || 40;
    const safeTerminalHeight = Number(terminalHeight || fallbackHeight);

    return clamp(safeTerminalHeight - reservedRows, MIN_VIEWPORT_ROWS, MAX_VIEWPORT_ROWS);
}

function buildViewport(items, selectedIndex, visibleItemCount) {
    if (!Array.isArray(items) || items.length === 0) {
        return {
            items: [],
            startIndex: 0,
            hiddenBefore: 0,
            hiddenAfter: 0,
        };
    }

    const safeVisibleItemCount = clamp(visibleItemCount, 1, items.length);
    const safeSelectedIndex = clamp(selectedIndex, 0, items.length - 1);

    if (items.length <= safeVisibleItemCount) {
        return {
            items,
            startIndex: 0,
            hiddenBefore: 0,
            hiddenAfter: 0,
        };
    }

    const halfWindow = Math.floor(safeVisibleItemCount / 2);
    const startIndex = clamp(
        safeSelectedIndex - halfWindow,
        0,
        items.length - safeVisibleItemCount
    );
    const endIndex = startIndex + safeVisibleItemCount;

    return {
        items: items.slice(startIndex, endIndex),
        startIndex,
        hiddenBefore: startIndex,
        hiddenAfter: items.length - endIndex,
    };
}

function clamp(value, min, max) {
    if (max < min) {
        return min;
    }
    return Math.max(min, Math.min(value, max));
}

export { MapEditor };
