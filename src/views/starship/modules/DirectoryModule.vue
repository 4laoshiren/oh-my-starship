<script setup>
import { reactive, watch } from 'vue';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import Input from '@/components/ui/Input.vue';
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
    truncation_length: 3,
    truncation_symbol: '…',
    truncate_to_repo: true,
    style: '#06b6d4',
    format: '[$path]($style)[$read_only]($read_only_style) ',
    read_only: '🔒',
    read_only_style: '#ef4444',
    home_symbol: '~',
    disabled: false,
};

const state = reactive({ ...defaults });

watch(
    toml,
    (val) => {
        if (val) {
            const section = parse_toml_section(val, 'directory');
            Object.assign(state, { ...defaults, ...section });
        }
    },
    { immediate: true }
);

function on_submit() {
    if (!toml.value) return;
    const updated_toml = update_toml_section(toml.value, 'directory', { ...state });
    save_toml(updated_toml, {
        onSuccess: () => toast.success(t('starship.modules.directory.saveSuccess')),
        onError: (error) =>
            toast.error(t('starship.modules.saveFailed', { message: error.message })),
    });
}
</script>

<template>
    <StarshipLayout>
        <div v-if="is_loading" class="text-sm text-muted-foreground">{{ t('common.loading') }}</div>

        <form v-else v-on:submit.prevent="on_submit" class="space-y-6">
            <div class="flex gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 class="text-lg font-medium">{{ t('starship.modules.directory.title') }}</h3>
                    <p class="text-sm text-muted-foreground">
                        {{ t('starship.modules.directory.subtitle') }}
                    </p>
                </div>
                <Button v-bind:type="'submit'" v-bind:disabled="is_pending" class="sm:self-start">
                    {{ is_pending ? t('common.saving') : t('common.saveChanges') }}
                </Button>
            </div>

            <div
                class="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
            >
                <div class="space-y-0.5">
                    <Label v-bind:for="'disabled'">{{
                        t('starship.modules.directory.hideDirectory')
                    }}</Label>
                    <p class="text-xs text-muted-foreground">
                        {{ t('starship.modules.directory.hideDescription') }}
                    </p>
                </div>
                <Switch v-bind:id="'disabled'" v-model:modelValue="state.disabled" />
            </div>

            <div class="grid gap-4">
                <div class="space-y-2">
                    <Label v-bind:for="'truncation_length'">{{
                        t('starship.modules.directory.truncationLength')
                    }}</Label>
                    <Input
                        v-bind:id="'truncation_length'"
                        v-bind:type="'number'"
                        v-model:modelValue="state.truncation_length"
                        v-bind:placeholder="'3'"
                        v-bind:disabled="state.disabled"
                    />
                    <p class="text-xs text-muted-foreground">
                        {{ t('starship.modules.directory.truncationLengthDesc') }}
                    </p>
                </div>

                <div class="space-y-2">
                    <Label v-bind:for="'truncation_symbol'">{{
                        t('starship.modules.directory.truncationSymbol')
                    }}</Label>
                    <Input
                        v-bind:id="'truncation_symbol'"
                        v-model:modelValue="state.truncation_symbol"
                        v-bind:placeholder="'…'"
                        v-bind:disabled="state.disabled"
                    />
                    <p class="text-xs text-muted-foreground">
                        {{ t('starship.modules.directory.truncationSymbolDesc') }}
                    </p>
                </div>

                <div class="flex items-center justify-between rounded-lg border border-border p-4">
                    <div class="space-y-0.5">
                        <Label v-bind:for="'truncate_to_repo'">{{
                            t('starship.modules.directory.truncateToRepo')
                        }}</Label>
                        <p class="text-xs text-muted-foreground">
                            {{ t('starship.modules.directory.truncateToRepoDesc') }}
                        </p>
                    </div>
                    <Switch
                        v-bind:id="'truncate_to_repo'"
                        v-model:modelValue="state.truncate_to_repo"
                        v-bind:disabled="state.disabled"
                    />
                </div>

                <div class="space-y-2">
                    <Label v-bind:for="'style'">{{ t('starship.modules.directory.style') }}</Label>
                    <ColorPickerInput
                        v-bind:id="'style'"
                        v-model:modelValue="state.style"
                        v-bind:placeholder="'#06b6d4'"
                        v-bind:disabled="state.disabled"
                    />
                    <p class="text-xs text-muted-foreground">
                        {{ t('starship.modules.directory.styleDesc') }}
                    </p>
                </div>

                <div class="space-y-2">
                    <Label v-bind:for="'format'">{{
                        t('starship.modules.directory.format')
                    }}</Label>
                    <Input
                        v-bind:id="'format'"
                        v-model:modelValue="state.format"
                        v-bind:placeholder="'[$path]($style)[$read_only]($read_only_style) '"
                        v-bind:disabled="state.disabled"
                    />
                    <p class="text-xs text-muted-foreground">
                        {{ t('starship.modules.directory.formatDesc') }}
                    </p>
                </div>

                <div class="space-y-2">
                    <Label v-bind:for="'home_symbol'">{{
                        t('starship.modules.directory.homeSymbol')
                    }}</Label>
                    <Input
                        v-bind:id="'home_symbol'"
                        v-model:modelValue="state.home_symbol"
                        v-bind:placeholder="'~'"
                        v-bind:disabled="state.disabled"
                    />
                    <p class="text-xs text-muted-foreground">
                        {{ t('starship.modules.directory.homeSymbolDesc') }}
                    </p>
                </div>

                <div class="space-y-2">
                    <Label v-bind:for="'read_only'">{{
                        t('starship.modules.directory.readOnlySymbol')
                    }}</Label>
                    <Input
                        v-bind:id="'read_only'"
                        v-model:modelValue="state.read_only"
                        v-bind:placeholder="'🔒'"
                        v-bind:disabled="state.disabled"
                        v-bind:class="'font-nerd'"
                    />
                    <p class="text-xs text-muted-foreground">
                        {{ t('starship.modules.directory.readOnlySymbolDesc') }}
                    </p>
                </div>

                <div class="space-y-2">
                    <Label v-bind:for="'read_only_style'">{{
                        t('starship.modules.directory.readOnlyStyle')
                    }}</Label>
                    <ColorPickerInput
                        v-bind:id="'read_only_style'"
                        v-model:modelValue="state.read_only_style"
                        v-bind:placeholder="'#ef4444'"
                        v-bind:disabled="state.disabled"
                    />
                    <p class="text-xs text-muted-foreground">
                        {{ t('starship.modules.directory.readOnlyStyleDesc') }}
                    </p>
                </div>
            </div>
        </form>
    </StarshipLayout>
</template>
