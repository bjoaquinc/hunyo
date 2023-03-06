<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="card-container text-grey-8 q-pa-md">
      <div class="text-h5 gt-xs">Tips for taking better document photos</div>
      <div class="text-h6 lt-sm">Tips for taking better document photos</div>

      <q-separator class="q-my-md" />
      <q-list>
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
      <q-list class="q-mt-sm">
        <div class="text-body1 text-weight-bold">Tips:</div>
        <q-item class="text-body1" v-for="(tip, index) in tips" :key="index">
          <q-item-section avatar side>
            <q-icon name="far fa-lightbulb" color="grey-8" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              {{ tip }}
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

const importantReminders = [
  'Do not edit your photos. We will fix them for you',
  'No screenshots allowed. Take a picture of the document directly',
  'Avoid blurry images and blurry text',
  'Do not cover words with your hands when taking photos. All the words and images must be clear and readable',
];

const tips = [
  'Take photos of the entire document, not just a part of it. All corners of the document must be visible',
  'Do not crop the document. We will crop it for you',
  'Its best to take photos during the day with natural light',
  'Go near the window and put the document on a table or a flat surface',
  "If your document won't stay flat (e.g. passport), you can use a book or a phone to hold it down, but avoid covering images or writing in the documents",
  // 'Your body should face the window',
  // "Open your phone's camera",
  // 'Turn off your camera flash',
  // 'Hold your phone steady with two hands and bring your elbows to your sides',
  // 'Tap your phone screen to make sure your camera is focusing on the document, and that the words on the page are clear',
  // 'Lightly tap the button to take the photo',
  // 'If the photo is blurry or too dark, take another one',
];

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
