<script setup>
import { reactive, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Palette } from 'lucide-vue-next';
import { cn } from '@/lib/utils';
import Input from './Input.vue';
import DropdownMenu from './DropdownMenu.vue';
import DropdownMenuTrigger from './DropdownMenuTrigger.vue';
import DropdownMenuContent from './DropdownMenuContent.vue';

const props = defineProps(['modelValue', 'id', 'placeholder', 'disabled', 'class']);
const emit = defineEmits(['update:modelValue']);

const { t } = useI18n();

const DEFAULT_PICKER_COLOR = '#98C379';

function normalize_hex_color(value) {
    const match = value.match(/^#([0-9A-Fa-f]{6})$/);
    return match ? `#${match[1].toUpperCase()}` : null;
}

function extract_hex_color(value) {
    const match = value.match(/#([0-9A-Fa-f]{6})/);
    return match ? `#${match[1].toUpperCase()}` : null;
}

function apply_hex_color(value, new_color) {
    const normalized_color = normalize_hex_color(new_color);
    if (!normalized_color) return value;

    if (/#[0-9A-Fa-f]{6}/i.test(value)) {
        return value.replace(/#[0-9A-Fa-f]{6}/i, normalized_color);
    }

    const style_match = value.match(/\(([^)]*)\)/);
    if (style_match) {
        return value.replace(/\([^)]*\)/, `(${normalized_color})`);
    }

    return value;
}

const state = reactive({
    open: false,
    custom_color: DEFAULT_PICKER_COLOR,
});

const current_color = computed(
    () => extract_hex_color(props.modelValue || '') || DEFAULT_PICKER_COLOR
);

watch(
    current_color,
    (val) => {
        state.custom_color = val;
    },
    { immediate: true }
);

function handle_color_select(color) {
    emit('update:modelValue', apply_hex_color(props.modelValue || '', color));
}

function handle_color_picker_change(event) {
    const color = normalize_hex_color(event.target.value);
    if (!color) return;
    state.custom_color = color;
    handle_color_select(color);
}

function handle_text_input(event) {
    emit('update:modelValue', event.target.value);
}

function handle_custom_input(val) {
    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
        state.custom_color = val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            handle_color_select(val.toUpperCase());
        }
    }
}

function handle_apply_custom() {
    if (/^#[0-9A-Fa-f]{6}$/.test(state.custom_color)) {
        handle_color_select(state.custom_color.toUpperCase());
        state.open = false;
    }
}
</script>

<template>
    <div class="relative flex items-center gap-2">
        <input
            v-bind:type="'text'"
            v-bind:id="props.id"
            v-bind:value="props.modelValue"
            v-on:input="handle_text_input"
            v-bind:placeholder="props.placeholder"
            v-bind:disabled="props.disabled"
            v-bind:class="
                cn(
                    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-10 font-nerd',
                    props.class
                )
            "
        />
        <DropdownMenu v-model:open="state.open">
            <DropdownMenuTrigger>
                <button
                    type="button"
                    v-bind:class="
                        cn(
                            'absolute right-1 flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                            props.disabled && 'pointer-events-none'
                        )
                    "
                    v-bind:disabled="props.disabled"
                >
                    <div
                        class="h-5 w-5 rounded border border-border shadow-sm"
                        v-bind:style="{ backgroundColor: current_color }"
                    />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                v-bind:align="'end'"
                v-bind:class="'w-64 p-3'"
                v-bind:side-offset="8"
            >
                <div class="space-y-3">
                    <div class="mb-2 text-xs font-medium text-muted-foreground">
                        {{ t('colorPicker.customColor') }}
                    </div>
                    <div class="relative">
                        <input
                            type="color"
                            v-bind:value="state.custom_color"
                            v-on:input="handle_color_picker_change"
                            class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                        <div
                            class="flex h-9 items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm"
                        >
                            <Palette class="h-4 w-4 text-muted-foreground" />
                            <span class="flex-1 text-muted-foreground">
                                {{ t('colorPicker.selectColor') }}
                            </span>
                            <div
                                class="h-5 w-5 rounded border border-border"
                                v-bind:style="{ backgroundColor: state.custom_color }"
                            />
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <input
                            type="text"
                            v-bind:value="state.custom_color"
                            v-on:input="(e) => handle_custom_input(e.target.value)"
                            placeholder="#RRGGBB"
                            class="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 font-mono text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <button
                            type="button"
                            v-on:click="handle_apply_custom"
                            class="h-8 whitespace-nowrap rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            {{ t('colorPicker.apply') }}
                        </button>
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
</template>
