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
import { open_external } from '@/services/cmds';

const { t } = useI18n();
const { data: toml, isLoading: is_loading } = use_starship_toml();
const { mutate: save_toml, isPending: is_pending } = use_save_starship_toml();

const defaults = {
    disabled: true,
    time_format: '%T',
    format: '[$time]($style) ',
    style: '#eab308',
    use_12hr: false,
};

const time_format_examples = [
    { label: '24-hour (14:30:00)', value: '%T' },
    { label: '12-hour (02:30:00 PM)', value: '%r' },
    { label: 'Hour:Minute (14:30)', value: '%R' },
    { label: 'Custom (2:30 PM)', value: '%-I:%M %p' },
];

const state = reactive({ ...defaults });

watch(
    toml,
    (val) => {
        if (val) {
            const section = parse_toml_section(val, 'time');
            Object.assign(state, { ...defaults, ...section });
        }
    },
    { immediate: true }
);

function on_submit() {
    if (!toml.value) return;
    const updated_toml = update_toml_section(toml.value, 'time', { ...state });
    save_toml(updated_toml, {
        onSuccess: () => toast.success(t('starship.modules.time.saveSuccess')),
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
                    <h3 class="text-lg font-medium">{{ t('starship.modules.time.title') }}</h3>
                    <p class="text-sm text-muted-foreground">
                        {{ t('starship.modules.time.subtitle') }}
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
                    <Label v-bind:for="'disabled'">{{ t('starship.modules.time.hideTime') }}</Label>
                    <p class="text-xs text-muted-foreground">
                        {{ t('starship.modules.time.hideDescription') }}
                    </p>
                </div>
                <Switch v-bind:id="'disabled'" v-model:modelValue="state.disabled" />
            </div>

            <div class="grid gap-4">
                <div class="space-y-2">
                    <Label v-bind:for="'time_format'">{{
                        t('starship.modules.time.timeFormat')
                    }}</Label>
                    <Input
                        v-bind:id="'time_format'"
                        v-model:modelValue="state.time_format"
                        v-bind:placeholder="'%T'"
                        v-bind:disabled="state.disabled"
                    />
                    <div class="text-xs text-muted-foreground space-y-1">
                        <p>{{ t('starship.modules.time.timeFormatDesc') }}</p>
                        <ul class="list-inside list-disc ml-2">
                            <li v-for="example in time_format_examples" v-bind:key="example.value">
                                <code class="bg-muted px-1 rounded">{{ example.value }}</code> -
                                {{ example.label }}
                            </li>
                        </ul>
                        <p>
                            <Button
                                v-bind:variant="'link'"
                                v-on:click="
                                    open_external(
                                        'https://docs.rs/chrono/0.4.7/chrono/format/strftime/index.html'
                                    )
                                "
                            >
                                {{ t('starship.modules.time.chronoStrftimeDoc') }}
                            </Button>
                        </p>
                    </div>
                </div>

                <div class="space-y-2">
                    <Label v-bind:for="'format'">{{
                        t('starship.modules.time.displayFormat')
                    }}</Label>
                    <Input
                        v-bind:id="'format'"
                        v-model:modelValue="state.format"
                        v-bind:placeholder="'[$time]($style) '"
                        v-bind:disabled="state.disabled"
                        v-bind:class="'font-nerd'"
                    />
                    <p class="text-xs text-muted-foreground">
                        {{ t('starship.modules.time.displayFormatDesc') }}
                    </p>
                </div>

                <div class="space-y-2">
                    <Label v-bind:for="'style'">{{ t('starship.modules.time.style') }}</Label>
                    <ColorPickerInput
                        v-bind:id="'style'"
                        v-model:modelValue="state.style"
                        v-bind:placeholder="'#eab308'"
                        v-bind:disabled="state.disabled"
                    />
                    <p class="text-xs text-muted-foreground">
                        {{ t('starship.modules.time.styleDesc') }}
                    </p>
                </div>

                <div
                    class="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                >
                    <div class="space-y-0.5">
                        <Label v-bind:for="'use_12hr'">{{
                            t('starship.modules.time.use12hr')
                        }}</Label>
                        <p class="text-xs text-muted-foreground">
                            {{ t('starship.modules.time.use12hrDesc') }}
                        </p>
                    </div>
                    <Switch
                        v-bind:id="'use_12hr'"
                        v-model:modelValue="state.use_12hr"
                        v-bind:disabled="state.disabled"
                    />
                </div>
            </div>
        </form>
    </StarshipLayout>
</template>
