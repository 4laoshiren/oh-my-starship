<script setup>
import { cn } from '@/lib/utils';

const props = defineProps(['class', 'for']);
</script>

<template>
    <label
        v-bind:for="props.for"
        v-bind:class="
            cn(
                'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                props.class
            )
        "
    >
        <slot />
    </label>
</template>
