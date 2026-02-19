<script setup>
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import StarshipLayout from './StarshipLayout.vue';
import { use_starship_toml, use_save_starship_toml } from '@/composables/use-starship';

const { t } = useI18n();
const toast = useToast();
const { data: toml_content, isLoading: is_loading } = use_starship_toml();
const save_toml = use_save_starship_toml();

const state = reactive({
    content: '',
    has_changes: false,
});

watch(
    toml_content,
    (val) => {
        if (val !== undefined) {
            state.content = val;
            state.has_changes = false;
        }
    },
    { immediate: true }
);

function handle_content_change(event) {
    state.content = event.target.value;
    state.has_changes = state.content !== toml_content.value;
}

async function handle_save() {
    try {
        await save_toml.mutateAsync(state.content);
        state.has_changes = false;
        toast.add({ title: t('starship.toml.saveSuccess'), color: 'success' });
    } catch {
        toast.add({ title: t('starship.toml.saveFailed'), color: 'error' });
    }
}

function handle_reset() {
    if (toml_content.value !== undefined) {
        state.content = toml_content.value;
        state.has_changes = false;
    }
}
</script>

<template>
    <StarshipLayout>
        <div v-if="is_loading" class="flex h-full items-center justify-center">
            <span class="text-(--ui-text-muted)">{{ t('common.loading') }}</span>
        </div>

        <div v-else class="flex h-full min-h-0 flex-col gap-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2" />
                <div class="flex gap-2">
                    <UButton
                        v-bind:variant="'outline'"
                        v-bind:size="'sm'"
                        v-bind:icon="'i-lucide-rotate-ccw'"
                        v-on:click="handle_reset"
                        v-bind:disabled="!state.has_changes"
                    >
                        {{ t('common.reset') }}
                    </UButton>
                    <UButton
                        v-bind:size="'sm'"
                        v-bind:icon="'i-lucide-save'"
                        v-on:click="handle_save"
                        v-bind:disabled="!state.has_changes || save_toml.isPending.value"
                    >
                        {{ t('common.save') }}
                    </UButton>
                </div>
            </div>

            <textarea
                v-bind:value="state.content"
                v-on:input="handle_content_change"
                class="flex-1 min-h-0 resize-none rounded-xl border border-(--ui-border) bg-(--ui-bg) p-4 font-nerd text-sm shadow-sm transition-all duration-200 focus:border-(--ui-primary)/50 focus:outline-none focus:ring-2 focus:ring-(--ui-primary)/20"
                v-bind:spellcheck="false"
                v-bind:placeholder="t('starship.toml.placeholder')"
            />
        </div>
    </StarshipLayout>
</template>
