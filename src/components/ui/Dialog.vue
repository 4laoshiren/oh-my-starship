<script setup>
import { DialogRoot } from 'reka-ui';

const props = defineProps(['open']);
const emit = defineEmits(['update:open']);
</script>

<template>
    <DialogRoot v-bind:open="props.open" v-on:update:open="(val) => emit('update:open', val)">
        <slot />
    </DialogRoot>
</template>
