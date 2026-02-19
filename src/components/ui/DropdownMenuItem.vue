<script setup>
import { DropdownMenuItem as RekaDropdownMenuItem } from 'reka-ui';
import { cn } from '@/lib/utils';

const props = defineProps(['class', 'disabled']);
</script>

<template>
    <RekaDropdownMenuItem
        v-bind:disabled="props.disabled"
        v-bind:class="
            cn(
                'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0',
                props.class
            )
        "
    >
        <slot />
    </RekaDropdownMenuItem>
</template>
