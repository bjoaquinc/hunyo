<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="card-container text-grey-8">
      <q-form greedy>
        <q-card-section>
          <div class="flex">
            <div class="text-h5 gt-xs">Select one</div>
            <div class="text-h6 lt-sm">Select one</div>
            <q-btn
              v-close-popup
              round
              class="q-ml-auto"
              icon="fas fa-times"
              color="grey-8"
              flat
              dense
            />
          </div>

          <q-separator class="q-my-md" />

          <q-btn
            @click="onDialogOK('submit-now')"
            size="lg"
            class="q-mt-lg full-width"
            outline
            no-caps
            color="primary"
            label="Submit now"
          />
          <q-btn
            @click="onDialogOK('reschedule')"
            size="lg"
            class="q-mt-lg full-width"
            outline
            no-caps
            color="primary"
            label="Update deadline"
          />
        </q-card-section>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { QDialog, useDialogPluginComponent } from 'quasar';

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
