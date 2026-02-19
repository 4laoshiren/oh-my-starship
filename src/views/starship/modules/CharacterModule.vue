<script setup>
import { reactive, watch } from 'vue';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import Label from '@/components/ui/Label.vue';
import Switch from '@/components/ui/Switch.vue';
import Button from '@/components/ui/Button.vue';
import ColorPickerInput from '@/components/ui/ColorPickerInput.vue';
import StarshipLayout from '@/views/starship/StarshipLayout.vue';
import { use_starship_toml, use_save_starship_toml } from '@/composables/use-starship';
import { parse_toml_section, update_toml_section } from '@/lib/toml-utils';

const { t } = useI18n();
const { data: toml, isLoading: is_loading } = use_starship_toml();
const { mutate: save_toml, isPending: is_pending } = use_save_starship_toml();

const defaults = {
    success_symbol: '[❯]( #22c55e)',
    error_symbol: '[❯]( #ef4444)',
    vimcmd_symbol: '[❮]( #22c55e)',
    vimcmd_replace_symbol: '[❮]( #a855f7)',
    vimcmd_visual_symbol: '[❮]( #eab308)',
    disabled: false,
};

const state = reactive({ ...defaults });

watch(
    toml,
    (val) => {
        if (val) {
            const section = parse_toml_section(val, 'character');
            Object.assign(state, { ...defaults, ...section });
        }
    },
    { immediate: true }
);

function on_submit() {
    if (!toml.value) return;
    const updated_toml = update_toml_section(toml.value, 'character', { ...state });
    save_toml(updated_toml, {
        onSuccess: () => toast.success(t('starship.modules.character.saveSuccess')),
        onError: (error) =>
            toast.error(t('starship.modules.saveFailed', { message: error.message })),
    });
}
</script>

<template>
    <StarshipLayout>
        <div v-if="is_loading" class="text-sm text-muted-foreground">{{ t('common.loading') }}</div>

        <form v-else v-on:submit.prevent="on_submit" class="space-y-6">
            <div class="flex gap-3 flex-row items-start justify-between">
                <div>
                    <h3 class="text-lg font-medium">{{ t('starship.modules.character.title') }}</h3>
                    <p class="text-sm text-muted-foreground">
                        {{ t('starship.modules.character.subtitle') }}
                    </p>
                </div>
                <Button v-bind:type="'submit'" v-bind:disabled="is_pending">
                    {{ is_pending ? t('common.saving') : t('common.saveChanges') }}
                </Button>
            </div>

            <div
                class="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
            >
                <div class="space-y-0.5">
                    <Label v-bind:for="'disabled'">{{
                        t('starship.modules.character.hideCharacter')
                    }}</Label>
                    <p class="text-xs text-muted-foreground">
                        {{ t('starship.modules.character.hideDescription') }}
                    </p>
                </div>
                <Switch v-bind:id="'disabled'" v-model:modelValue="state.disabled" />
            </div>

            <div class="grid gap-4">
                <div class="space-y-2">
                    <Label v-bind:for="'success_symbol'">{{
                        t('starship.modules.character.successSymbol')
                    }}</Label>
                    <ColorPickerInput
                        v-bind:id="'success_symbol'"
                        v-model:modelValue="state.success_symbol"
                        v-bind:placeholder="'[❯](bold #22c55e)'"
                        v-bind:disabled="state.disabled"
                    />
                    <p class="text-xs text-muted-foreground">
                        {{ t('starship.modules.character.successSymbolDesc') }}
                    </p>
                </div>

                <div class="space-y-2">
                    <Label v-bind:for="'error_symbol'">{{
                        t('starship.modules.character.errorSymbol')
                    }}</Label>
                    <ColorPickerInput
                        v-bind:id="'error_symbol'"
                        v-model:modelValue="state.error_symbol"
                        v-bind:placeholder="'[❯](bold #ef4444)'"
                        v-bind:disabled="state.disabled"
                    />
                    <p class="text-xs text-muted-foreground">
                        {{ t('starship.modules.character.errorSymbolDesc') }}
                    </p>
                </div>

                <div class="space-y-2">
                    <Label v-bind:for="'vimcmd_symbol'">{{
                        t('starship.modules.character.vimcmdSymbol')
                    }}</Label>
                    <ColorPickerInput
                        v-bind:id="'vimcmd_symbol'"
                        v-model:modelValue="state.vimcmd_symbol"
                        v-bind:placeholder="'[❮](bold #22c55e)'"
                        v-bind:disabled="state.disabled"
                    />
                    <p class="text-xs text-muted-foreground">
                        {{ t('starship.modules.character.vimcmdSymbolDesc') }}
                    </p>
                </div>

                <div class="space-y-2">
                    <Label v-bind:for="'vimcmd_replace_symbol'">{{
                        t('starship.modules.character.vimcmdReplaceSymbol')
                    }}</Label>
                    <ColorPickerInput
                        v-bind:id="'vimcmd_replace_symbol'"
                        v-model:modelValue="state.vimcmd_replace_symbol"
                        v-bind:placeholder="'[❮](bold #a855f7)'"
                        v-bind:disabled="state.disabled"
                    />
                    <p class="text-xs text-muted-foreground">
                        {{ t('starship.modules.character.vimcmdReplaceSymbolDesc') }}
                    </p>
                </div>

                <div class="space-y-2">
                    <Label v-bind:for="'vimcmd_visual_symbol'">{{
                        t('starship.modules.character.vimcmdVisualSymbol')
                    }}</Label>
                    <ColorPickerInput
                        v-bind:id="'vimcmd_visual_symbol'"
                        v-model:modelValue="state.vimcmd_visual_symbol"
                        v-bind:placeholder="'[❮](bold #eab308)'"
                        v-bind:disabled="state.disabled"
                    />
                    <p class="text-xs text-muted-foreground">
                        {{ t('starship.modules.character.vimcmdVisualSymbolDesc') }}
                    </p>
                </div>
            </div>
        </form>
    </StarshipLayout>
</template>
