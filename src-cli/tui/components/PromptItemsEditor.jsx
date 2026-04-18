import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';

import {
    MODULE_GROUPS,
    MODULE_ORDER,
    MODULE_SCHEMAS,
    SEPARATOR_PRESETS,
} from '../../types/settings.js';
import {
    addPromptItem,
    addPromptLine,
    cyclePromptFrameGlyph,
    removePromptItem,
    removePromptLine,
    replacePromptItem,
    replacePromptLine,
    updatePromptItem,
} from '../../utils/settings-mutations.js';
import { parseStyle, resolvePromptItemBackground } from '../../utils/prompt-format.js';
import { resolveModuleColors } from '../../utils/color-targets.js';
import { colorToInk, displayColorName } from '../../utils/colors.js';

const MODE_LINES = 'lines';
const MODE_ROWS = 'rows';
const MIN_VIEWPORT_ROWS = 4;
const MAX_VIEWPORT_ROWS = 12;
const VIEWPORT_RESERVED_ROWS = 22;

const ADD_TYPE_OPTIONS = [
    {
        key: 'module',
        label: 'Module',
        description: 'Insert a Starship module placeholder such as $directory.',
    },
    {
        key: 'text',
        label: 'Text',
        description: 'Create literal text and style it inline when needed.',
    },
    {
        key: 'frame',
        label: 'Frame',
        description: 'Insert a visible frame glyph as a real prompt item.',
    },
];

const CHANGE_TYPE_OPTIONS = [
    {
        key: 'module',
        label: 'Module',
        description: 'Switch this slot to a Starship module.',
    },
    {
        key: 'text',
        label: 'Text',
        description: 'Switch this slot to editable literal text.',
    },
];

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
    const modulePickerCatalog = useMemo(() => buildModulePickerCatalog(settings), [settings]);
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
    const pickerTypeOptions = picker?.action === 'change' ? CHANGE_TYPE_OPTIONS : ADD_TYPE_OPTIONS;
    const selectedTypeEntry = picker
        ? pickerTypeOptions.find((entry) => entry.key === picker.selectedType) ||
          pickerTypeOptions[0] ||
          null
        : null;
    const pickerCategoryEntries = picker
        ? getModulePickerEntries(modulePickerCatalog, picker.selectedCategory)
        : [];
    const selectedPickerEntry = picker
        ? pickerCategoryEntries.find((entry) => entry.key === picker.selectedModule) ||
          pickerCategoryEntries[0] ||
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
        if (picker?.level === 'type') {
            return '↑↓ select type  Enter apply/continue  ESC cancel';
        }

        if (picker?.level === 'module-category') {
            return '↑↓ select module group  Enter continue  ESC back';
        }

        if (picker?.level === 'module') {
            return '↑↓ select module  Enter apply  ESC back';
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

        if (!moveMode) {
            onPreviewChange(null);
            return;
        }

        onPreviewChange({
            settings: buildPreviewSettings(settings, safeSelectedLineIndex, activeLineItems),
            fastMode: true,
        });
    }, [activeLineItems, moveMode, onPreviewChange, safeSelectedLineIndex, settings]);

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
                    selectedTypeEntry={selectedTypeEntry}
                    typeOptions={pickerTypeOptions}
                    categories={modulePickerCatalog.categories}
                    categoryEntries={pickerCategoryEntries}
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
        if (key.escape) {
            if (picker.level === 'module') {
                setPicker((previous) => ({
                    ...previous,
                    level: 'module-category',
                }));
                return;
            }

            if (picker.level === 'module-category') {
                setPicker((previous) => ({
                    ...previous,
                    level: 'type',
                }));
                return;
            }

            setPicker(null);
            return;
        }

        if (key.return) {
            if (picker.level === 'type') {
                if (!selectedTypeEntry) {
                    setPicker(null);
                    return;
                }

                if (selectedTypeEntry.key === 'module') {
                    setPicker((previous) => ({
                        ...previous,
                        level: 'module-category',
                        selectedCategory: previous.selectedCategory || 'All',
                        selectedModule: getDefaultModuleSelection(
                            modulePickerCatalog,
                            previous.selectedCategory || 'All',
                            previous.selectedModule
                        ),
                    }));
                    return;
                }

                applyPickerTypeSelection(selectedTypeEntry.key);
                return;
            }

            if (picker.level === 'module-category') {
                setPicker((previous) => ({
                    ...previous,
                    level: 'module',
                    selectedModule: getDefaultModuleSelection(
                        modulePickerCatalog,
                        previous.selectedCategory,
                        previous.selectedModule
                    ),
                }));
                return;
            }

            if (selectedPickerEntry) {
                applyPickerTypeSelection('module', { module: selectedPickerEntry.key });
            }
            return;
        }

        if (key.upArrow || key.downArrow) {
            const step = key.downArrow ? 1 : -1;

            if (picker.level === 'type') {
                setPicker((previous) => ({
                    ...previous,
                    selectedType: getAdjacentValue(
                        pickerTypeOptions.map((entry) => entry.key),
                        previous.selectedType,
                        step
                    ),
                }));
                return;
            }

            if (picker.level === 'module-category') {
                const nextCategory = getAdjacentValue(
                    modulePickerCatalog.categories,
                    picker.selectedCategory,
                    step
                );
                setPicker((previous) => ({
                    ...previous,
                    selectedCategory: nextCategory,
                    selectedModule: getDefaultModuleSelection(
                        modulePickerCatalog,
                        nextCategory,
                        previous.selectedModule
                    ),
                }));
                return;
            }

            setPicker((previous) => ({
                ...previous,
                selectedModule: getAdjacentValue(
                    pickerCategoryEntries.map((entry) => entry.key),
                    previous.selectedModule,
                    step
                ),
            }));
        }
    }

    function applyPickerTypeSelection(type, patch = {}) {
        const promptType = type === 'text' ? 'styledText' : type;

        if (picker?.action === 'add') {
            const result = addPromptItem(
                settings,
                safeSelectedLineIndex,
                picker.insertAfterItemIndex,
                promptType
            );
            let nextSettings = result.settings;

            if (type === 'module' && patch.module) {
                nextSettings = updatePromptItem(
                    nextSettings,
                    safeSelectedLineIndex,
                    result.itemIndex,
                    {
                        module: patch.module,
                    }
                );
            }

            commitSettings(nextSettings, { itemIndex: result.itemIndex });
            setPicker(null);
            return;
        }

        if (!selectedRow || selectedRow.kind !== 'item') {
            setPicker(null);
            return;
        }

        if (type === 'text') {
            if (selectedRow.item.type === 'styledText' || selectedRow.item.type === 'rawText') {
                setPicker(null);
                return;
            }

            const nextSettings = replacePromptItem(
                settings,
                safeSelectedLineIndex,
                selectedRow.itemIndex,
                'styledText'
            );
            commitSettings(nextSettings, { rowId: selectedRow.id });
            setPicker(null);
            return;
        }

        if (
            selectedRow.item.type === 'module' &&
            selectedRow.item.module === patch.module &&
            patch.module
        ) {
            setPicker(null);
            return;
        }

        const nextSettings = replacePromptItem(
            settings,
            safeSelectedLineIndex,
            selectedRow.itemIndex,
            'module',
            patch
        );
        commitSettings(nextSettings, { rowId: selectedRow.id });
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
            if (selectedRow.kind === 'item') {
                openChangePicker(selectedRow);
                return;
            }

            const nextSettings = cyclePromptFrameGlyph(
                settings,
                safeSelectedLineIndex,
                selectedRow.itemIndex,
                key.rightArrow ? 1 : -1
            );
            commitSettings(nextSettings, { rowId: selectedRow.id });
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
            level: 'type',
            selectedType: ADD_TYPE_OPTIONS[0].key,
            selectedCategory: 'All',
            selectedModule: getDefaultModuleSelection(modulePickerCatalog, 'All'),
            insertAfterItemIndex: selectedRow ? selectedRow.itemIndex : -1,
        });
    }

    function openChangePicker(row) {
        if (!row || row.kind !== 'item') {
            return;
        }

        const selectedCategory =
            row.item.type === 'module'
                ? resolveModuleCategory(modulePickerCatalog, row.item.module)
                : 'All';
        const selectedModule =
            row.item.type === 'module'
                ? getDefaultModuleSelection(modulePickerCatalog, selectedCategory, row.item.module)
                : getDefaultModuleSelection(modulePickerCatalog, 'All');

        setPicker({
            action: 'change',
            level: 'type',
            selectedType: getVisibleItemType(row.item),
            selectedCategory,
            selectedModule,
            insertAfterItemIndex: row.itemIndex,
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
                    <Text dimColor>Press A to add a module, text, or frame.</Text>
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
            <Box flexShrink={1} marginRight={row.metaText ? 1 : 0}>
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

function PickerView({
    picker,
    selectedTypeEntry,
    typeOptions,
    categories,
    categoryEntries,
    selectedPickerEntry,
    viewportRows,
}) {
    const visibleItemCount = Math.max(1, viewportRows - 2);
    const selectedTypeIndex = Math.max(
        0,
        typeOptions.findIndex((entry) => entry.key === selectedTypeEntry?.key)
    );
    const selectedCategoryIndex = Math.max(0, categories.indexOf(picker.selectedCategory));
    const selectedModuleIndex = Math.max(
        0,
        categoryEntries.findIndex((entry) => entry.key === selectedPickerEntry?.key)
    );
    const typeViewport = buildViewport(typeOptions, selectedTypeIndex, visibleItemCount);
    const categoryViewport = buildViewport(categories, selectedCategoryIndex, visibleItemCount);
    const moduleViewport = buildViewport(categoryEntries, selectedModuleIndex, visibleItemCount);

    return (
        <Box marginTop={1} flexDirection="column">
            <Text dimColor>
                {picker.action === 'add' ? 'Add into current line.' : 'Change current slot type.'}
            </Text>
            {picker.level === 'type' ? (
                <>
                    {typeViewport.hiddenBefore > 0 ? (
                        <Text
                            dimColor
                        >{`↑ ${typeViewport.hiddenBefore} more option${typeViewport.hiddenBefore === 1 ? '' : 's'}`}</Text>
                    ) : null}
                    {typeViewport.items.map((entry, offset) => {
                        const index = typeViewport.startIndex + offset;
                        const selected = entry.key === selectedTypeEntry?.key;
                        return (
                            <Text
                                key={entry.key}
                                color={selected ? 'green' : undefined}
                                wrap="truncate-end"
                            >
                                {selected ? '▶ ' : '  '}
                                {`${index + 1}. ${entry.label}`}
                            </Text>
                        );
                    })}
                    {typeViewport.hiddenAfter > 0 ? (
                        <Text
                            dimColor
                        >{`↓ ${typeViewport.hiddenAfter} more option${typeViewport.hiddenAfter === 1 ? '' : 's'}`}</Text>
                    ) : null}
                    {selectedTypeEntry ? (
                        <Box marginTop={1} paddingLeft={2}>
                            <Text dimColor wrap="truncate-end">
                                {selectedTypeEntry.description}
                            </Text>
                        </Box>
                    ) : null}
                </>
            ) : picker.level === 'module-category' ? (
                <>
                    {categoryViewport.hiddenBefore > 0 ? (
                        <Text
                            dimColor
                        >{`↑ ${categoryViewport.hiddenBefore} more group${categoryViewport.hiddenBefore === 1 ? '' : 's'}`}</Text>
                    ) : null}
                    {categoryViewport.items.map((category, offset) => {
                        const index = categoryViewport.startIndex + offset;
                        const selected = category === picker.selectedCategory;
                        return (
                            <Text
                                key={category}
                                color={selected ? 'green' : undefined}
                                wrap="truncate-end"
                            >
                                {selected ? '▶ ' : '  '}
                                {`${index + 1}. ${category}`}
                            </Text>
                        );
                    })}
                    {categoryViewport.hiddenAfter > 0 ? (
                        <Text
                            dimColor
                        >{`↓ ${categoryViewport.hiddenAfter} more group${categoryViewport.hiddenAfter === 1 ? '' : 's'}`}</Text>
                    ) : null}
                    <Box marginTop={1} paddingLeft={2}>
                        <Text dimColor wrap="truncate-end">
                            {getModuleCategoryHint(picker.selectedCategory)}
                        </Text>
                    </Box>
                </>
            ) : categoryEntries.length === 0 ? (
                <Text dimColor>No modules available in this group.</Text>
            ) : (
                <>
                    {moduleViewport.hiddenBefore > 0 ? (
                        <Text
                            dimColor
                        >{`↑ ${moduleViewport.hiddenBefore} more module${moduleViewport.hiddenBefore === 1 ? '' : 's'}`}</Text>
                    ) : null}
                    {moduleViewport.items.map((entry, offset) => {
                        const index = moduleViewport.startIndex + offset;
                        const selected = entry.key === selectedPickerEntry?.key;
                        return (
                            <Text
                                key={entry.key}
                                color={selected ? 'green' : undefined}
                                wrap="truncate-end"
                            >
                                {selected ? '▶ ' : '  '}
                                {`${index + 1}. ${entry.label}`}
                                {entry.label !== entry.key ? ' ' : ''}
                                {entry.label !== entry.key ? (
                                    <Text dimColor>{`$${entry.key}`}</Text>
                                ) : null}
                            </Text>
                        );
                    })}
                    {moduleViewport.hiddenAfter > 0 ? (
                        <Text
                            dimColor
                        >{`↓ ${moduleViewport.hiddenAfter} more module${moduleViewport.hiddenAfter === 1 ? '' : 's'}`}</Text>
                    ) : null}
                    {selectedPickerEntry ? (
                        <Box marginTop={1} paddingLeft={2}>
                            <Text
                                dimColor
                                wrap="truncate-end"
                            >{`Apply $${selectedPickerEntry.key} to this slot.`}</Text>
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
        label: buildItemLabel(itemIndex, item),
        previewText: buildItemPreviewText(item),
        previewFg,
        previewBg,
        previewDim: moduleDisabled,
        metaText: buildItemMetaText(item, moduleDisabled, previewFg, previewBg),
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
        label: buildFrameLabel(itemIndex, item),
        previewText: formatVisibleGlyph(item.glyph || ''),
        previewFg,
        previewBg,
        previewDim: false,
        metaText: buildFrameMetaText(previousBg, nextBg, item.invert),
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

function buildItemLabel(itemIndex, item) {
    const slot = String(itemIndex + 1).padStart(2, '0');

    if (item.type === 'module') {
        return `${slot}  Module  $${item.module}`;
    }

    if (item.type === 'styledText') {
        return `${slot}  Text    "${truncateText(printableText(item.text), 18)}"`;
    }

    return `${slot}  Raw     "${truncateText(printableText(item.text), 18)}"`;
}

function buildItemPreviewText(item) {
    if (item.type === 'module') {
        return ` ${MODULE_SCHEMAS[item.module]?.label || humanizeModuleKey(item.module)} `;
    }

    return truncateText(item.text || ' ', 20);
}

function buildItemMetaText(item, moduleDisabled, fg, bg) {
    if (moduleDisabled) {
        return 'disabled in preview';
    }

    if (item.type === 'rawText') {
        return 'plain text';
    }

    return buildColorSummary(fg, bg);
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

function buildFrameLabel(itemIndex, item) {
    const slot = String(itemIndex + 1).padStart(2, '0');
    return `${slot}  Frame   "${truncateText(formatVisibleGlyph(item.glyph), 18)}"`;
}

function buildFrameMetaText(previousBg, nextBg, invert) {
    const left = previousBg ? displayColorName(previousBg) : '(edge)';
    const right = nextBg ? displayColorName(nextBg) : '(edge)';
    const mode = invert ? 'invert' : 'normal';
    return `Left ${left} · Right ${right} · ${mode}`;
}

function buildFrameDescription(itemIndex, previousItem, nextItem) {
    if (previousItem && nextItem) {
        return `Frame slot ${itemIndex + 1}. It sits between two content segments. Press E to edit glyph, invert, and linked frame colors.`;
    }

    return `Frame slot ${itemIndex + 1}. It sits on a line edge. Press E to edit glyph, invert, and linked frame colors.`;
}

function buildColorSummary(fg, bg) {
    return `FG ${displayColorName(fg)} · BG ${displayColorName(bg)}`;
}

function buildRowHelpText(row, moveMode) {
    if (moveMode) {
        return '↑↓ move row  Enter/ESC done';
    }

    if (!row) {
        return 'A add slot  ESC lines';
    }

    if (row.kind === 'item') {
        return '↑↓ select row  A add  ←→ change type  E open detail  Enter move  D delete  ESC lines';
    }

    return '↑↓ select row  A add  ←→ cycle glyph  E open detail  Enter move  D delete  ESC lines';
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

function buildModulePickerCatalog(settings) {
    const modulesByCategory = new Map();
    const moduleCategoryMap = new Map();
    const customCategory = 'Custom';

    modulesByCategory.set('All', []);

    for (const group of MODULE_GROUPS) {
        modulesByCategory.set(group.label, []);
        for (const moduleKey of group.modules) {
            moduleCategoryMap.set(moduleKey, group.label);
        }
    }

    modulesByCategory.set(customCategory, []);

    for (const moduleKey of collectModuleKeys(settings)) {
        const category = moduleCategoryMap.get(moduleKey) || customCategory;
        const entry = {
            key: moduleKey,
            label: MODULE_SCHEMAS[moduleKey]?.label || humanizeModuleKey(moduleKey),
            category,
        };

        modulesByCategory.get('All').push(entry);
        modulesByCategory.get(category).push(entry);
    }

    const categories = ['All'];

    for (const group of MODULE_GROUPS) {
        if ((modulesByCategory.get(group.label) || []).length > 0) {
            categories.push(group.label);
        }
    }

    if ((modulesByCategory.get(customCategory) || []).length > 0) {
        categories.push(customCategory);
    }

    return {
        categories,
        modulesByCategory,
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

function getModulePickerEntries(catalog, category) {
    return catalog.modulesByCategory.get(category) || catalog.modulesByCategory.get('All') || [];
}

function getDefaultModuleSelection(catalog, category, preferredModule) {
    const entries = getModulePickerEntries(catalog, category || 'All');

    if (preferredModule && entries.some((entry) => entry.key === preferredModule)) {
        return preferredModule;
    }

    return entries[0]?.key || preferredModule || null;
}

function resolveModuleCategory(catalog, moduleKey) {
    for (const category of catalog.categories) {
        if (category === 'All') {
            continue;
        }

        const entries = catalog.modulesByCategory.get(category) || [];
        if (entries.some((entry) => entry.key === moduleKey)) {
            return category;
        }
    }

    return 'All';
}

function getVisibleItemType(item) {
    return item?.type === 'module' ? 'module' : 'text';
}

function getModuleCategoryHint(category) {
    if (category === 'All') {
        return 'Browse every available prompt module.';
    }

    if (category === 'Git') {
        return 'Git-related prompt modules.';
    }

    if (category === 'Languages') {
        return 'Language runtime and toolchain modules.';
    }

    if (category === 'Prompt End') {
        return 'Prompt tail modules such as time and character.';
    }

    if (category === 'Custom') {
        return 'Modules discovered from your current settings or prompt.';
    }

    return 'Core prompt modules for this group.';
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
