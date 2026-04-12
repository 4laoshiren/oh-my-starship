import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';

import { removeMapEntry, upsertMapEntry } from '../../utils/settings-mutations.js';

function MapEditor({ settings, moduleKey, fieldKey, onBack, onChange, interactive }) {
    const entries = useMemo(() => {
        const value = settings.modules[moduleKey]?.[fieldKey];
        return Object.entries(value || {});
    }, [fieldKey, moduleKey, settings.modules]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [inputMode, setInputMode] = useState(false);
    const [buffer, setBuffer] = useState('');

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
        <TitledBox flexDirection="column" borderStyle="round" borderColor="magenta" paddingX={1} titles={[`${moduleKey}.${fieldKey}`]}>

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
                    entries.map((entry, index) => {
                        const selected = index === selectedIndex;
                        return (
                            <Text key={entry[0]} color={selected ? 'green' : undefined}>
                                {selected ? '▶ ' : '  '}
                                {entry[0]} = {entry[1]}
                            </Text>
                        );
                    })
                )}
            </Box>
        </TitledBox>
    );

    function resetInput() {
        setInputMode(false);
        setBuffer('');
    }
}

function clamp(value, min, max) {
    if (max < min) {
        return min;
    }
    return Math.max(min, Math.min(value, max));
}

export { MapEditor };
