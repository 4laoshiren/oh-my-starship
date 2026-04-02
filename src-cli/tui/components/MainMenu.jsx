import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';

const MENU_ITEMS = [
    { key: 'prompt-items', label: 'Prompt Items' },
    { key: 'separator-presets', label: 'Separator Presets' },
    { key: 'character', label: 'Character Module' },
    { key: 'directory', label: 'Directory Module' },
    { key: 'git_branch', label: 'Git Branch Module' },
    { key: 'git_status', label: 'Git Status Module' },
    { key: 'time', label: 'Time Module' },
    { key: 'save', label: 'Save To starship.toml' },
    { key: 'save-exit', label: 'Save And Exit' },
    { key: 'exit', label: 'Exit' },
];

export function MainMenu({ onSelect, interactive }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const items = useMemo(() => MENU_ITEMS, []);

    useInput(
        (input, key) => {
            if (key.upArrow) {
                setSelectedIndex((previous) => normalizeIndex(previous - 1, items.length));
                return;
            }

            if (key.downArrow) {
                setSelectedIndex((previous) => normalizeIndex(previous + 1, items.length));
                return;
            }

            if (key.return) {
                const selected = items[selectedIndex];
                if (selected) {
                    onSelect(selected.key);
                }
                return;
            }

            if (input === 's' || input === 'S') {
                onSelect('save');
            }
        },
        { isActive: interactive }
    );

    return (
        <Box flexDirection="column">
            <Text bold>Main Menu</Text>
            <Text dimColor>↑↓ move, Enter confirm, S quick save</Text>
            <Box flexDirection="column" marginTop={1}>
                {items.map((item, index) => {
                    const selected = index === selectedIndex;
                    return (
                        <Text key={item.key} color={selected ? 'green' : undefined}>
                            {selected ? '▶ ' : '  '}
                            {item.label}
                        </Text>
                    );
                })}
            </Box>
        </Box>
    );
}

function normalizeIndex(index, length) {
    if (length <= 0) {
        return 0;
    }
    return ((index % length) + length) % length;
}
