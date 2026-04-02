import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';

export function ModuleEditor({ moduleKey, moduleConfig, fields, onChange, onBack, interactive }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [inputMode, setInputMode] = useState(false);
    const [inputBuffer, setInputBuffer] = useState('');
    const editableFields = useMemo(() => fields, [fields]);

    useInput(
        (input, key) => {
            if (inputMode) {
                if (key.escape) {
                    setInputMode(false);
                    setInputBuffer('');
                    return;
                }

                if (key.return) {
                    const currentField = editableFields[selectedIndex];
                    if (!currentField) {
                        setInputMode(false);
                        setInputBuffer('');
                        return;
                    }
                    const next = applyFieldValue(moduleConfig, currentField, inputBuffer);
                    onChange(next);
                    setInputMode(false);
                    setInputBuffer('');
                    return;
                }

                if (key.backspace || key.delete) {
                    setInputBuffer((previous) => previous.slice(0, -1));
                    return;
                }

                if (input) {
                    setInputBuffer((previous) => previous + input);
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
                    Math.min(Math.max(0, editableFields.length - 1), previous + 1)
                );
                return;
            }

            if (key.leftArrow || key.rightArrow) {
                const currentField = editableFields[selectedIndex];
                if (currentField?.type === 'boolean') {
                    const next = {
                        ...moduleConfig,
                        [currentField.key]: !Boolean(moduleConfig[currentField.key]),
                    };
                    onChange(next);
                }
                return;
            }

            if (key.return || input === 'e' || input === 'E') {
                const currentField = editableFields[selectedIndex];
                if (!currentField) {
                    return;
                }

                if (currentField.type === 'boolean') {
                    const next = {
                        ...moduleConfig,
                        [currentField.key]: !Boolean(moduleConfig[currentField.key]),
                    };
                    onChange(next);
                    return;
                }

                setInputMode(true);
                setInputBuffer(String(moduleConfig[currentField.key] ?? ''));
            }
        },
        { isActive: interactive }
    );

    return (
        <Box flexDirection="column">
            <Text bold>Module: {moduleKey}</Text>
            <Text dimColor>↑↓ select field, Enter/E edit, ←→ toggle boolean, ESC back</Text>
            {inputMode && (
                <Text color="cyan">
                    input: {inputBuffer}
                    <Text inverse> </Text>
                </Text>
            )}
            <Box marginTop={1} flexDirection="column">
                {editableFields.map((field, index) => {
                    const selected = index === selectedIndex;
                    return (
                        <Text key={field.key} color={selected ? 'green' : undefined}>
                            {selected ? '▶ ' : '  '}
                            {field.label}
                            {' = '}
                            {String(moduleConfig[field.key] ?? '')}
                            <Text dimColor> ({field.type})</Text>
                        </Text>
                    );
                })}
            </Box>
        </Box>
    );
}

function applyFieldValue(moduleConfig, field, rawValue) {
    if (field.type === 'number') {
        const parsed = Number(rawValue);
        if (!Number.isFinite(parsed)) {
            return moduleConfig;
        }
        return {
            ...moduleConfig,
            [field.key]: parsed,
        };
    }

    if (field.type === 'boolean') {
        return {
            ...moduleConfig,
            [field.key]: rawValue === 'true',
        };
    }

    return {
        ...moduleConfig,
        [field.key]: rawValue,
    };
}
