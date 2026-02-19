<script setup>
import { cn } from '@/lib/utils';

const props = defineProps(['class', 'type', 'id', 'placeholder', 'disabled', 'modelValue']);
const emit = defineEmits(['update:modelValue']);

function on_input(event) {
    emit('update:modelValue', event.target.value);
}
</script>

<template>
    <input
        v-bind:type="props.type || 'text'"
        v-bind:id="props.id"
        v-bind:value="props.modelValue"
        v-on:input="on_input"
        v-bind:placeholder="props.placeholder"
        v-bind:disabled="props.disabled"
        v-bind:class="
            cn(
                'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                props.class
            )
        "
    />
</template>
