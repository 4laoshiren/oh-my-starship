import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';

import { presets as presetLibrary } from '../../../src/lib/presets.ts';
import { parseStarshipToml } from '../../utils/starship-toml.js';

const MIN_VIEWPORT_ROWS = 4;
const MAX_VIEWPORT_ROWS = 12;
const VIEWPORT_RESERVED_ROWS = 20;

function PresetsMenu({
    initialSelection = 0,
    onSelectionChange,
    onPreviewChange,
    onApply,
    onBack,
    interactive,
    terminalHeight,
}) {
    const presets = useMemo(
        () =>
            presetLibrary.map((preset) => {
                try {
                    return {
                        ...preset,
                        settings: parseStarshipToml(preset.toml),
                        error: '',
                    };
                } catch (error) {
                    return {
                        ...preset,
                        settings: null,
                        error:
                            error instanceof Error ? error.message : 'Failed to parse preset TOML.',
                    };
                }
            }),
        []
    );
    const [selectedIndex, setSelectedIndex] = useState(() =>
        clampSelection(initialSelection, presets.length)
    );

    useEffect(() => {
        setSelectedIndex(clampSelection(initialSelection, presets.length));
    }, [initialSelection, presets.length]);

    useEffect(() => {
        onSelectionChange?.(selectedIndex);
    }, [onSelectionChange, selectedIndex]);

    const activeSelectedIndex = clampSelection(selectedIndex, presets.length);
    const selectedPreset = presets[activeSelectedIndex] || null;
    const viewport = buildViewport(
        presets,
        activeSelectedIndex,
        Math.max(1, resolveViewportRowCount(terminalHeight) - 2)
    );

    useEffect(() => {
        if (!onPreviewChange) {
            return;
        }

        if (!selectedPreset?.settings || selectedPreset.error) {
            onPreviewChange(null);
            return;
        }

        onPreviewChange({
            settings: selectedPreset.settings,
            fastMode: true,
        });
    }, [onPreviewChange, selectedPreset]);

    useEffect(() => {
        if (!onPreviewChange) {
            return undefined;
        }

        return () => {
            onPreviewChange(null);
        };
    }, [onPreviewChange]);

    useInput(
        (input, key) => {
            if (key.escape) {
                onBack();
                return;
            }

            if (key.upArrow) {
                setSelectedIndex((previous) => clamp(previous - 1, 0, presets.length - 1));
                return;
            }

            if (key.downArrow) {
                setSelectedIndex((previous) => clamp(previous + 1, 0, presets.length - 1));
                return;
            }

            if ((input === 'a' || input === 'A' || key.return) && selectedPreset?.settings) {
                onApply?.(selectedPreset.settings, selectedPreset);
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
            titles={['Presets']}
        >
            <Text dimColor>Selected preset is previewed above before you commit it.</Text>
            <Text dimColor>↑↓ select preset Enter/A apply ESC back</Text>
            <Text dimColor>
                Applying a preset replaces the current prompt layout and module settings.
            </Text>
            <Box marginTop={1} flexDirection="column">
                {viewport.hiddenBefore > 0 ? (
                    <Text
                        dimColor
                    >{`↑ ${viewport.hiddenBefore} more preset${viewport.hiddenBefore === 1 ? '' : 's'}`}</Text>
                ) : null}
                {viewport.items.map((preset, offset) => {
                    const index = viewport.startIndex + offset;
                    const selected = index === activeSelectedIndex;

                    return <PresetRow key={preset.id} preset={preset} selected={selected} />;
                })}
                {viewport.hiddenAfter > 0 ? (
                    <Text
                        dimColor
                    >{`↓ ${viewport.hiddenAfter} more preset${viewport.hiddenAfter === 1 ? '' : 's'}`}</Text>
                ) : null}
            </Box>
            {selectedPreset ? (
                <Box marginTop={1} flexDirection="column">
                    <Text dimColor wrap="truncate-end">
                        {selectedPreset.description}
                    </Text>
                    <Text dimColor wrap="truncate-end">
                        {selectedPreset.id}
                    </Text>
                    {selectedPreset.error ? (
                        <Text color="red" wrap="truncate-end">
                            {selectedPreset.error}
                        </Text>
                    ) : null}
                </Box>
            ) : null}
        </TitledBox>
    );
}

function PresetRow({ preset, selected }) {
    const color = preset.error ? 'red' : selected ? 'green' : undefined;

    return (
        <Box>
            <Box width={30} flexShrink={0}>
                <Text color={color} wrap="truncate-end">
                    {selected ? '▶ ' : '  '}
                    {preset.name.padEnd(27)}
                </Text>
            </Box>
            <Box flexShrink={1}>
                <Text dimColor wrap="truncate-end">
                    {preset.id}
                </Text>
            </Box>
        </Box>
    );
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

function clampSelection(index, length) {
    return clamp(index, 0, Math.max(0, length - 1));
}

function clamp(value, min, max) {
    if (max < min) {
        return min;
    }

    return Math.max(min, Math.min(value, max));
}

export { PresetsMenu };
