<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    persistent
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="card-container text-grey-8">
      <q-card-section>
        <div class="flex full-width justify-between items-center">
          <div class="text-h6 text-grey-8">Reason for Rejection</div>
          <q-btn
            icon="fas fa-times"
            flat
            round
            dense
            color="grey-8"
            v-close-popup
          />
        </div>
        <q-separator class="q-my-md" />
        <div class="text-subtitle1 text-grey-8">
          Your {{ doc.name }} was rejected because:
        </div>
        <q-list>
          <q-item
            v-for="rejection in doc.rejection.reasons"
            class="text-body2 text-negative"
            :key="rejection"
          >
            <q-item-section side avatar>
              <q-icon name="fas fa-file-circle-exclamation" />
            </q-item-section>
            <q-item-section>
              {{ rejectionLabels[rejection] }}
            </q-item-section>
          </q-item>
        </q-list>
        <div class="flex column q-mt-lg" v-if="doc.rejection.message">
          <div class="text-subtitle1 text-grey-8">Kindly note:</div>
          <div
            class="text-body2 text-grey-8 q-mt-sm"
            style="white-space: pre-line"
          >
            {{ doc.rejection.message }}
          </div>
        </div>
      </q-card-section>
      <q-card-actions>
        <q-btn
          @click="onDialogOK"
          label="Resubmit Now"
          type="submit"
          class="full-width"
          color="primary"
        />
      </q-card-actions>
      <q-inner-loading :showing="isLoading">
        <q-spinner-pie size="80px" color="primary" />
      </q-inner-loading>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { QDialog, useDialogPluginComponent } from 'quasar';
import { ref } from 'vue';
import { ApplicantDocumentWithRejection } from 'src/utils/new-types';

const rejectionLabels: { [key: string]: string } = {
  'wrong-document': 'You uploaded the wrong document',
  'edges-not-visible': 'The edges of the document are not visible',
  blurry: 'The image is blurry',
  'too-dark': 'The image is too dark',
  other: 'See below',
};

defineProps<{
  doc: ApplicantDocumentWithRejection & { id: string };
}>();

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const isLoading = ref(false);

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
ul
  list-style-type: disc !important
  list-style-position: inside
  padding-left: 1 rem
</style>
