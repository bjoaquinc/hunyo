<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    persistent
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <div class="flex">
      <q-img :src="sampleURL" />
      <q-btn
        class="full-width"
        @click="onDialogOK"
        size="lg"
        label="Ok"
        color="primary"
      />
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { QDialog, useDialogPluginComponent } from 'quasar';

const props = defineProps<{
  sampleURL: string;
}>();

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);
</script>

<style lang="sass" scoped>
.card-container
  @media only screen and (width > $breakpoint-xs)
    max-width: 600px !important
    height: auto !important
</style>
