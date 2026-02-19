<script setup>
import { DialogTitle as RekaDialogTitle } from 'reka-ui';
import { cn } from '@/lib/utils';

const props = defineProps(['class']);
</script>

<template>
    <RekaDialogTitle
        v-bind:class="cn('text-lg font-semibold leading-none tracking-tight', props.class)"
    >
        <slot />
    </RekaDialogTitle>
</template>
