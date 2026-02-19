<script setup>
import { reactive, watch } from 'vue';
import { Save, RotateCcw } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import Button from '@/components/ui/Button.vue';
import StarshipLayout from './StarshipLayout.vue';
import { use_starship_toml, use_save_starship_toml } from '@/composables/use-starship';

const { t } = useI18n();
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
        toast.success(t('starship.toml.saveSuccess'));
    } catch {
        toast.error(t('starship.toml.saveFailed'));
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
            <span class="text-muted-foreground">{{ t('common.loading') }}</span>
        </div>

        <div v-else class="flex h-full min-h-0 flex-col gap-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2" />
                <div class="flex gap-2">
                    <Button
                        v-bind:variant="'outline'"
                        v-bind:size="'sm'"
                        v-on:click="handle_reset"
                        v-bind:disabled="!state.has_changes"
                    >
                        <RotateCcw class="mr-2 h-4 w-4" />
                        {{ t('common.reset') }}
                    </Button>
                    <Button
                        v-bind:size="'sm'"
                        v-on:click="handle_save"
                        v-bind:disabled="!state.has_changes || save_toml.isPending.value"
                    >
                        <Save class="mr-2 h-4 w-4" />
                        {{ t('common.save') }}
                    </Button>
                </div>
            </div>

            <textarea
                v-bind:value="state.content"
                v-on:input="handle_content_change"
                class="flex-1 min-h-0 resize-none rounded-xl border border-input bg-background p-4 font-nerd text-sm shadow-sm transition-all duration-200 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                v-bind:spellcheck="false"
                v-bind:placeholder="t('starship.toml.placeholder')"
            />
        </div>
    </StarshipLayout>
</template>
