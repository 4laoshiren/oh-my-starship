<script setup>
import { TabsRoot } from 'reka-ui';
import { cn } from '@/lib/utils';

const props = defineProps(['class', 'modelValue']);
const emit = defineEmits(['update:modelValue']);
</script>

<template>
    <TabsRoot
        v-bind:model-value="props.modelValue"
        v-on:update:model-value="(val) => emit('update:modelValue', val)"
        v-bind:class="cn(props.class)"
    >
        <slot />
    </TabsRoot>
</template>
