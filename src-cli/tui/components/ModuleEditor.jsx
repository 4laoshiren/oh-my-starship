import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';

import { MODULE_SCHEMAS } from '../../types/settings.js';
import { toggleModuleField, updateModuleField } from '../../utils/settings-mutations.js';

const MIN_VIEWPORT_ROWS = 4;
const MAX_VIEWPORT_ROWS = 12;
const VIEWPORT_RESERVED_ROWS = 19;

function ModuleEditor({
    settings,
    moduleKey,
    onBack,
    onChange,
    onOpenMap,
    interactive,
    terminalHeight,
}) {
    const schema = MODULE_SCHEMAS[moduleKey] || {
        label: moduleKey,
        fields: inferFields(settings.modules[moduleKey] || {}),
    };
    const moduleConfig = settings.modules[moduleKey] || {};
    const fields = useMemo(() => schema.fields, [schema.fields]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [inputMode, setInputMode] = useState(false);
    const [buffer, setBuffer] = useState('');
    const viewport = buildViewport(
        fields,
        selectedIndex,
        Math.max(1, resolveViewportRowCount(terminalHeight) - 2)
    );

    useInput(
        (input, key) => {
            const field = fields[selectedIndex];

            if (inputMode) {
                if (key.escape) {
                    resetInputMode();
                    return;
                }

                if (key.return) {
                    if (field) {
                        onChange(
                            updateModuleField(settings, moduleKey, field.key, buffer, field.type)
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

            if (key.escape) {
                onBack();
                return;
            }

            if (key.upArrow) {
                setSelectedIndex((previous) => clamp(previous - 1, 0, fields.length - 1));
                return;
            }

            if (key.downArrow) {
                setSelectedIndex((previous) => clamp(previous + 1, 0, fields.length - 1));
                return;
            }

            if (!field) {
                return;
            }

            if (key.leftArrow || key.rightArrow) {
                if (field.type === 'boolean') {
                    onChange(toggleModuleField(settings, moduleKey, field.key));
                }
                return;
            }

            if (key.return || input === 'e' || input === 'E') {
                if (field.type === 'boolean') {
                    onChange(toggleModuleField(settings, moduleKey, field.key));
                    return;
                }

                if (field.type === 'map') {
                    onOpenMap(moduleKey, field.key);
                    return;
                }

                setInputMode(true);
                setBuffer(String(moduleConfig[field.key] ?? ''));
            }
        },
        { isActive: interactive }
    );

    return (
        <TitledBox
            flexDirection="column"
            borderStyle="round"
            borderColor="yellow"
            paddingX={1}
            titles={[`Module: ${schema.label} (${moduleKey})`]}
        >
            <Text dimColor>↑↓ select Enter/E edit/open ←→ toggle boolean ESC back</Text>
            {inputMode && (
                <Text color="cyan">
                    value: {buffer}
                    <Text inverse> </Text>
                </Text>
            )}
            <Box marginTop={1} flexDirection="column">
                {viewport.hiddenBefore > 0 ? (
                    <Text
                        dimColor
                    >{`↑ ${viewport.hiddenBefore} more field${viewport.hiddenBefore === 1 ? '' : 's'}`}</Text>
                ) : null}
                {viewport.items.map((field, offset) => {
                    const index = viewport.startIndex + offset;
                    const selected = index === selectedIndex;
                    return (
                        <Text
                            key={field.key}
                            color={selected ? 'green' : undefined}
                            wrap="truncate-end"
                        >
                            {selected ? '▶ ' : '  '}
                            {field.label.padEnd(20)}
                            {formatValue(moduleConfig[field.key], field.type)}
                            <Text dimColor> {field.type}</Text>
                        </Text>
                    );
                })}
                {viewport.hiddenAfter > 0 ? (
                    <Text
                        dimColor
                    >{`↓ ${viewport.hiddenAfter} more field${viewport.hiddenAfter === 1 ? '' : 's'}`}</Text>
                ) : null}
            </Box>
        </TitledBox>
    );

    function resetInputMode() {
        setInputMode(false);
        setBuffer('');
    }
}

function inferFields(config) {
    return Object.keys(config).map((key) => {
        const value = config[key];
        if (typeof value === 'boolean') {
            return { key, label: key, type: 'boolean' };
        }
        if (typeof value === 'number') {
            return { key, label: key, type: 'number' };
        }
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return { key, label: key, type: 'map' };
        }
        return { key, label: key, type: 'string' };
    });
}

function formatValue(value, type) {
    if (type === 'map') {
        return `{${Object.keys(value || {}).length} entries}`;
    }

    const text = String(value ?? '');
    if (text.length > 68) {
        return `${text.slice(0, 65)}...`;
    }
    return text;
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

export { ModuleEditor };
