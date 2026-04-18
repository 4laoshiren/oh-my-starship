import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';

import { MODULE_SCHEMAS } from '../../types/settings.js';
import {
    clearColorTargetChannel,
    resolveModuleColors,
    updateColorTarget,
} from '../../utils/color-targets.js';
import { colorToInk, cycleNamedColor, displayColorName } from '../../utils/colors.js';
import { toggleModuleField, updateModuleField } from '../../utils/settings-mutations.js';

const MIN_VIEWPORT_ROWS = 4;
const MAX_VIEWPORT_ROWS = 12;
const VIEWPORT_RESERVED_ROWS = 21;

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
    const resolvedColors = useMemo(() => resolveModuleColors(moduleConfig), [moduleConfig]);
    const rows = useMemo(
        () => buildEditorRows(schema.fields, moduleConfig, resolvedColors),
        [moduleConfig, resolvedColors, schema.fields]
    );
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [inputMode, setInputMode] = useState(false);
    const [buffer, setBuffer] = useState('');

    const activeSelectedIndex = clamp(selectedIndex, 0, Math.max(0, rows.length - 1));
    const selectedRow = rows[activeSelectedIndex] || null;
    const viewport = buildViewport(
        rows,
        activeSelectedIndex,
        Math.max(1, resolveViewportRowCount(terminalHeight) - 2)
    );
    const helpText = buildHelpText(selectedRow, inputMode);

    useInput(
        (input, key) => {
            if (inputMode) {
                handleInputMode(input, key);
                return;
            }

            if (key.escape) {
                onBack();
                return;
            }

            if (key.upArrow) {
                setSelectedIndex((previous) => clamp(previous - 1, 0, rows.length - 1));
                return;
            }

            if (key.downArrow) {
                setSelectedIndex((previous) => clamp(previous + 1, 0, rows.length - 1));
                return;
            }

            if (!selectedRow) {
                return;
            }

            if (key.leftArrow || key.rightArrow) {
                if (selectedRow.type === 'boolean') {
                    onChange(toggleModuleField(settings, moduleKey, selectedRow.key));
                    return;
                }

                if (selectedRow.type === 'color') {
                    const nextColor = cycleNamedColor(selectedRow.value, key.rightArrow ? 1 : -1);
                    onChange(
                        updateColorTarget(
                            settings,
                            `module:${moduleKey}`,
                            selectedRow.channel,
                            nextColor
                        )
                    );
                }
                return;
            }

            if (input === 'r' || input === 'R') {
                if (selectedRow.type === 'color') {
                    onChange(
                        clearColorTargetChannel(
                            settings,
                            `module:${moduleKey}`,
                            selectedRow.channel
                        )
                    );
                }
                return;
            }

            if (key.return || input === 'e' || input === 'E') {
                if (selectedRow.type === 'boolean') {
                    onChange(toggleModuleField(settings, moduleKey, selectedRow.key));
                    return;
                }

                if (selectedRow.type === 'map') {
                    onOpenMap(moduleKey, selectedRow.key);
                    return;
                }

                setInputMode(true);
                setBuffer(String(selectedRow.rawValue ?? ''));
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
            <Text dimColor>{helpText}</Text>
            <Text dimColor>
                Color rows write back into the module style/format instead of creating extra fields.
            </Text>
            {inputMode ? (
                <Text color="cyan">
                    value: {buffer}
                    <Text inverse> </Text>
                </Text>
            ) : null}
            <Box marginTop={1}>
                <Text dimColor>Preview: </Text>
                <Text
                    color={colorToInk(resolvedColors.fg)}
                    backgroundColor={colorToInk(resolvedColors.bg)}
                >{` $${moduleKey} `}</Text>
            </Box>
            <Box marginTop={1} flexDirection="column">
                {viewport.hiddenBefore > 0 ? (
                    <Text
                        dimColor
                    >{`↑ ${viewport.hiddenBefore} more field${viewport.hiddenBefore === 1 ? '' : 's'}`}</Text>
                ) : null}
                {viewport.items.map((row, offset) => {
                    const index = viewport.startIndex + offset;
                    const selected = index === activeSelectedIndex;
                    return <ModuleEditorRow key={row.id} row={row} selected={selected} />;
                })}
                {viewport.hiddenAfter > 0 ? (
                    <Text
                        dimColor
                    >{`↓ ${viewport.hiddenAfter} more field${viewport.hiddenAfter === 1 ? '' : 's'}`}</Text>
                ) : null}
            </Box>
            {selectedRow ? (
                <Box marginTop={1}>
                    <Text dimColor wrap="truncate-end">
                        {selectedRow.description}
                    </Text>
                </Box>
            ) : null}
        </TitledBox>
    );

    function handleInputMode(input, key) {
        if (key.escape) {
            resetInputMode();
            return;
        }

        if (key.return) {
            if (!selectedRow) {
                resetInputMode();
                return;
            }

            if (selectedRow.type === 'color') {
                const nextValue = String(buffer || '').trim();
                onChange(
                    nextValue
                        ? updateColorTarget(
                              settings,
                              `module:${moduleKey}`,
                              selectedRow.channel,
                              nextValue
                          )
                        : clearColorTargetChannel(
                              settings,
                              `module:${moduleKey}`,
                              selectedRow.channel
                          )
                );
            } else {
                onChange(
                    updateModuleField(
                        settings,
                        moduleKey,
                        selectedRow.key,
                        buffer,
                        selectedRow.type
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
    }

    function resetInputMode() {
        setInputMode(false);
        setBuffer('');
    }
}

function ModuleEditorRow({ row, selected }) {
    return (
        <Box>
            <Box width={24} flexShrink={0}>
                <Text color={selected ? 'green' : undefined} wrap="truncate-end">
                    {selected ? '▶ ' : '  '}
                    {row.label.padEnd(21)}
                </Text>
            </Box>
            <Box flexShrink={1} marginRight={1}>
                <ModuleEditorRowValue row={row} />
            </Box>
            <Box flexGrow={1} flexShrink={1}>
                <Text dimColor wrap="truncate-end">
                    {row.metaText}
                </Text>
            </Box>
        </Box>
    );
}

function ModuleEditorRowValue({ row }) {
    if (row.type === 'color') {
        return (
            <Box>
                <Text>{displayColorName(row.value)}</Text>
                {colorToInk(row.value) ? (
                    <Text backgroundColor={colorToInk(row.value)}>{'    '}</Text>
                ) : null}
            </Box>
        );
    }

    if (row.type === 'boolean') {
        return <Text>{row.value ? 'true' : 'false'}</Text>;
    }

    if (row.type === 'map') {
        return <Text>{`{${Object.keys(row.value || {}).length} entries}`}</Text>;
    }

    return <Text wrap="truncate-end">{formatValue(row.value)}</Text>;
}

function buildEditorRows(fields, moduleConfig, resolvedColors) {
    const colorRows = [
        {
            id: '__fg',
            key: '__fg',
            label: 'foreground',
            type: 'color',
            channel: 'fg',
            value: resolvedColors.fg || '',
            rawValue: resolvedColors.fg || '',
            metaText: 'text color',
            description:
                'Foreground color for the visible module text. This writes back into style/format.',
        },
        {
            id: '__bg',
            key: '__bg',
            label: 'background',
            type: 'color',
            channel: 'bg',
            value: resolvedColors.bg || '',
            rawValue: resolvedColors.bg || '',
            metaText: 'frame source',
            description:
                'Background color for this module. Adjacent powerline frames also read from it.',
        },
    ];

    const fieldRows = fields.map((field) => ({
        id: field.key,
        key: field.key,
        label: field.label,
        type: field.type,
        value: moduleConfig[field.key],
        rawValue: moduleConfig[field.key] ?? '',
        metaText: buildFieldMetaText(field.type, moduleConfig[field.key]),
        description: buildFieldDescription(field),
    }));

    return [...colorRows, ...fieldRows];
}

function buildFieldMetaText(type, value) {
    if (type === 'map') {
        return 'nested map';
    }

    if (type === 'boolean') {
        return 'toggle';
    }

    if (type === 'number') {
        return 'numeric';
    }

    if (type === 'long-string') {
        return 'long text';
    }

    return 'text';
}

function buildFieldDescription(field) {
    if (field.type === 'map') {
        return `Open the nested map editor for ${field.key}.`;
    }

    if (field.type === 'boolean') {
        return `Toggle the ${field.key} flag for this module.`;
    }

    return `Edit the ${field.key} field for this module.`;
}

function buildHelpText(selectedRow, inputMode) {
    if (inputMode) {
        return 'Editing value. Enter save  ESC cancel';
    }

    if (!selectedRow) {
        return '↑↓ select field  ESC back';
    }

    if (selectedRow.type === 'boolean') {
        return '↑↓ select field  Enter/E toggle  ←→ toggle  ESC back';
    }

    if (selectedRow.type === 'map') {
        return '↑↓ select field  Enter/E open map  ESC back';
    }

    if (selectedRow.type === 'color') {
        return '↑↓ select field  ←→ cycle color  Enter/E edit  R clear  ESC back';
    }

    return '↑↓ select field  Enter/E edit  ESC back';
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

function formatValue(value) {
    const text = String(value ?? '').replaceAll('\n', '\\n');
    if (text.length > 52) {
        return `${text.slice(0, 49)}...`;
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
