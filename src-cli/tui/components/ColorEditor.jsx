import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';

import {
    buildColorTargets,
    clearColorTargetChannel,
    updateColorTarget,
} from '../../utils/color-targets.js';
import {
    colorToInk,
    cycleNamedColor,
    displayColorName,
    normalizeAnsiInput,
    normalizeHexInput,
} from '../../utils/colors.js';

function ColorEditor({ settings, onChange, onBack, interactive }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [editingChannel, setEditingChannel] = useState('bg');
    const [inputMode, setInputMode] = useState(null);
    const [buffer, setBuffer] = useState('');
    const targets = useMemo(() => buildColorTargets(settings), [settings]);
    const safeSelectedIndex = clamp(selectedIndex, 0, Math.max(0, targets.length - 1));
    const selectedTarget = targets[safeSelectedIndex] || null;
    const currentValue = selectedTarget ? selectedTarget[editingChannel] || '' : '';

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

            if (targets.length === 0) {
                return;
            }

            if (key.upArrow) {
                setSelectedIndex((previous) => clamp(previous - 1, 0, targets.length - 1));
                return;
            }

            if (key.downArrow) {
                setSelectedIndex((previous) => clamp(previous + 1, 0, targets.length - 1));
                return;
            }

            if (key.leftArrow || key.rightArrow) {
                const nextColor = cycleNamedColor(currentValue, key.rightArrow ? 1 : -1);
                onChange(updateColorTarget(settings, selectedTarget.id, editingChannel, nextColor));
                return;
            }

            if (input === 'f' || input === 'F' || key.tab) {
                setEditingChannel((previous) => (previous === 'fg' ? 'bg' : 'fg'));
                return;
            }

            if (input === 'r' || input === 'R') {
                onChange(clearColorTargetChannel(settings, selectedTarget.id, editingChannel));
                return;
            }

            if (input === 'h' || input === 'H') {
                setInputMode('hex');
                setBuffer(stripLeadingHash(currentValue));
                return;
            }

            if (input === 'a' || input === 'A') {
                setInputMode('ansi');
                setBuffer(stripAnsiPrefix(currentValue));
            }
        },
        { isActive: interactive }
    );

    const helpText = inputMode
        ? inputMode === 'hex'
            ? 'Type 6 hex digits, Enter apply, ESC cancel'
            : 'Type ANSI 0-255, Enter apply, ESC cancel'
        : '↑↓ select  ←→ named color  F switch fg/bg  H hex  A ansi256  R clear channel  ESC back';

    return (
        <TitledBox
            flexDirection="column"
            borderStyle="round"
            borderColor="blue"
            paddingX={1}
            titles={['Edit Color']}
        >
            <Text dimColor>
                Edit visible prompt segment colors directly. Preview updates on every change.
            </Text>
            <Text dimColor>{helpText}</Text>
            <Text dimColor>
                Editing channel:{' '}
                <Text color={editingChannel === 'fg' ? 'green' : 'yellow'}>
                    {editingChannel === 'fg' ? 'foreground' : 'background'}
                </Text>
            </Text>

            {inputMode ? <InputModeView inputMode={inputMode} buffer={buffer} /> : null}

            {targets.length === 0 ? (
                <Box marginTop={1} flexDirection="column">
                    <Text dimColor>No editable color targets found in the current prompt.</Text>
                    <Text dimColor>Add styled text or modules with visible styles first.</Text>
                </Box>
            ) : (
                <>
                    <Box marginTop={1} flexDirection="column">
                        {targets.map((target, index) => {
                            const selected = index === safeSelectedIndex;
                            return (
                                <ColorTargetRow
                                    key={target.id}
                                    target={target}
                                    selected={selected}
                                    editingChannel={editingChannel}
                                />
                            );
                        })}
                    </Box>
                    {selectedTarget ? (
                        <SelectionSummary target={selectedTarget} editingChannel={editingChannel} />
                    ) : null}
                </>
            )}
        </TitledBox>
    );

    function handleInputMode(input, key) {
        if (key.escape) {
            resetInputMode();
            return;
        }

        if (key.return) {
            if (!selectedTarget) {
                resetInputMode();
                return;
            }

            const nextValue =
                inputMode === 'hex' ? normalizeHexInput(buffer) : normalizeAnsiInput(buffer);

            if (nextValue) {
                onChange(updateColorTarget(settings, selectedTarget.id, editingChannel, nextValue));
                resetInputMode();
            }
            return;
        }

        if (key.backspace || key.delete) {
            setBuffer((previous) => previous.slice(0, -1));
            return;
        }

        if (!input) {
            return;
        }

        if (inputMode === 'hex') {
            const upperInput = input.toUpperCase();
            if (/^[0-9A-F]$/.test(upperInput) && buffer.length < 6) {
                setBuffer((previous) => previous + upperInput);
            }
            return;
        }

        if (/^\d$/.test(input) && buffer.length < 3) {
            const nextValue = `${buffer}${input}`;
            const parsed = Number.parseInt(nextValue, 10);
            if (parsed <= 255) {
                setBuffer(nextValue);
            }
        }
    }

    function resetInputMode() {
        setInputMode(null);
        setBuffer('');
    }
}

function ColorTargetRow({ target, selected, editingChannel }) {
    const fgPreview = colorToInk(target.fg);
    const bgPreview = colorToInk(target.bg);
    const activeColor = editingChannel === 'fg' ? target.fg : target.bg;
    const activeLabel = displayColorName(activeColor);

    return (
        <Box>
            <Text color={selected ? 'green' : undefined}>
                {selected ? '▶ ' : '  '}
                {target.label.padEnd(18)}
            </Text>
            <Text
                color={fgPreview}
                backgroundColor={bgPreview}
            >{` ${target.type === 'module' ? target.label : target.hint.replaceAll('"', '')} `}</Text>
            <Text dimColor>{`  ${editingChannel.toUpperCase()}: ${activeLabel}`}</Text>
        </Box>
    );
}

function SelectionSummary({ target, editingChannel }) {
    const fgPreview = colorToInk(target.fg);
    const bgPreview = colorToInk(target.bg);

    return (
        <Box marginTop={1} flexDirection="column">
            <Text dimColor>{target.hint}</Text>
            <Text>
                Current:{' '}
                <Text color={fgPreview} backgroundColor={bgPreview}>
                    {` fg ${displayColorName(target.fg)} · bg ${displayColorName(target.bg)} `}
                </Text>
                <Text dimColor>{`  editing ${editingChannel}`}</Text>
            </Text>
        </Box>
    );
}

function InputModeView({ inputMode, buffer }) {
    if (inputMode === 'hex') {
        return (
            <Box marginTop={1} flexDirection="column">
                <Text>HEX</Text>
                <Text>
                    #{buffer}
                    <Text dimColor>{'_'.repeat(Math.max(0, 6 - buffer.length))}</Text>
                </Text>
            </Box>
        );
    }

    return (
        <Box marginTop={1} flexDirection="column">
            <Text>ANSI 256</Text>
            <Text>
                {buffer}
                <Text dimColor>{'_'.repeat(Math.max(0, 3 - buffer.length))}</Text>
            </Text>
        </Box>
    );
}

function stripLeadingHash(value) {
    if (!value) {
        return '';
    }

    if (value.startsWith('#')) {
        return value.slice(1).toUpperCase();
    }

    if (value.startsWith('hex:')) {
        return value.slice('hex:'.length).toUpperCase();
    }

    return '';
}

function stripAnsiPrefix(value) {
    if (!value) {
        return '';
    }

    if (value.startsWith('ansi256:')) {
        return value.slice('ansi256:'.length);
    }

    if (/^\d+$/.test(value)) {
        return value;
    }

    return '';
}

function clamp(value, min, max) {
    if (max < min) {
        return min;
    }

    return Math.max(min, Math.min(value, max));
}

export { ColorEditor };
