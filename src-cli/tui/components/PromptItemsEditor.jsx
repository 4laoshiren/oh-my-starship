import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';

import { MODULE_ORDER, MODULE_SCHEMAS } from '../../types/settings.js';
import {
    addPromptItem,
    addPromptLine,
    removePromptItem,
    removePromptLine,
    replacePromptItem,
    replacePromptLine,
    updatePromptItem,
} from '../../utils/settings-mutations.js';
import { parseStyle, resolvePromptItemBackground } from '../../utils/prompt-format.js';
import { resolveModuleColors } from '../../utils/color-targets.js';
import { colorToInk } from '../../utils/colors.js';

const MODE_LINES = 'lines';
const MODE_ROWS = 'rows';
const MIN_VIEWPORT_ROWS = 4;
const MAX_VIEWPORT_ROWS = 12;
const VIEWPORT_RESERVED_ROWS = 22;
const CONTENT_TEXT_KEY = 'content:text';
const CONTENT_FRAME_KEY = 'content:frame';
const PICKER_CONTENT = 'content';
const PICKER_FRAME = 'frame';
const FRAME_CUSTOM_KEY = 'frame:custom';
const FRAME_PRESETS = new Map([
    ['Round Right', ''],
    ['Triangle Right', ''],
    ['Thin Round Right', ''],
    ['Thin Triangle Right', ''],
    ['Round Left', ''],
    ['Triangle Left', ''],
    ['Thin Round Left', ''],
    ['Thin Triangle Left', ''],
]);
const LEFT_FACING_FRAME_GLYPHS = new Set(['', '', '', '']);

function LayoutEditor({
    settings,
    onChange,
    onPreviewChange,
    initialSelection,
    onSelectionChange,
    onEditModule,
    onEditPromptItem,
    onBack,
    interactive,
    terminalHeight,
}) {
    const [mode, setMode] = useState(initialSelection?.mode === MODE_ROWS ? MODE_ROWS : MODE_LINES);
    const [selectedLineIndex, setSelectedLineIndex] = useState(initialSelection?.lineIndex || 0);
    const [selectedRowIndex, setSelectedRowIndex] = useState(initialSelection?.rowIndex || 0);
    // move mode 期间只在当前组件里重排，退出时再一次性写回 settings，避免按住方向键时整页重算
    const [moveDraft, setMoveDraft] = useState(null);
    const [picker, setPicker] = useState(null);
    const moveDraftRef = useRef(null);

    const lines = settings.prompt.lines;
    const safeSelectedLineIndex = clamp(selectedLineIndex, 0, Math.max(0, lines.length - 1));
    const moveMode = Boolean(moveDraft);
    const activeLineItems = moveDraft?.lineItems || lines[safeSelectedLineIndex] || [];
    const contentPickerCatalog = useMemo(() => buildContentPickerCatalog(settings), [settings]);
    const framePickerCatalog = useMemo(() => buildFramePickerCatalog(), []);
    const activePickerCatalog =
        picker?.mode === PICKER_FRAME ? framePickerCatalog : contentPickerCatalog;
    const rows = useMemo(
        () => buildLayoutRows(settings, safeSelectedLineIndex, activeLineItems),
        [activeLineItems, safeSelectedLineIndex, settings]
    );
    const activeSelectedRowIndex = clamp(
        moveDraft?.selectedIndex ?? selectedRowIndex,
        0,
        Math.max(0, rows.length - 1)
    );
    const selectedRow = rows[activeSelectedRowIndex] || null;
    const listViewportRows = resolveViewportRowCount(terminalHeight);
    const selectedPickerEntry = picker
        ? activePickerCatalog.entries.find((entry) => entry.key === picker.selectedEntryKey) ||
          activePickerCatalog.entries[0] ||
          null
        : null;

    useInput(
        (input, key) => {
            if (picker) {
                handlePickerInput(input, key);
                return;
            }

            if (moveMode) {
                handleMoveModeInput(key);
                return;
            }

            if (mode === MODE_LINES) {
                handleLineModeInput(input, key);
                return;
            }

            handleRowModeInput(input, key);
        },
        { isActive: interactive }
    );

    const helpText = useMemo(() => {
        if (picker) {
            return buildPickerHelpText(picker);
        }

        if (moveMode) {
            return '↑↓ move row  Enter/ESC done';
        }

        if (mode === MODE_LINES) {
            return '↑↓ select line  Enter edit line  A add line  D delete line  ESC back';
        }

        return buildRowHelpText(selectedRow, moveMode);
    }, [mode, moveMode, picker, selectedRow]);

    useEffect(() => {
        if (!onPreviewChange) {
            return;
        }

        onPreviewChange({
            settings: buildPreviewSettings(settings, safeSelectedLineIndex, activeLineItems),
            fastMode: true,
        });
    }, [activeLineItems, onPreviewChange, safeSelectedLineIndex, settings]);

    useEffect(() => {
        if (!onPreviewChange) {
            return undefined;
        }

        return () => {
            onPreviewChange(null);
        };
    }, [onPreviewChange]);

    useEffect(() => {
        if (!onSelectionChange) {
            return;
        }

        onSelectionChange({
            mode,
            lineIndex: safeSelectedLineIndex,
            rowIndex: activeSelectedRowIndex,
        });
    }, [activeSelectedRowIndex, mode, onSelectionChange, safeSelectedLineIndex]);

    return (
        <TitledBox
            flexDirection="column"
            borderStyle="round"
            borderColor="cyan"
            paddingX={1}
            titles={['Prompt Layout']}
        >
            <Text dimColor>Use E to open the selected slot detail editor.</Text>
            <Text dimColor>{helpText}</Text>
            {mode === MODE_ROWS ? (
                <Box>
                    <Text dimColor>{`Editing Line ${safeSelectedLineIndex + 1}`}</Text>
                    {moveMode ? <Text color="blue"> [MOVE MODE]</Text> : null}
                </Box>
            ) : (
                <Text dimColor>
                    {`${lines.length} line${lines.length === 1 ? '' : 's'} in prompt`}
                </Text>
            )}
            {mode === MODE_LINES ? (
                <LinesView
                    lines={lines}
                    selectedLineIndex={safeSelectedLineIndex}
                    viewportRows={listViewportRows}
                />
            ) : picker ? (
                <PickerView
                    picker={picker}
                    entries={activePickerCatalog.entries}
                    selectedPickerEntry={selectedPickerEntry}
                    viewportRows={listViewportRows}
                />
            ) : (
                <RowsView
                    rows={rows}
                    selectedRowIndex={activeSelectedRowIndex}
                    selectedRow={selectedRow}
                    moveMode={moveMode}
                    viewportRows={listViewportRows}
                />
            )}
        </TitledBox>
    );

    function commitSettings(nextSettings, selection = {}) {
        onChange(nextSettings);

        if (typeof selection.itemIndex === 'number') {
            setSelectedRowIndex(
                findLayoutRowIndexByItemIndex(
                    nextSettings,
                    safeSelectedLineIndex,
                    selection.itemIndex
                )
            );
            return;
        }

        if (selection.rowId) {
            setSelectedRowIndex(
                findLayoutRowIndexById(
                    nextSettings,
                    safeSelectedLineIndex,
                    selection.rowId,
                    selection.fallbackRowIndex
                )
            );
            return;
        }

        if (typeof selection.fallbackRowIndex === 'number') {
            setSelectedRowIndex(selection.fallbackRowIndex);
        }
    }

    function handlePickerInput(input, key) {
        if (picker?.customInput) {
            handleFrameCustomInput(input, key);
            return;
        }

        if (key.escape) {
            closePickerStep();
            return;
        }

        if (key.return) {
            if (selectedPickerEntry) {
                applyPickerSelection(selectedPickerEntry);
            }
            return;
        }

        if (key.upArrow || key.downArrow) {
            const step = key.downArrow ? 1 : -1;

            setPicker((previous) => ({
                ...previous,
                selectedEntryKey: getAdjacentValue(
                    activePickerCatalog.entries.map((entry) => entry.key),
                    previous.selectedEntryKey,
                    step
                ),
            }));
        }
    }

    function handleFrameCustomInput(input, key) {
        if (key.escape) {
            setPicker((previous) => ({
                ...previous,
                customInput: false,
                customFrameBuffer: '',
                selectedEntryKey: FRAME_CUSTOM_KEY,
            }));
            return;
        }

        if (key.return) {
            const glyph = picker.customFrameBuffer || '';
            if (glyph.length > 0) {
                applyFrameSelection({
                    glyph,
                    invert: shouldAutoInvertFrameGlyph(glyph),
                });
            }
            return;
        }

        if (key.backspace || key.delete) {
            setPicker((previous) => ({
                ...previous,
                customFrameBuffer: (previous.customFrameBuffer || '').slice(0, -1),
            }));
            return;
        }

        if (input) {
            setPicker((previous) => ({
                ...previous,
                customFrameBuffer: `${previous.customFrameBuffer || ''}${input}`,
            }));
        }
    }

    function applyPickerSelection(entry) {
        if (!entry) {
            setPicker(null);
            return;
        }

        if (picker?.mode === PICKER_CONTENT && entry.itemType === 'frame') {
            openFramePicker();
            return;
        }

        if (picker?.mode === PICKER_FRAME) {
            if (entry.itemType === 'customFrame') {
                setPicker((previous) => ({
                    ...previous,
                    customInput: true,
                    customFrameBuffer: '',
                    selectedEntryKey: FRAME_CUSTOM_KEY,
                }));
                return;
            }

            applyFrameSelection(entry);
            return;
        }

        if (picker?.action === 'add') {
            const result = addPromptItem(
                settings,
                safeSelectedLineIndex,
                picker.insertAfterItemIndex,
                entry.itemType
            );
            let nextSettings = result.settings;

            if (entry.itemType === 'module' && entry.moduleKey) {
                nextSettings = updatePromptItem(
                    nextSettings,
                    safeSelectedLineIndex,
                    result.itemIndex,
                    {
                        module: entry.moduleKey,
                    }
                );
            }

            commitSettings(nextSettings, { itemIndex: result.itemIndex });
            setPicker(null);
            return;
        }

        if (!selectedRow) {
            setPicker(null);
            return;
        }

        if (isSameContentSelection(selectedRow.item, entry)) {
            setPicker(null);
            return;
        }

        const nextSettings = replacePromptItem(
            settings,
            safeSelectedLineIndex,
            selectedRow.itemIndex,
            entry.itemType,
            entry.itemType === 'module' && entry.moduleKey ? { module: entry.moduleKey } : {}
        );
        commitSettings(nextSettings, { itemIndex: selectedRow.itemIndex });
        setPicker(null);
    }

    function applyFrameSelection(entry) {
        const glyph = entry?.glyph;
        if (typeof glyph !== 'string' || glyph.length === 0) {
            return;
        }

        const patch = {
            glyph,
            invert: Boolean(entry.invert),
        };

        if (picker?.action === 'add') {
            const result = addPromptItem(
                settings,
                safeSelectedLineIndex,
                picker.insertAfterItemIndex,
                'frame',
                patch
            );
            commitSettings(result.settings, { itemIndex: result.itemIndex });
            setPicker(null);
            return;
        }

        if (!selectedRow) {
            setPicker(null);
            return;
        }

        const nextSettings = replacePromptItem(
            settings,
            safeSelectedLineIndex,
            selectedRow.itemIndex,
            'frame',
            patch
        );
        commitSettings(nextSettings, { itemIndex: selectedRow.itemIndex });
        setPicker(null);
    }

    function openFramePicker() {
        setPicker((previous) => ({
            ...previous,
            mode: PICKER_FRAME,
            selectedEntryKey: getDefaultPickerSelection(
                framePickerCatalog,
                resolveFramePickerKey(selectedRow?.item)
            ),
            customInput: false,
            customFrameBuffer: '',
        }));
    }

    function closePickerStep() {
        if (picker?.mode === PICKER_FRAME) {
            setPicker((previous) => ({
                ...previous,
                mode: PICKER_CONTENT,
                selectedEntryKey: CONTENT_FRAME_KEY,
                customInput: false,
                customFrameBuffer: '',
            }));
            return;
        }

        setPicker(null);
    }

    function handleLineModeInput(input, key) {
        if (key.escape) {
            onBack();
            return;
        }

        if (key.upArrow) {
            setSelectedLineIndex((previous) =>
                clamp(previous - 1, 0, Math.max(0, lines.length - 1))
            );
            return;
        }

        if (key.downArrow) {
            setSelectedLineIndex((previous) =>
                clamp(previous + 1, 0, Math.max(0, lines.length - 1))
            );
            return;
        }

        if (input === 'a' || input === 'A') {
            const result = addPromptLine(settings, safeSelectedLineIndex);
            onChange(result.settings);
            setSelectedLineIndex(result.lineIndex);
            return;
        }

        if (input === 'd' || input === 'D') {
            const result = removePromptLine(settings, safeSelectedLineIndex);
            onChange(result.settings);
            setSelectedLineIndex(result.lineIndex);
            setSelectedRowIndex(0);
            return;
        }

        if (key.return || input === 'e' || input === 'E') {
            setMode(MODE_ROWS);
            clearMoveDraft();
            setSelectedRowIndex(0);
            setPicker(null);
        }
    }

    function handleMoveModeInput(key) {
        const currentMoveDraft = moveDraftRef.current;
        if (!currentMoveDraft) {
            clearMoveDraft();
            return;
        }

        if (key.escape || key.return) {
            finishMoveMode(currentMoveDraft);
            return;
        }

        if (!key.upArrow && !key.downArrow) {
            return;
        }

        const nextMoveDraft = applyMoveDraftStep(currentMoveDraft, key.downArrow ? 1 : -1);
        moveDraftRef.current = nextMoveDraft;
        setMoveDraft(nextMoveDraft);
    }

    function handleRowModeInput(input, key) {
        if (key.escape) {
            setMode(MODE_LINES);
            clearMoveDraft();
            setPicker(null);
            return;
        }

        if (key.upArrow) {
            setSelectedRowIndex((previous) => clamp(previous - 1, 0, Math.max(0, rows.length - 1)));
            return;
        }

        if (key.downArrow) {
            setSelectedRowIndex((previous) => clamp(previous + 1, 0, Math.max(0, rows.length - 1)));
            return;
        }

        if (input === 'a' || input === 'A') {
            openAddPicker();
            return;
        }

        if (!selectedRow) {
            return;
        }

        if (key.return) {
            startMoveMode();
            return;
        }

        if (key.leftArrow || key.rightArrow) {
            openChangePicker(selectedRow);
            return;
        }

        if (input === 'd' || input === 'D') {
            const result = removePromptItem(settings, safeSelectedLineIndex, selectedRow.itemIndex);
            commitSettings(result.settings, {
                itemIndex: result.itemIndex,
                fallbackRowIndex: activeSelectedRowIndex,
            });
            return;
        }

        if (input === 'e' || input === 'E') {
            openRowEditor(selectedRow);
        }
    }

    function startMoveMode() {
        const nextMoveDraft = {
            lineItems: clonePromptLine(activeLineItems),
            selectedIndex: activeSelectedRowIndex,
            changed: false,
        };

        moveDraftRef.current = nextMoveDraft;
        setMoveDraft(nextMoveDraft);
    }

    function finishMoveMode(currentMoveDraft) {
        const nextSelectedIndex = clamp(
            currentMoveDraft.selectedIndex,
            0,
            Math.max(0, currentMoveDraft.lineItems.length - 1)
        );

        // 只有真正发生顺序变化时才提交，减少不必要的 normalize / render
        if (currentMoveDraft.changed) {
            const nextSettings = replacePromptLine(
                settings,
                safeSelectedLineIndex,
                currentMoveDraft.lineItems
            );
            onChange(nextSettings);
        }

        setSelectedRowIndex(nextSelectedIndex);
        clearMoveDraft();
    }

    function clearMoveDraft() {
        moveDraftRef.current = null;
        setMoveDraft(null);
    }

    function openRowEditor(row) {
        if (!row) {
            return;
        }

        if (row.kind === 'item' && row.item.type === 'module') {
            onEditModule?.(row.item.module, {
                lineIndex: safeSelectedLineIndex,
                itemIndex: row.itemIndex,
            });
            return;
        }

        onEditPromptItem?.({
            lineIndex: safeSelectedLineIndex,
            itemIndex: row.itemIndex,
        });
    }

    function openAddPicker() {
        setPicker({
            action: 'add',
            mode: PICKER_CONTENT,
            selectedEntryKey: getDefaultPickerSelection(
                contentPickerCatalog,
                resolveContentPickerKey(selectedRow?.item)
            ),
            insertAfterItemIndex: selectedRow ? selectedRow.itemIndex : -1,
            customInput: false,
            customFrameBuffer: '',
        });
    }

    function openChangePicker(row) {
        if (!row) {
            return;
        }

        setPicker({
            action: 'change',
            mode: PICKER_CONTENT,
            selectedEntryKey: getDefaultPickerSelection(
                contentPickerCatalog,
                resolveContentPickerKey(row.item)
            ),
            insertAfterItemIndex: row.itemIndex,
            customInput: false,
            customFrameBuffer: '',
        });
    }
}

function LinesView({ lines, selectedLineIndex, viewportRows }) {
    const viewport = buildViewport(lines, selectedLineIndex, Math.max(1, viewportRows - 2));

    return (
        <Box marginTop={1} flexDirection="column">
            {viewport.hiddenBefore > 0 ? (
                <Text
                    dimColor
                >{`↑ ${viewport.hiddenBefore} more line${viewport.hiddenBefore === 1 ? '' : 's'}`}</Text>
            ) : null}
            {viewport.items.map((line, offset) => {
                const index = viewport.startIndex + offset;
                const selected = index === selectedLineIndex;

                return (
                    <Text key={`line-${index}`} color={selected ? 'green' : undefined}>
                        {selected ? '▶ ' : '  '}
                        {`Line ${index + 1}`}
                    </Text>
                );
            })}
            {viewport.hiddenAfter > 0 ? (
                <Text
                    dimColor
                >{`↓ ${viewport.hiddenAfter} more line${viewport.hiddenAfter === 1 ? '' : 's'}`}</Text>
            ) : null}
        </Box>
    );
}

function RowsView({ rows, selectedRowIndex, selectedRow, moveMode, viewportRows }) {
    const viewport = buildViewport(rows, selectedRowIndex, Math.max(1, viewportRows - 2));

    return (
        <Box marginTop={1} flexDirection="column">
            {rows.length === 0 ? (
                <>
                    <Text dimColor>(empty line)</Text>
                    <Text dimColor>Press A to add text, frame, or a module.</Text>
                </>
            ) : (
                <>
                    {viewport.hiddenBefore > 0 ? (
                        <Text
                            dimColor
                        >{`↑ ${viewport.hiddenBefore} more item${viewport.hiddenBefore === 1 ? '' : 's'}`}</Text>
                    ) : null}
                    {viewport.items.map((row, offset) => (
                        <LayoutRow
                            key={row.id}
                            moveMode={moveMode}
                            row={row}
                            selected={viewport.startIndex + offset === selectedRowIndex}
                        />
                    ))}
                    {viewport.hiddenAfter > 0 ? (
                        <Text
                            dimColor
                        >{`↓ ${viewport.hiddenAfter} more item${viewport.hiddenAfter === 1 ? '' : 's'}`}</Text>
                    ) : null}
                </>
            )}
            {selectedRow ? (
                <Box marginTop={1}>
                    <Text dimColor wrap="truncate-end">
                        {selectedRow.description}
                    </Text>
                </Box>
            ) : null}
        </Box>
    );
}

function LayoutRow({ row, selected, moveMode }) {
    const accentColor = selected ? (moveMode ? 'blue' : 'green') : undefined;
    const marker = selected ? (moveMode ? '◆ ' : '▶ ') : '  ';

    return (
        <Box>
            <Box width={27} flexShrink={0}>
                <Text color={accentColor} wrap="truncate-end">
                    {marker}
                    {row.label.padEnd(24)}
                </Text>
            </Box>
            <Box flexShrink={1}>
                <InlinePreview
                    segments={[
                        {
                            text: row.previewText,
                            fg: row.previewFg,
                            bg: row.previewBg,
                            dim: row.previewDim,
                        },
                    ]}
                />
            </Box>
        </Box>
    );
}

function PickerView({ picker, entries, selectedPickerEntry, viewportRows }) {
    if (picker.customInput) {
        return (
            <Box marginTop={1} flexDirection="column">
                <Text dimColor>Type a custom frame glyph, then press Enter.</Text>
                <Text color="cyan">
                    frame: {formatVisibleGlyph(picker.customFrameBuffer || '')}
                    <Text inverse> </Text>
                </Text>
                <Box marginTop={1} paddingLeft={2}>
                    <Text dimColor wrap="truncate-end">
                        Paste or type any separator glyph. ESC returns to the frame presets.
                    </Text>
                </Box>
            </Box>
        );
    }

    const visibleItemCount = Math.max(1, viewportRows - 2);
    const selectedEntryIndex = Math.max(
        0,
        entries.findIndex((entry) => entry.key === selectedPickerEntry?.key)
    );
    const entryViewport = buildViewport(entries, selectedEntryIndex, visibleItemCount);

    return (
        <Box marginTop={1} flexDirection="column">
            <Text dimColor>{buildPickerTitle(picker)}</Text>
            {entries.length === 0 ? (
                <Text dimColor>No content options available.</Text>
            ) : (
                <>
                    {entryViewport.hiddenBefore > 0 ? (
                        <Text
                            dimColor
                        >{`↑ ${entryViewport.hiddenBefore} more option${entryViewport.hiddenBefore === 1 ? '' : 's'}`}</Text>
                    ) : null}
                    {entryViewport.items.map((entry, offset) => {
                        const index = entryViewport.startIndex + offset;
                        const selected = entry.key === selectedPickerEntry?.key;
                        return (
                            <Text
                                key={entry.key}
                                color={selected ? 'green' : undefined}
                                wrap="truncate-end"
                            >
                                {selected ? '▶ ' : '  '}
                                {`${index + 1}. ${entry.label}`}
                                {entry.tokenLabel ? ' ' : ''}
                                {entry.tokenLabel ? <Text dimColor>{entry.tokenLabel}</Text> : null}
                            </Text>
                        );
                    })}
                    {entryViewport.hiddenAfter > 0 ? (
                        <Text
                            dimColor
                        >{`↓ ${entryViewport.hiddenAfter} more option${entryViewport.hiddenAfter === 1 ? '' : 's'}`}</Text>
                    ) : null}
                    {selectedPickerEntry ? (
                        <Box marginTop={1} paddingLeft={2}>
                            <Text dimColor wrap="truncate-end">
                                {selectedPickerEntry.description}
                            </Text>
                        </Box>
                    ) : null}
                </>
            )}
        </Box>
    );
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

function buildLayoutRows(settings, lineIndex, lineItems) {
    const line = Array.isArray(lineItems) ? lineItems : settings.prompt.lines[lineIndex] || [];

    return line.map((item, itemIndex) => {
        if (item.type === 'frame') {
            return createFrameRow({ settings, line, item, itemIndex });
        }

        return createItemRow({
            settings,
            lineIndex,
            itemIndex,
            item,
        });
    });
}

function createItemRow({ settings, lineIndex, itemIndex, item }) {
    const moduleDisabled =
        item.type === 'module' && Boolean(settings.modules[item.module]?.disabled);
    const resolvedModuleColors =
        item.type === 'module' ? resolveModuleColors(settings.modules[item.module] || {}) : null;
    const parsedItemStyle = item.type === 'styledText' ? parseStyle(item.style || 'none') : null;

    const previewFg = resolvedModuleColors?.fg || parsedItemStyle?.fg || '';
    const previewBg = resolvedModuleColors?.bg || parsedItemStyle?.bg || '';

    return {
        id: `item:${item.id}`,
        kind: 'item',
        lineIndex,
        itemIndex,
        item,
        label: buildItemLabel(item),
        previewText: buildItemPreviewText(item),
        previewFg,
        previewBg,
        previewDim: moduleDisabled,
        description: buildItemDescription(item, itemIndex, moduleDisabled),
    };
}

function createFrameRow({ settings, line, item, itemIndex }) {
    const previousItem = findPreviousContentItem(line, itemIndex);
    const nextItem = findNextContentItem(line, itemIndex);
    const previousBg = resolvePromptItemBackground(previousItem, settings.modules);
    const nextBg = resolvePromptItemBackground(nextItem, settings.modules);
    const previewFg = item.invert ? nextBg || previousBg : previousBg || nextBg;
    const previewBg = item.invert ? previousBg || '' : nextBg || '';

    return {
        id: `frame:${item.id}`,
        kind: 'frame',
        itemIndex,
        item,
        label: buildFrameLabel(item),
        previewText: formatVisibleGlyph(item.glyph || ''),
        previewFg,
        previewBg,
        previewDim: false,
        description: buildFrameDescription(itemIndex, previousItem, nextItem),
    };
}

function findLayoutRowIndexById(settings, lineIndex, rowId, fallbackRowIndex = 0) {
    const rows = buildLayoutRows(settings, lineIndex);
    const foundIndex = rows.findIndex((row) => row.id === rowId);

    if (foundIndex !== -1) {
        return foundIndex;
    }

    return clamp(fallbackRowIndex, 0, Math.max(0, rows.length - 1));
}

function findLayoutRowIndexByItemIndex(settings, lineIndex, itemIndex) {
    const rows = buildLayoutRows(settings, lineIndex);
    const foundIndex = rows.findIndex((row) => row.itemIndex === itemIndex);

    if (foundIndex !== -1) {
        return foundIndex;
    }

    return clamp(itemIndex, 0, Math.max(0, rows.length - 1));
}

function buildItemLabel(item) {
    if (item.type === 'module') {
        return `$${item.module}`;
    }

    return `"${truncateText(printableText(item.text), 18)}"`;
}

function buildItemPreviewText(item) {
    if (item.type === 'module') {
        return ` ${MODULE_SCHEMAS[item.module]?.label || humanizeModuleKey(item.module)} `;
    }

    return truncateText(item.text || ' ', 20);
}

function buildItemDescription(item, itemIndex, moduleDisabled) {
    if (item.type === 'module') {
        return moduleDisabled
            ? `Module slot ${itemIndex + 1}. This module is currently disabled in preview.`
            : `Module slot ${itemIndex + 1}. Press E to open the module detail route.`;
    }

    if (item.type === 'styledText' || item.type === 'rawText') {
        return `Text slot ${itemIndex + 1}. Press E to open text, style, and color details.`;
    }

    return `Text slot ${itemIndex + 1}. Press E to open text, style, and color details.`;
}

function buildFrameLabel(item) {
    return `"${truncateText(formatVisibleGlyph(item.glyph), 18)}"`;
}

function buildFrameDescription(itemIndex, previousItem, nextItem) {
    if (previousItem && nextItem) {
        return `Frame slot ${itemIndex + 1}. It sits between two content segments. Press E to edit glyph, invert, and linked frame colors.`;
    }

    return `Frame slot ${itemIndex + 1}. It sits on a line edge. Press E to edit glyph, invert, and linked frame colors.`;
}

function buildRowHelpText(row, moveMode) {
    if (moveMode) {
        return '↑↓ move row  Enter/ESC done';
    }

    if (!row) {
        return 'A add slot  ESC lines';
    }

    return '↑↓ select row  A add after  ←→ change type  E edit slot  Enter move slot  D delete  ESC lines';
}

function buildPickerHelpText(picker) {
    if (picker?.customInput) {
        return 'Type custom frame  Enter apply  Backspace delete  ESC presets';
    }

    if (picker?.mode === PICKER_FRAME) {
        return '↑↓ select frame  Enter apply  ESC content';
    }

    return '↑↓ select content  Enter select  ESC cancel';
}

function buildPickerTitle(picker) {
    if (picker.mode === PICKER_FRAME) {
        return picker.action === 'add'
            ? 'Choose a frame glyph to add into current line.'
            : 'Choose a frame glyph for current slot.';
    }

    return picker.action === 'add'
        ? 'Add content into current line.'
        : 'Select content for current slot.';
}

function buildPreviewSettings(settings, lineIndex, lineItems) {
    return {
        ...settings,
        prompt: {
            ...settings.prompt,
            lines: settings.prompt.lines.map((line, index) =>
                index === lineIndex ? clonePromptLine(lineItems) : line
            ),
        },
    };
}

function clonePromptLine(lineItems) {
    return JSON.parse(JSON.stringify(Array.isArray(lineItems) ? lineItems : []));
}

function applyMoveDraftStep(moveDraft, step) {
    if (!moveDraft) {
        return moveDraft;
    }

    const lineItems = Array.isArray(moveDraft.lineItems) ? [...moveDraft.lineItems] : [];
    const safeSelectedIndex = clamp(moveDraft.selectedIndex, 0, Math.max(0, lineItems.length - 1));
    const nextSelectedIndex = clamp(safeSelectedIndex + step, 0, Math.max(0, lineItems.length - 1));

    if (safeSelectedIndex === nextSelectedIndex) {
        return {
            ...moveDraft,
            selectedIndex: safeSelectedIndex,
        };
    }

    const [selectedItem] = lineItems.splice(safeSelectedIndex, 1);
    lineItems.splice(nextSelectedIndex, 0, selectedItem);

    return {
        lineItems,
        selectedIndex: nextSelectedIndex,
        changed: true,
    };
}

function buildContentPickerCatalog(settings) {
    return {
        entries: [
            {
                key: CONTENT_TEXT_KEY,
                label: 'Text',
                tokenLabel: null,
                itemType: 'styledText',
                description: 'Editable literal text with inline style and color fields.',
            },
            {
                key: CONTENT_FRAME_KEY,
                label: 'Frame',
                tokenLabel: null,
                itemType: 'frame',
                description:
                    'Open frame presets and custom glyph input before inserting a separator.',
            },
            ...collectModuleKeys(settings).map((moduleKey) => ({
                key: `module:${moduleKey}`,
                label: MODULE_SCHEMAS[moduleKey]?.label || humanizeModuleKey(moduleKey),
                tokenLabel: `$${moduleKey}`,
                itemType: 'module',
                moduleKey,
                description: `Insert the ${MODULE_SCHEMAS[moduleKey]?.label || humanizeModuleKey(moduleKey)} module in this slot.`,
            })),
        ],
    };
}

function buildFramePickerCatalog() {
    return {
        entries: [
            ...Array.from(FRAME_PRESETS, ([label, glyph], index) => ({
                key: `frame:${index}:${glyph}`,
                label,
                tokenLabel: formatVisibleGlyph(glyph),
                itemType: 'frame',
                glyph,
                invert: shouldAutoInvertFrameGlyph(glyph),
                description:
                    'Powerline frame glyph. Colors are inherited from the slots beside it.',
            })),
            {
                key: FRAME_CUSTOM_KEY,
                label: 'Custom Frame',
                tokenLabel: null,
                itemType: 'customFrame',
                description: 'Type or paste your own frame glyph.',
            },
        ],
    };
}

function collectModuleKeys(settings) {
    const promptModuleKeys = [];

    for (const line of settings.prompt.lines || []) {
        for (const item of line || []) {
            if (item?.type === 'module' && typeof item.module === 'string' && item.module) {
                promptModuleKeys.push(item.module);
            }
        }
    }

    return Array.from(
        new Set([...MODULE_ORDER, ...Object.keys(settings.modules || {}), ...promptModuleKeys])
    );
}

function getDefaultPickerSelection(catalog, preferredKey) {
    if (preferredKey && catalog.entries.some((entry) => entry.key === preferredKey)) {
        return preferredKey;
    }

    return catalog.entries[0]?.key || null;
}

function resolveContentPickerKey(item) {
    if (item?.type === 'module' && item.module) {
        return `module:${item.module}`;
    }

    if (item?.type === 'frame') {
        return CONTENT_FRAME_KEY;
    }

    return CONTENT_TEXT_KEY;
}

function resolveFramePickerKey(item) {
    if (item?.type !== 'frame' || typeof item.glyph !== 'string') {
        return null;
    }

    const foundEntry = buildFramePickerCatalog().entries.find(
        (entry) => entry.glyph === item.glyph
    );
    return foundEntry?.key || FRAME_CUSTOM_KEY;
}

function shouldAutoInvertFrameGlyph(glyph) {
    const firstGlyph = Array.from(String(glyph || '').trim())[0] || '';
    return LEFT_FACING_FRAME_GLYPHS.has(firstGlyph);
}

function isSameContentSelection(item, entry) {
    if (!item || !entry) {
        return false;
    }

    if (entry.itemType === 'module') {
        return item.type === 'module' && item.module === entry.moduleKey;
    }

    if (entry.itemType === 'frame') {
        return item.type === 'frame';
    }

    return item.type === 'styledText' || item.type === 'rawText';
}

function findPreviousContentItem(line, startIndex) {
    for (let index = startIndex - 1; index >= 0; index -= 1) {
        const item = line[index];
        if (item?.type !== 'frame') {
            return item;
        }
    }

    return null;
}

function findNextContentItem(line, startIndex) {
    for (let index = startIndex + 1; index < line.length; index += 1) {
        const item = line[index];
        if (item?.type !== 'frame') {
            return item;
        }
    }

    return null;
}

function printableText(text) {
    return String(text || '').replaceAll('\n', '\\n');
}

function truncateText(value, maxLength = 20) {
    const text = String(value || '');

    if (text.length <= maxLength) {
        return text;
    }

    return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

function humanizeModuleKey(moduleKey) {
    return String(moduleKey || '')
        .split('_')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function formatVisibleGlyph(value) {
    return String(value || '').replaceAll(' ', '␠');
}

function getAdjacentValue(values, currentValue, step) {
    if (!Array.isArray(values) || values.length === 0) {
        return currentValue;
    }

    const currentIndex = values.indexOf(currentValue);
    const startIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = clamp(startIndex + step, 0, values.length - 1);

    return values[nextIndex];
}

function resolveViewportRowCount(terminalHeight, reservedRows = VIEWPORT_RESERVED_ROWS) {
    const fallbackHeight = process.stdout.rows || 40;
    const safeTerminalHeight = Number(terminalHeight || fallbackHeight);

    return clamp(safeTerminalHeight - reservedRows, MIN_VIEWPORT_ROWS, MAX_VIEWPORT_ROWS);
}

function buildViewport(items, selectedIndex, visibleItemCount) {
    const safeItems = Array.isArray(items) ? items : [];

    if (safeItems.length === 0) {
        return {
            items: [],
            startIndex: 0,
            hiddenBefore: 0,
            hiddenAfter: 0,
        };
    }

    const safeVisibleItemCount = clamp(visibleItemCount, 1, Math.max(1, safeItems.length));
    const safeSelectedIndex = clamp(selectedIndex, 0, safeItems.length - 1);

    if (safeItems.length <= safeVisibleItemCount) {
        return {
            items: safeItems,
            startIndex: 0,
            hiddenBefore: 0,
            hiddenAfter: 0,
        };
    }

    const halfWindow = Math.floor(safeVisibleItemCount / 2);
    const maxStartIndex = safeItems.length - safeVisibleItemCount;
    const startIndex = clamp(safeSelectedIndex - halfWindow, 0, maxStartIndex);
    const endIndex = startIndex + safeVisibleItemCount;

    return {
        items: safeItems.slice(startIndex, endIndex),
        startIndex,
        hiddenBefore: startIndex,
        hiddenAfter: safeItems.length - endIndex,
    };
}

function clamp(value, min, max) {
    if (max < min) {
        return min;
    }

    return Math.max(min, Math.min(value, max));
}

export { LayoutEditor };
