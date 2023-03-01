<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="card-container text-grey-8 q-pa-md">
      <div class="text-h5 gt-sm">Important Reminders</div>
      <div class="text-h6 lt-md">Important Reminders</div>

      <q-separator class="q-my-md" />

      <q-list>
        <div class="text-body1 text-weight-bold">We accept:</div>
        <q-item
          class="text-body1"
          v-for="(format, index) in acceptedFormats"
          :key="index"
        >
          <q-item-section avatar side>
            <q-icon name="fas fa-check" color="positive" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              {{ format }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
      <q-list class="q-mt-sm">
        <div class="text-body1 text-weight-bold">Please remember:</div>
        <q-item
          class="text-body1"
          v-for="(reminder, index) in importantReminders"
          :key="index"
        >
          <q-item-section avatar side>
            <q-icon name="fas fa-times" color="negative" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              {{ reminder }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
      <q-card-actions>
        <q-btn
          v-close-popup
          label="Ok"
          type="submit"
          class="full-width"
          color="primary"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { QDialog, useDialogPluginComponent } from 'quasar';

const { dialogRef, onDialogHide } = useDialogPluginComponent();

const acceptedFormats = [
  'Pictures of documents taken with your phone',
  'Documents in PDF or Word format',
];
const importantReminders = [
  'Do not edit your photos. We will fix them for you',
  'No screenshots allowed. Take a picture of the document directly',
  'Avoid blurry images and blurry text',
  'Do not cover words with your hands when taking photos. All the words and images must be clear and readable',
];

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);
</script>

<style lang="sass" scoped>
.card-container
  @media only screen and (width > $breakpoint-sm)
    max-width: 600px !important
    height: auto !important
</style>
