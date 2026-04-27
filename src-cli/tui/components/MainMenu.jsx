import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';

const MAIN_MENU_TITLES = ['Main Menu'];

const MENU_ITEMS = [
    {
        key: 'layout',
        label: 'Prompt Layout',
        detail: 'Edit structure and jump into slot detail routes.',
    },
    {
        key: 'presets',
        label: 'Presets',
        detail: 'Browse bundled prompt presets and apply one.',
    },
    { key: 'save', label: 'Save', detail: 'Write starship.toml.' },
    { key: 'reload', label: 'Reload', detail: 'Reload current config.' },
    { key: 'exit', label: 'Exit', detail: 'Leave the TUI.' },
];

function MainMenu({ dirty, initialSelection = 0, onSelectionChange, onSelect, interactive }) {
    const items = useMemo(() => MENU_ITEMS, []);
    const onSelectionChangeRef = useRef(onSelectionChange);
    const onSelectRef = useRef(onSelect);
    const selectedIndexRef = useRef(clampIndex(initialSelection, items.length));
    const [selectedIndex, setSelectedIndex] = useState(() =>
        clampIndex(initialSelection, items.length)
    );
    const activeSelectedIndex = clampIndex(selectedIndex, items.length);

    onSelectionChangeRef.current = onSelectionChange;
    onSelectRef.current = onSelect;
    selectedIndexRef.current = activeSelectedIndex;

    const moveSelection = useCallback(
        (step) => {
            const currentIndex = selectedIndexRef.current;
            const nextIndex = normalizeCircularIndex(currentIndex + step, items.length);

            if (nextIndex === currentIndex) {
                return;
            }

            selectedIndexRef.current = nextIndex;
            setSelectedIndex(nextIndex);
        },
        [items.length]
    );

    const cacheSelection = useCallback(() => {
        onSelectionChangeRef.current?.(selectedIndexRef.current);
    }, []);

    const handleInput = useCallback(
        (input, key) => {
            if (key.upArrow) {
                moveSelection(-1);
                return;
            }

            if (key.downArrow) {
                moveSelection(1);
                return;
            }

            if (key.return) {
                cacheSelection();
                onSelectRef.current?.(items[selectedIndexRef.current]?.key);
                return;
            }
        },
        [cacheSelection, items, moveSelection]
    );

    useInput(handleInput, { isActive: interactive });

    return (
        <TitledBox
            flexDirection="column"
            borderStyle="round"
            borderColor="green"
            paddingX={1}
            titles={MAIN_MENU_TITLES}
        >
            <Text dimColor>
                {dirty ? 'Unsaved changes are waiting.' : 'Everything is in sync.'}
            </Text>
            <Box marginTop={1} flexDirection="column">
                {items.map((item, index) => {
                    const selected = index === activeSelectedIndex;
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

function clampIndex(index, length) {
    if (length <= 0) {
        return 0;
    }

    if (!Number.isInteger(index)) {
        return 0;
    }

    return Math.max(0, Math.min(index, length - 1));
}

export { MainMenu };
