import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

import {
    addSeparatorPreset,
    removeSeparatorPreset,
    setSeparatorActiveIndex,
    updateSeparatorPreset,
} from '../../utils/settings-mutations.js';

export function SeparatorEditor({ settings, onChange, onBack, interactive }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [editBuffer, setEditBuffer] = useState('');
    const presets = settings.separator.presets;

    useInput(
        (input, key) => {
            if (editMode) {
                if (key.escape) {
                    setEditMode(false);
                    setEditBuffer('');
                    return;
                }

                if (key.return) {
                    const next = updateSeparatorPreset(settings, selectedIndex, editBuffer);
                    onChange(next);
                    setEditMode(false);
                    setEditBuffer('');
                    return;
                }

                if (key.backspace || key.delete) {
                    setEditBuffer((previous) => previous.slice(0, -1));
                    return;
                }

                if (input) {
                    setEditBuffer((previous) => previous + input);
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
                    Math.min(Math.max(0, presets.length - 1), previous + 1)
                );
                return;
            }

            if (key.leftArrow) {
                onChange(setSeparatorActiveIndex(settings, selectedIndex));
                return;
            }

            if (key.rightArrow) {
                onChange(setSeparatorActiveIndex(settings, selectedIndex));
                return;
            }

            if (input === 'a' || input === 'A') {
                const next = addSeparatorPreset(settings, '|');
                onChange(next);
                setSelectedIndex(next.separator.presets.length - 1);
                return;
            }

            if (input === 'e' || input === 'E' || key.return) {
                const current = presets[selectedIndex];
                if (typeof current === 'string') {
                    setEditMode(true);
                    setEditBuffer(current);
                }
                return;
            }

            if (input === 'd' || input === 'D') {
                const { settings: next, index } = removeSeparatorPreset(settings, selectedIndex);
                onChange(next);
                setSelectedIndex(index);
            }
        },
        { isActive: interactive }
    );

    return (
        <Box flexDirection="column">
            <Text bold>Separator Presets</Text>
            <Text dimColor>
                ↑↓ select, Enter/E edit selected, A add preset, D delete preset, ←/→ set active, ESC
                back
            </Text>
            {editMode && (
                <Text color="cyan">
                    editing: {editBuffer}
                    <Text inverse> </Text>
                </Text>
            )}
            <Box marginTop={1} flexDirection="column">
                {presets.map((preset, index) => {
                    const selected = index === selectedIndex;
                    const active = index === settings.separator.activeIndex;
                    return (
                        <Text key={`${preset}-${index}`} color={selected ? 'green' : undefined}>
                            {selected ? '▶ ' : '  '}
                            {active ? '[active] ' : '         '}#{index} "{preset}"
                        </Text>
                    );
                })}
            </Box>
            <Box marginTop={1} flexDirection="column">
                <Text dimColor>Design Note:</Text>
                <Text dimColor>
                    Prompt items store separator index, so separator is a first-class config object.
                </Text>
            </Box>
        </Box>
    );
}
