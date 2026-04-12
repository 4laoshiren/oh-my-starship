import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';

const MENU_ITEMS = [
    {
        key: 'layout',
        label: 'Prompt Layout',
        detail: 'Edit content lines only.',
    },
    {
        key: 'powerline-frame',
        label: 'Powerline Frame',
        detail: 'Edit hidden separator and caps.',
    },
    { key: 'modules', label: 'Modules', detail: 'Module fields and nested maps.' },
    { key: 'save', label: 'Save', detail: 'Write starship.toml.' },
    { key: 'reload', label: 'Reload', detail: 'Reload current config.' },
    { key: 'exit', label: 'Exit', detail: 'Leave the TUI.' },
];

function MainMenu({ dirty, onSelect, interactive }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const items = useMemo(() => MENU_ITEMS, []);

    useInput(
        (input, key) => {
            if (key.upArrow) {
                setSelectedIndex((previous) => normalizeCircularIndex(previous - 1, items.length));
                return;
            }

            if (key.downArrow) {
                setSelectedIndex((previous) => normalizeCircularIndex(previous + 1, items.length));
                return;
            }

            if (key.return) {
                onSelect(items[selectedIndex]?.key);
                return;
            }

            if (input === 's' || input === 'S') {
                onSelect('save');
            }
        },
        { isActive: interactive }
    );

    return (
        <TitledBox flexDirection="column" borderStyle="round" borderColor="green" paddingX={1} titles={['Main Menu']}>

            <Text dimColor>
                {dirty ? 'Unsaved changes are waiting.' : 'Everything is in sync.'}
            </Text>
            <Text dimColor>↑↓ move Enter open S quick save</Text>
            <Box marginTop={1} flexDirection="column">
                {items.map((item, index) => {
                    const selected = index === selectedIndex;
                    return (
                        <Text key={item.key} color={selected ? 'green' : undefined}>
                            {selected ? '▶ ' : '  '}
                            {item.label.padEnd(18)}
                            <Text dimColor>{item.detail}</Text>
                        </Text>
                    );
                })}
            </Box>
        </TitledBox>
    );
}

function normalizeCircularIndex(index, length) {
    if (length <= 0) {
        return 0;
    }

    return ((index % length) + length) % length;
}

export { MainMenu };
