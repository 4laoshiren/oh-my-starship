<script setup>
import { TabsList as RekaTabsList } from 'reka-ui';
import { cn } from '@/lib/utils';

const props = defineProps(['class']);
</script>

<template>
    <RekaTabsList
        v-bind:class="
            cn(
                'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
                props.class
            )
        "
    >
        <slot />
    </RekaTabsList>
</template>
