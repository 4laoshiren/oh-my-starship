<script setup>
import { SwitchRoot, SwitchThumb } from 'reka-ui';
import { cn } from '@/lib/utils';

const props = defineProps(['class', 'id', 'disabled', 'modelValue']);
const emit = defineEmits(['update:modelValue']);
</script>

<template>
    <SwitchRoot
        v-bind:id="props.id"
        v-bind:checked="props.modelValue"
        v-bind:disabled="props.disabled"
        v-bind:class="
            cn(
                'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
                props.class
            )
        "
        v-on:update:checked="(val) => emit('update:modelValue', val)"
    >
        <SwitchThumb
            v-bind:class="
                cn(
                    'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0'
                )
            "
        />
    </SwitchRoot>
</template>
