<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    persistent
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <div>
      <q-layout view="lHh lpr lFf" container>
        <q-header elevated>
          <q-toolbar class="bg-black">
            <q-toolbar-title> File Viewer </q-toolbar-title>

            <q-btn flat round dense v-close-popup icon="fas fa-x" />
          </q-toolbar>
        </q-header>

        <q-page-container>
          <q-page class="bg-black flex items-stretch">
            <iframe
              class="full-width"
              :src="props.imgURL + '#view=FitH&navpanes=0'"
              type="application/pdf"
            />
          </q-page>
        </q-page-container>
      </q-layout>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { QDialog, useDialogPluginComponent } from 'quasar';

const props = defineProps<{
  imgURL: string;
  contentType: string;
  angle?: 0 | 90 | 180 | 270;
}>();

const { dialogRef, onDialogHide } = useDialogPluginComponent();

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);
</script>

<style lang="sass" scoped></style>
