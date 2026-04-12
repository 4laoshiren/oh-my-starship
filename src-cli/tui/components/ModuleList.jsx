import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

import { MODULE_GROUPS } from '../../types/settings.js';

function ModuleList({ settings, onBack, onSelect, interactive }) {
    const modules = MODULE_GROUPS.flatMap((group) =>
        group.modules.map((moduleKey) => ({
            group: group.label,
            moduleKey,
        }))
    );
    const [selectedIndex, setSelectedIndex] = useState(0);

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
        <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1}>
            <Text bold>Modules</Text>
            <Text dimColor>↑↓ select Enter open ESC back</Text>
            <Box marginTop={1} flexDirection="column">
                {modules.map((entry, index) => {
                    const selected = index === selectedIndex;
                    const moduleConfig = settings.modules[entry.moduleKey] || {};
                    const disabled = Boolean(moduleConfig.disabled);

                    return (
                        <Text key={entry.moduleKey} color={selected ? 'green' : undefined}>
                            {selected ? '▶ ' : '  '}
                            {entry.group.padEnd(12)}
                            {entry.moduleKey.padEnd(12)}
                            <Text dimColor>{disabled ? 'disabled' : 'active'}</Text>
                        </Text>
                    );
                })}
            </Box>
        </Box>
    );
}

function clamp(value, min, max) {
    if (max < min) {
        return min;
    }
    return Math.max(min, Math.min(value, max));
}

export { ModuleList };
