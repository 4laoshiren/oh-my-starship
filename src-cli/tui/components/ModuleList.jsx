import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';

import { MODULE_GROUPS } from '../../types/settings.js';

const MIN_VIEWPORT_ROWS = 4;
const MAX_VIEWPORT_ROWS = 12;
const VIEWPORT_RESERVED_ROWS = 18;

function ModuleList({ settings, onBack, onSelect, interactive, terminalHeight }) {
    const modules = MODULE_GROUPS.flatMap((group) =>
        group.modules.map((moduleKey) => ({
            group: group.label,
            moduleKey,
        }))
    );
    const [selectedIndex, setSelectedIndex] = useState(0);
    const viewport = buildViewport(
        modules,
        selectedIndex,
        Math.max(1, resolveViewportRowCount(terminalHeight) - 2)
    );

    useInput(
        (input, key) => {
            if (key.escape) {
                onBack();
                return;
            }

            if (key.upArrow) {
                setSelectedIndex((previous) => clamp(previous - 1, 0, modules.length - 1));
                return;
            }

            if (key.downArrow) {
                setSelectedIndex((previous) => clamp(previous + 1, 0, modules.length - 1));
                return;
            }

            if (key.return) {
                onSelect(modules[selectedIndex]?.moduleKey);
                return;
            }

            if (input === ' ') {
                onSelect(modules[selectedIndex]?.moduleKey);
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
            titles={['Modules']}
        >
            <Text dimColor>↑↓ select Enter open ESC back</Text>
            <Box marginTop={1} flexDirection="column">
                {viewport.hiddenBefore > 0 ? (
                    <Text
                        dimColor
                    >{`↑ ${viewport.hiddenBefore} more module${viewport.hiddenBefore === 1 ? '' : 's'}`}</Text>
                ) : null}
                {viewport.items.map((entry, offset) => {
                    const index = viewport.startIndex + offset;
                    const selected = index === selectedIndex;
                    const moduleConfig = settings.modules[entry.moduleKey] || {};
                    const disabled = Boolean(moduleConfig.disabled);

                    return (
                        <Text
                            key={entry.moduleKey}
                            color={selected ? 'green' : undefined}
                            wrap="truncate-end"
                        >
                            {selected ? '▶ ' : '  '}
                            {entry.group.padEnd(12)}
                            {entry.moduleKey.padEnd(12)}
                            <Text dimColor>{disabled ? 'disabled' : 'active'}</Text>
                        </Text>
                    );
                })}
                {viewport.hiddenAfter > 0 ? (
                    <Text
                        dimColor
                    >{`↓ ${viewport.hiddenAfter} more module${viewport.hiddenAfter === 1 ? '' : 's'}`}</Text>
                ) : null}
            </Box>
        </TitledBox>
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

function clamp(value, min, max) {
    if (max < min) {
        return min;
    }
    return Math.max(min, Math.min(value, max));
}

export { ModuleList };
