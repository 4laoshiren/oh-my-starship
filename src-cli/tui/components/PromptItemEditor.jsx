import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';

import { SEPARATOR_PRESETS } from '../../types/settings.js';
import { clearColorTargetChannel, updateColorTarget } from '../../utils/color-targets.js';
import { colorToInk, cycleNamedColor, displayColorName } from '../../utils/colors.js';
import { parseStyle, resolvePromptItemBackground } from '../../utils/prompt-format.js';
import {
    replacePromptItem,
    togglePromptFrameInvert,
    updatePromptItem,
} from '../../utils/settings-mutations.js';

const MIN_VIEWPORT_ROWS = 4;
const MAX_VIEWPORT_ROWS = 12;
const VIEWPORT_RESERVED_ROWS = 20;

function PromptItemEditor({
    settings,
    lineIndex,
    itemIndex,
    onBack,
    onChange,
    interactive,
    terminalHeight,
}) {
    const descriptor = useMemo(
        () => buildEditorDescriptor(settings, lineIndex, itemIndex),
        [itemIndex, lineIndex, settings]
    );
    const rows = descriptor?.rows || [];
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [inputMode, setInputMode] = useState(null);
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
                if (selectedRow.kind === 'boolean') {
                    commitRowChange(applyBooleanRow(settings, lineIndex, itemIndex, selectedRow));
                    return;
                }

                if (selectedRow.kind === 'glyph') {
                    const nextGlyph = cyclePresetGlyph(selectedRow.value, key.rightArrow ? 1 : -1);
                    commitRowChange(
                        updatePromptItem(settings, lineIndex, itemIndex, {
                            glyph: nextGlyph,
                        })
                    );
                    return;
                }

                if (selectedRow.kind === 'color' && selectedRow.editable) {
                    const nextColor = cycleNamedColor(selectedRow.value, key.rightArrow ? 1 : -1);
                    commitRowChange(applyColorRowValue(settings, selectedRow, nextColor));
                }
                return;
            }

            if (input === 'r' || input === 'R') {
                if (selectedRow.kind === 'color' && selectedRow.editable) {
                    commitRowChange(applyColorRowValue(settings, selectedRow, ''));
                }
                return;
            }

            if (key.return || input === 'e' || input === 'E') {
                if (selectedRow.kind === 'boolean') {
                    commitRowChange(applyBooleanRow(settings, lineIndex, itemIndex, selectedRow));
                    return;
                }

                if (!selectedRow.editable) {
                    return;
                }

                setInputMode({
                    rowKey: selectedRow.key,
                });
                setBuffer(selectedRow.rawValue);
            }
        },
        { isActive: interactive }
    );

    return (
        <TitledBox
            flexDirection="column"
            borderStyle="round"
            borderColor="cyan"
            paddingX={1}
            titles={[descriptor?.title || 'Prompt Slot']}
        >
            <Text dimColor>{helpText}</Text>
            <Text dimColor>
                {descriptor?.subtitle || 'Select a field to edit this prompt slot.'}
            </Text>
            {inputMode ? (
                <Text color="cyan">
                    value: {buffer}
                    <Text inverse> </Text>
                </Text>
            ) : null}
            <Box marginTop={1} flexDirection="column">
                <Text dimColor>Preview</Text>
                <InlinePreview segments={descriptor?.previewSegments || []} />
            </Box>
            <Box marginTop={1} flexDirection="column">
                {rows.length === 0 ? (
                    <Text dimColor>This slot does not expose editable fields.</Text>
                ) : (
                    <>
                        {viewport.hiddenBefore > 0 ? (
                            <Text
                                dimColor
                            >{`↑ ${viewport.hiddenBefore} more field${viewport.hiddenBefore === 1 ? '' : 's'}`}</Text>
                        ) : null}
                        {viewport.items.map((row, offset) => {
                            const index = viewport.startIndex + offset;
                            const selected = index === activeSelectedIndex;
                            return <EditorRow key={row.key} row={row} selected={selected} />;
                        })}
                        {viewport.hiddenAfter > 0 ? (
                            <Text
                                dimColor
                            >{`↓ ${viewport.hiddenAfter} more field${viewport.hiddenAfter === 1 ? '' : 's'}`}</Text>
                        ) : null}
                    </>
                )}
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
            setInputMode(null);
            setBuffer('');
            return;
        }

        if (key.return) {
            if (!selectedRow) {
                setInputMode(null);
                setBuffer('');
                return;
            }

            commitRowChange(
                applyBufferedValue(settings, lineIndex, itemIndex, selectedRow, buffer)
            );
            setInputMode(null);
            setBuffer('');
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

    function commitRowChange(nextSettings) {
        if (!nextSettings) {
            return;
        }

        onChange(nextSettings);
    }
}

function EditorRow({ row, selected }) {
    const accentColor = selected ? 'green' : undefined;
    const marker = selected ? '▶ ' : '  ';

    return (
        <Box>
            <Box width={20} flexShrink={0}>
                <Text color={accentColor} wrap="truncate-end">
                    {marker}
                    {row.label.padEnd(17)}
                </Text>
            </Box>
            <Box flexShrink={1} marginRight={row.metaText ? 1 : 0}>
                <RowValue row={row} />
            </Box>
            {row.metaText ? (
                <Box flexGrow={1} flexShrink={1}>
                    <Text dimColor wrap="truncate-end">
                        {row.metaText}
                    </Text>
                </Box>
            ) : null}
        </Box>
    );
}

function RowValue({ row }) {
    if (row.kind === 'color') {
        return (
            <Box>
                <Text dimColor>{displayColorName(row.value)}</Text>
                {colorToInk(row.value) ? (
                    <Text backgroundColor={colorToInk(row.value)}>{'    '}</Text>
                ) : null}
            </Box>
        );
    }

    if (row.kind === 'boolean') {
        return <Text>{row.value ? 'true' : 'false'}</Text>;
    }

    return <Text wrap="truncate-end">{formatVisibleValue(row.value)}</Text>;
}

function InlinePreview({ segments }) {
    const visibleSegments = segments.filter((segment) => Boolean(segment.text));

    if (visibleSegments.length === 0) {
        return <Text dimColor>(none)</Text>;
    }

    return (
        <Text wrap="truncate-end">
            {visibleSegments.map((segment, index) => (
                <Text
                    key={`${index}-${segment.text}`}
                    color={colorToInk(segment.fg)}
                    backgroundColor={colorToInk(segment.bg)}
                    dimColor={Boolean(segment.dim)}
                >
                    {segment.text}
                </Text>
            ))}
        </Text>
    );
}

function buildEditorDescriptor(settings, lineIndex, itemIndex) {
    const line = settings.prompt.lines[lineIndex] || [];
    const item = line[itemIndex];

    if (!item) {
        return {
            title: `Prompt Slot ${itemIndex + 1}`,
            subtitle: 'The selected slot no longer exists.',
            previewSegments: [],
            rows: [],
        };
    }

    if (item.type === 'frame') {
        return buildFrameDescriptor(settings, lineIndex, itemIndex, line, item);
    }

    return buildTextDescriptor(settings, lineIndex, itemIndex, item);
}

function buildTextDescriptor(settings, lineIndex, itemIndex, item) {
    const styleValue = item.type === 'styledText' ? item.style || 'none' : 'none';
    const parsedStyle = parseStyle(styleValue);
    const slot = String(itemIndex + 1).padStart(2, '0');

    return {
        title: `Prompt Text ${slot}`,
        subtitle:
            item.type === 'rawText'
                ? 'Raw text upgrades into styled text when you edit style or colors.'
                : 'Literal prompt text with inline style and color fields.',
        previewSegments: [
            {
                text: item.text || ' ',
                fg: parsedStyle.fg || '',
                bg: parsedStyle.bg || '',
                dim: false,
            },
        ],
        rows: [
            {
                key: 'text',
                label: 'text',
                kind: 'text',
                value: item.text || '',
                rawValue: item.text || '',
                editable: true,
                metaText: null,
                description: 'Literal text rendered in this prompt slot.',
            },
            {
                key: 'style',
                label: 'style',
                kind: 'style',
                value: styleValue,
                rawValue: styleValue,
                editable: true,
                metaText: item.type === 'rawText' ? 'auto-upgrade' : null,
                description:
                    'Full Starship style string. Editing it writes into the slot style field.',
            },
            {
                key: 'fg',
                label: 'foreground',
                kind: 'color',
                value: parsedStyle.fg || '',
                rawValue: parsedStyle.fg || '',
                editable: true,
                metaText: 'segment text',
                description: 'Foreground color for this text segment.',
                target: {
                    kind: 'prompt-item',
                    lineIndex,
                    itemIndex,
                    channel: 'fg',
                    ensureStyled: true,
                },
            },
            {
                key: 'bg',
                label: 'background',
                kind: 'color',
                value: parsedStyle.bg || '',
                rawValue: parsedStyle.bg || '',
                editable: true,
                metaText: 'frame source',
                description: 'Background color for this text segment and any adjacent frame.',
                target: {
                    kind: 'prompt-item',
                    lineIndex,
                    itemIndex,
                    channel: 'bg',
                    ensureStyled: true,
                },
            },
        ],
    };
}

function buildFrameDescriptor(settings, lineIndex, itemIndex, line, item) {
    const previousLink = findAdjacentContentLink(settings, lineIndex, line, itemIndex, -1);
    const nextLink = findAdjacentContentLink(settings, lineIndex, line, itemIndex, 1);
    const previousBg = previousLink?.bg || '';
    const nextBg = nextLink?.bg || '';
    const previewFg = item.invert ? nextBg || previousBg : previousBg || nextBg;
    const previewBg = item.invert ? previousBg || '' : nextBg || '';
    const slot = String(itemIndex + 1).padStart(2, '0');

    return {
        title: `Prompt Frame ${slot}`,
        subtitle:
            'Frame color comes from the background of the content on each side of the separator.',
        previewSegments: [
            {
                text: item.glyph || SEPARATOR_PRESETS[0] || '',
                fg: previewFg,
                bg: previewBg,
                dim: false,
            },
        ],
        rows: [
            {
                key: 'glyph',
                label: 'glyph',
                kind: 'glyph',
                value: item.glyph || SEPARATOR_PRESETS[0] || '',
                rawValue: item.glyph || SEPARATOR_PRESETS[0] || '',
                editable: true,
                metaText: 'separator',
                description: 'Visible separator glyph. Use ←→ to cycle presets or E to type one.',
            },
            {
                key: 'invert',
                label: 'invert',
                kind: 'boolean',
                value: Boolean(item.invert),
                rawValue: Boolean(item.invert) ? 'true' : 'false',
                editable: true,
                metaText: item.invert ? 'swapped' : 'normal',
                description: 'Swap which side paints the foreground versus background.',
            },
            buildLinkedColorRow('left-bg', 'left bg', previousLink, 'left'),
            buildLinkedColorRow('right-bg', 'right bg', nextLink, 'right'),
        ],
    };
}

function buildLinkedColorRow(key, label, link, side) {
    if (!link) {
        return {
            key,
            label,
            kind: 'color',
            value: '',
            rawValue: '',
            editable: false,
            metaText: '(edge)',
            description:
                side === 'left'
                    ? 'This frame sits at the left edge of the line.'
                    : 'This frame sits at the right edge of the line.',
            target: null,
        };
    }

    return {
        key,
        label,
        kind: 'color',
        value: link.bg || '',
        rawValue: link.bg || '',
        editable: true,
        metaText: link.label,
        description: `Background color sourced from ${link.label}. Editing it repaints this side of the frame.`,
        target: link.target,
    };
}

function findAdjacentContentLink(settings, lineIndex, line, startIndex, step) {
    for (let index = startIndex + step; index >= 0 && index < line.length; index += step) {
        const item = line[index];
        if (!item || item.type === 'frame') {
            continue;
        }

        if (item.type === 'module') {
            return {
                label: `$${item.module}`,
                bg: resolvePromptItemBackground(item, settings.modules),
                target: {
                    kind: 'module',
                    moduleKey: item.module,
                    channel: 'bg',
                },
            };
        }

        return {
            label: item.type === 'styledText' ? `text ${index + 1}` : `raw text ${index + 1}`,
            bg: resolvePromptItemBackground(item, settings.modules),
            target: {
                kind: 'prompt-item',
                lineIndex,
                itemIndex: index,
                channel: 'bg',
                ensureStyled: item.type === 'rawText',
            },
        };
    }

    return null;
}

function applyBooleanRow(settings, lineIndex, itemIndex, row) {
    if (row.key === 'invert') {
        return togglePromptFrameInvert(settings, lineIndex, itemIndex);
    }

    return settings;
}

function applyBufferedValue(settings, lineIndex, itemIndex, row, value) {
    if (row.kind === 'text') {
        return updatePromptItem(settings, lineIndex, itemIndex, {
            text: value,
        });
    }

    if (row.kind === 'style') {
        const nextSettings = ensureStyledPromptItem(settings, lineIndex, itemIndex);
        return updatePromptItem(nextSettings, lineIndex, itemIndex, {
            style: value || 'none',
        });
    }

    if (row.kind === 'glyph') {
        return updatePromptItem(settings, lineIndex, itemIndex, {
            glyph: value || SEPARATOR_PRESETS[0] || '',
        });
    }

    if (row.kind === 'color') {
        return applyColorRowValue(settings, row, value);
    }

    return settings;
}

function applyColorRowValue(settings, row, rawValue) {
    if (!row.target) {
        return settings;
    }

    let nextSettings = settings;
    const nextValue = String(rawValue || '').trim();

    if (row.target.kind === 'prompt-item' && row.target.ensureStyled) {
        nextSettings = ensureStyledPromptItem(
            nextSettings,
            row.target.lineIndex,
            row.target.itemIndex
        );
    }

    const targetId =
        row.target.kind === 'module'
            ? `module:${row.target.moduleKey}`
            : `prompt:${row.target.lineIndex}:${row.target.itemIndex}`;

    if (!nextValue) {
        return clearColorTargetChannel(nextSettings, targetId, row.target.channel);
    }

    return updateColorTarget(nextSettings, targetId, row.target.channel, nextValue);
}

function ensureStyledPromptItem(settings, lineIndex, itemIndex) {
    const item = settings.prompt.lines[lineIndex]?.[itemIndex];
    if (!item || item.type === 'styledText') {
        return settings;
    }

    if (item.type !== 'rawText') {
        return settings;
    }

    return replacePromptItem(settings, lineIndex, itemIndex, 'styledText', {
        text: item.text || '',
        style: 'none',
    });
}

function cyclePresetGlyph(currentGlyph, step) {
    const currentIndex = SEPARATOR_PRESETS.indexOf(currentGlyph);
    const startIndex = currentIndex === -1 ? 0 : currentIndex;
    return (
        SEPARATOR_PRESETS[normalizeCircularIndex(startIndex + step, SEPARATOR_PRESETS.length)] ||
        SEPARATOR_PRESETS[0] ||
        ''
    );
}

function buildHelpText(selectedRow, inputMode) {
    if (inputMode) {
        return 'Editing value. Enter save  ESC cancel';
    }

    if (!selectedRow) {
        return '↑↓ select field  ESC back';
    }

    if (selectedRow.kind === 'boolean') {
        return '↑↓ select field  Enter/E toggle  ESC back';
    }

    if (selectedRow.kind === 'glyph') {
        return '↑↓ select field  ←→ cycle preset  Enter/E edit  ESC back';
    }

    if (selectedRow.kind === 'color') {
        return selectedRow.editable
            ? '↑↓ select field  ←→ cycle color  Enter/E edit  R clear  ESC back'
            : '↑↓ select field  ESC back';
    }

    return '↑↓ select field  Enter/E edit  ESC back';
}

function formatVisibleValue(value) {
    const text = String(value || '').replaceAll('\n', '\\n');
    if (text.length <= 52) {
        return text;
    }

    return `${text.slice(0, 49)}...`;
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

function normalizeCircularIndex(index, length) {
    if (length <= 0) {
        return 0;
    }

    return ((index % length) + length) % length;
}

function clamp(value, min, max) {
    if (max < min) {
        return min;
    }

    return Math.max(min, Math.min(value, max));
}

export { PromptItemEditor };
