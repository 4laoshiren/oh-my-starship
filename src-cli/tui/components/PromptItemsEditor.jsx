import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';

import {
    addPromptItem,
    addPromptLine,
    movePromptItem,
    removePromptItem,
    removePromptLine,
    replacePromptItem,
    togglePromptItemMerge,
    updatePromptItem,
} from '../../utils/settings-mutations.js';
import { MODULE_GROUPS, MODULE_ORDER, MODULE_SCHEMAS } from '../../types/settings.js';
import { formatPromptItemLabel, formatPromptLineSummary } from '../../utils/prompt-format.js';

const SLOT_TYPE_OPTIONS = [
    {
        key: 'module',
        label: 'Module',
        description: 'Insert a Starship module placeholder such as $directory.',
    },
    {
        key: 'text',
        label: 'Text',
        description: 'Create literal text. Style can be none or any Starship style string.',
    },
];

function LayoutEditor({ settings, onChange, onBack, interactive }) {
    const [mode, setMode] = useState('lines');
    const [selectedLineIndex, setSelectedLineIndex] = useState(0);
    const [selectedItemIndex, setSelectedItemIndex] = useState(0);
    const [inputMode, setInputMode] = useState(null);
    const [itemPicker, setItemPicker] = useState(null);
    const [buffer, setBuffer] = useState('');
    const lines = settings.prompt.lines;
    const selectedLine = lines[selectedLineIndex] || [];
    const selectedItem = selectedLine[selectedItemIndex];
    const modulePickerCatalog = useMemo(() => buildModulePickerCatalog(settings), [settings]);
    const selectedTypeEntry = itemPicker
        ? SLOT_TYPE_OPTIONS.find((entry) => entry.key === itemPicker.selectedType) ||
          SLOT_TYPE_OPTIONS[0] ||
          null
        : null;
    const pickerCategoryEntries = itemPicker
        ? getModulePickerEntries(modulePickerCatalog, itemPicker.selectedCategory)
        : [];
    const selectedPickerEntry = itemPicker
        ? pickerCategoryEntries.find((entry) => entry.key === itemPicker.selectedModule) ||
          pickerCategoryEntries[0] ||
          null
        : null;

    useInput(
        (input, key) => {
            if (inputMode) {
                if (key.escape) {
                    resetInputMode();
                    return;
                }

                if (key.return) {
                    if (selectedItem) {
                        if (inputMode === 'text') {
                            onChange(
                                updatePromptItem(settings, selectedLineIndex, selectedItemIndex, {
                                    text: buffer,
                                })
                            );
                        }
                        if (inputMode === 'style' && selectedItem.type === 'styledText') {
                            onChange(
                                updatePromptItem(settings, selectedLineIndex, selectedItemIndex, {
                                    style: buffer || 'none',
                                })
                            );
                        }
                    }
                    resetInputMode();
                    return;
                }

                if (key.backspace || key.delete) {
                    setBuffer((previous) => previous.slice(0, -1));
                    return;
                }

                if (input) {
                    setBuffer((previous) => previous + input);
                }
                return;
            }

            if (itemPicker) {
                if (key.escape) {
                    if (itemPicker.level === 'module') {
                        setItemPicker((previous) => {
                            if (!previous) {
                                return previous;
                            }

                            return {
                                ...previous,
                                level: 'module-category',
                            };
                        });
                    } else if (itemPicker.level === 'module-category') {
                        setItemPicker((previous) => {
                            if (!previous) {
                                return previous;
                            }

                            return {
                                ...previous,
                                level: 'type',
                            };
                        });
                    } else {
                        setItemPicker(null);
                    }
                    return;
                }

                if (key.return) {
                    if (itemPicker.level === 'type') {
                        if (!selectedTypeEntry) {
                            setItemPicker(null);
                            return;
                        }

                        if (selectedTypeEntry.key === 'module') {
                            setItemPicker((previous) => {
                                if (!previous) {
                                    return previous;
                                }

                                return {
                                    ...previous,
                                    level: 'module-category',
                                    selectedCategory: previous.selectedCategory || 'All',
                                    selectedModule: getDefaultModuleSelection(
                                        modulePickerCatalog,
                                        previous.selectedCategory || 'All',
                                        previous.selectedModule
                                    ),
                                };
                            });
                        } else {
                            applyItemTypeSelection(selectedTypeEntry.key);
                            setItemPicker(null);
                        }
                    } else if (itemPicker.level === 'module-category') {
                        setItemPicker((previous) => {
                            if (!previous) {
                                return previous;
                            }

                            return {
                                ...previous,
                                level: 'module',
                                selectedModule: getDefaultModuleSelection(
                                    modulePickerCatalog,
                                    previous.selectedCategory,
                                    previous.selectedModule
                                ),
                            };
                        });
                    } else if (selectedPickerEntry) {
                        applyItemTypeSelection('module', {
                            module: selectedPickerEntry.key,
                        });
                        setItemPicker(null);
                    }
                    return;
                }

                if (key.upArrow || key.downArrow) {
                    const step = key.downArrow ? 1 : -1;

                    if (itemPicker.level === 'type') {
                        const nextType = getAdjacentValue(
                            SLOT_TYPE_OPTIONS.map((entry) => entry.key),
                            itemPicker.selectedType,
                            step
                        );

                        setItemPicker((previous) => {
                            if (!previous) {
                                return previous;
                            }

                            return {
                                ...previous,
                                selectedType: nextType,
                            };
                        });
                    } else if (itemPicker.level === 'module-category') {
                        const nextCategory = getAdjacentValue(
                            modulePickerCatalog.categories,
                            itemPicker.selectedCategory,
                            step
                        );

                        setItemPicker((previous) => {
                            if (!previous) {
                                return previous;
                            }

                            return {
                                ...previous,
                                selectedCategory: nextCategory,
                                selectedModule: getDefaultModuleSelection(
                                    modulePickerCatalog,
                                    nextCategory,
                                    previous.selectedModule
                                ),
                            };
                        });
                    } else {
                        const nextModule = getAdjacentValue(
                            pickerCategoryEntries.map((entry) => entry.key),
                            itemPicker.selectedModule,
                            step
                        );

                        setItemPicker((previous) => {
                            if (!previous) {
                                return previous;
                            }

                            return {
                                ...previous,
                                selectedModule: nextModule,
                            };
                        });
                    }
                    return;
                }

                return;
            }

            if (mode === 'lines') {
                if (key.escape) {
                    onBack();
                    return;
                }

                if (key.upArrow) {
                    setSelectedLineIndex((previous) => clamp(previous - 1, 0, lines.length - 1));
                    return;
                }

                if (key.downArrow) {
                    setSelectedLineIndex((previous) => clamp(previous + 1, 0, lines.length - 1));
                    return;
                }

                if (input === 'a' || input === 'A') {
                    const result = addPromptLine(settings, selectedLineIndex);
                    onChange(result.settings);
                    setSelectedLineIndex(result.lineIndex);
                    return;
                }

                if (input === 'd' || input === 'D') {
                    const result = removePromptLine(settings, selectedLineIndex);
                    onChange(result.settings);
                    setSelectedLineIndex(result.lineIndex);
                    setSelectedItemIndex(0);
                    return;
                }

                if (key.return || input === 'e' || input === 'E') {
                    setMode('items');
                    setSelectedItemIndex(0);
                    setItemPicker(null);
                }
                return;
            }

            if (key.escape) {
                setMode('lines');
                resetInputMode();
                setItemPicker(null);
                return;
            }

            if (key.upArrow) {
                setSelectedItemIndex((previous) =>
                    clamp(previous - 1, 0, Math.max(0, selectedLine.length - 1))
                );
                return;
            }

            if (key.downArrow) {
                setSelectedItemIndex((previous) =>
                    clamp(previous + 1, 0, Math.max(0, selectedLine.length - 1))
                );
                return;
            }

            if (key.leftArrow || key.rightArrow) {
                openItemPicker();
                return;
            }

            if (input === 'a' || input === 'A') {
                const result = addPromptItem(
                    settings,
                    selectedLineIndex,
                    selectedItemIndex,
                    'styledText'
                );
                onChange(result.settings);
                setSelectedItemIndex(result.itemIndex);
                return;
            }

            if (input === 'm' || input === 'M') {
                const result = addPromptItem(
                    settings,
                    selectedLineIndex,
                    selectedItemIndex,
                    'module'
                );
                onChange(result.settings);
                setSelectedItemIndex(result.itemIndex);
                return;
            }

            if (input === 'd' || input === 'D') {
                const result = removePromptItem(settings, selectedLineIndex, selectedItemIndex);
                onChange(result.settings);
                setSelectedItemIndex(result.itemIndex);
                return;
            }

            if (input === 'u' || input === 'U') {
                const result = movePromptItem(settings, selectedLineIndex, selectedItemIndex, -1);
                onChange(result.settings);
                setSelectedItemIndex(result.itemIndex);
                return;
            }

            if (input === 'j' || input === 'J') {
                const result = movePromptItem(settings, selectedLineIndex, selectedItemIndex, 1);
                onChange(result.settings);
                setSelectedItemIndex(result.itemIndex);
                return;
            }

            if (input === 't' || input === 'T') {
                onChange(togglePromptItemMerge(settings, selectedLineIndex, selectedItemIndex));
                return;
            }

            if (input === 'e' || input === 'E' || key.return) {
                if (selectedItem?.type === 'styledText' || selectedItem?.type === 'rawText') {
                    setInputMode('text');
                    setBuffer(selectedItem.text || '');
                }
                return;
            }

            if (input === 's' || input === 'S') {
                if (selectedItem?.type === 'styledText') {
                    setInputMode('style');
                    setBuffer(selectedItem.style || 'none');
                    return;
                }

                if (selectedItem?.type === 'rawText') {
                    onChange(
                        replacePromptItem(
                            settings,
                            selectedLineIndex,
                            selectedItemIndex,
                            'styledText',
                            {
                                text: selectedItem.text || '',
                                style: 'none',
                            }
                        )
                    );
                    setInputMode('style');
                    setBuffer('none');
                }
            }
        },
        { isActive: interactive }
    );

    const helpText = useMemo(() => {
        if (inputMode === 'text') {
            return 'Editing item text. Enter save  ESC cancel';
        }
        if (inputMode === 'style') {
            return 'Editing Starship style string. Enter save  ESC cancel';
        }
        if (itemPicker?.level === 'type') {
            return '↑↓ select slot type  Enter apply/continue  ESC cancel';
        }
        if (itemPicker?.level === 'module-category') {
            return '↑↓ select module group  Enter continue  ESC back';
        }
        if (itemPicker?.level === 'module') {
            return '↑↓ select module  Enter apply  ESC back';
        }
        if (mode === 'lines') {
            return '↑↓ select line  Enter edit line  A add line  D delete line  ESC back';
        }
        return '↑↓ select item  ←→ open slot picker  A add text  M add module  U/J move  T merge next  E edit text  S edit style  D delete  ESC lines';
    }, [inputMode, itemPicker, mode]);

    return (
        <TitledBox
            flexDirection="column"
            borderStyle="round"
            borderColor="cyan"
            paddingX={1}
            titles={['Prompt Layout']}
        >
            <Text dimColor>
                Only real content items appear here. Implicit powerline frame lives in Powerline
                Frame.
            </Text>
            <Text dimColor>{helpText}</Text>
            {inputMode && (
                <Text color="cyan">
                    {inputMode}: {buffer}
                    <Text inverse> </Text>
                </Text>
            )}

            {mode === 'lines' ? (
                <Box marginTop={1} flexDirection="column">
                    {lines.map((line, index) => {
                        const selected = index === selectedLineIndex;
                        return (
                            <Text key={`line-${index}`} color={selected ? 'green' : undefined}>
                                {selected ? '▶ ' : '  '}
                                {`Line ${index + 1}`.padEnd(8)}
                                {formatPromptLineSummary(line)}
                            </Text>
                        );
                    })}
                </Box>
            ) : itemPicker ? (
                <Box marginTop={1} flexDirection="column">
                    <Text
                        dimColor
                    >{`Editing Line ${selectedLineIndex + 1} · Slot ${selectedItemIndex + 1}`}</Text>
                    {itemPicker.level === 'type' ? (
                        <>
                            {SLOT_TYPE_OPTIONS.map((entry, index) => {
                                const selected = entry.key === selectedTypeEntry?.key;
                                return (
                                    <Text key={entry.key} color={selected ? 'green' : undefined}>
                                        {selected ? '▶ ' : '  '}
                                        {`${index + 1}. ${entry.label}`}
                                    </Text>
                                );
                            })}
                            {selectedTypeEntry && (
                                <Box marginTop={1} paddingLeft={2}>
                                    <Text dimColor>{selectedTypeEntry.description}</Text>
                                </Box>
                            )}
                        </>
                    ) : itemPicker.level === 'module-category' ? (
                        <>
                            {modulePickerCatalog.categories.map((category, index) => {
                                const selected = category === itemPicker.selectedCategory;
                                return (
                                    <Text key={category} color={selected ? 'green' : undefined}>
                                        {selected ? '▶ ' : '  '}
                                        {`${index + 1}. ${category}`}
                                    </Text>
                                );
                            })}
                            <Box marginTop={1} paddingLeft={2}>
                                <Text dimColor>
                                    {getModuleCategoryHint(itemPicker.selectedCategory)}
                                </Text>
                            </Box>
                        </>
                    ) : pickerCategoryEntries.length === 0 ? (
                        <Text dimColor>No modules available in this group.</Text>
                    ) : (
                        <>
                            {pickerCategoryEntries.map((entry, index) => {
                                const selected = entry.key === selectedPickerEntry?.key;
                                return (
                                    <Box key={entry.key} flexDirection="row">
                                        <Text color={selected ? 'green' : undefined}>
                                            {selected ? '▶ ' : '  '}
                                            {`${index + 1}. ${entry.label}`}
                                        </Text>
                                        {entry.label !== entry.key && (
                                            <Text dimColor>{`  $${entry.key}`}</Text>
                                        )}
                                    </Box>
                                );
                            })}
                            {selectedPickerEntry && (
                                <Box marginTop={1} paddingLeft={2}>
                                    <Text
                                        dimColor
                                    >{`Apply $${selectedPickerEntry.key} to this slot.`}</Text>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            ) : (
                <Box marginTop={1} flexDirection="column">
                    <Text dimColor>{`Editing Line ${selectedLineIndex + 1}`}</Text>
                    {selectedLine.length === 0 ? (
                        <Text dimColor>(empty)</Text>
                    ) : (
                        selectedLine.map((item, index) => {
                            const selected = index === selectedItemIndex;
                            return (
                                <Text key={item.id} color={selected ? 'green' : undefined}>
                                    {selected ? '▶ ' : '  '}
                                    {formatPromptItemLabel(item, index)}
                                </Text>
                            );
                        })
                    )}
                </Box>
            )}
        </TitledBox>
    );

    function resetInputMode() {
        setInputMode(null);
        setBuffer('');
    }

    function openItemPicker() {
        if (!selectedItem) {
            return;
        }

        const selectedCategory =
            selectedItem.type === 'module'
                ? resolveModuleCategory(modulePickerCatalog, selectedItem.module)
                : 'All';
        const selectedModule =
            selectedItem.type === 'module'
                ? getDefaultModuleSelection(
                      modulePickerCatalog,
                      selectedCategory,
                      selectedItem.module
                  )
                : getDefaultModuleSelection(modulePickerCatalog, 'All', MODULE_ORDER[0] || null);

        setItemPicker({
            level: 'type',
            selectedType: getVisibleItemType(selectedItem),
            selectedCategory,
            selectedModule,
        });
    }

    function applyItemTypeSelection(type, patch = {}) {
        if (!selectedItem) {
            return;
        }

        // 中文注释：UI 只区分 Text / Module，rawText 也按 Text 处理。
        if (type === 'text') {
            if (selectedItem.type === 'styledText' || selectedItem.type === 'rawText') {
                return;
            }
            onChange(
                replacePromptItem(settings, selectedLineIndex, selectedItemIndex, 'styledText')
            );
            return;
        }

        // 中文注释：只有真正切换模块目标时才替换，避免误触把原内容清空。
        if (selectedItem.type === 'module' && selectedItem.module === patch.module) {
            return;
        }

        onChange(
            replacePromptItem(settings, selectedLineIndex, selectedItemIndex, 'module', patch)
        );
    }
}

function clamp(value, min, max) {
    if (max < min) {
        return min;
    }
    return Math.max(min, Math.min(value, max));
}

function buildModulePickerCatalog(settings) {
    const modulesByCategory = new Map();
    const customCategory = 'Custom';
    const moduleCategoryMap = new Map();

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
    const entries = getModulePickerEntries(catalog, category);
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

function getAdjacentValue(values, currentValue, step) {
    if (!Array.isArray(values) || values.length === 0) {
        return currentValue;
    }

    const currentIndex = values.indexOf(currentValue);
    const startIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = clamp(startIndex + step, 0, values.length - 1);
    return values[nextIndex];
}

function getVisibleItemType(item) {
    if (!item || item.type === 'module') {
        return 'module';
    }

    return 'text';
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

function humanizeModuleKey(moduleKey) {
    return String(moduleKey)
        .split('_')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

export { LayoutEditor };
