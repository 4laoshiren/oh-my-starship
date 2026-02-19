<script setup>
import { cn } from '@/lib/utils';

const props = defineProps(['class']);
</script>

<template>
    <div
        v-bind:class="
            cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', props.class)
        "
    >
        <slot />
    </div>
</template>
