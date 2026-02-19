<script setup>
import { DropdownMenuRoot } from 'reka-ui';

const props = defineProps(['open']);
const emit = defineEmits(['update:open']);
</script>

<template>
    <DropdownMenuRoot v-bind:open="props.open" v-on:update:open="(val) => emit('update:open', val)">
        <slot />
    </DropdownMenuRoot>
</template>
