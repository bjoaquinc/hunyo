<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    @show="onDialogShow"
    maximized
    persistent
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <div class="flex bg-primary">
      <q-img :src="sampleURL" />
      <q-btn class="full-width" @click="onOk" label="Ok" color="primary" />
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { QDialog, useDialogPluginComponent } from 'quasar';
import { ref } from 'vue';
import * as amplitude from '@amplitude/analytics-browser';
import { ApplicantDocument } from 'src/utils/new-types';
import { Form } from 'src/utils/types';

const props = defineProps<{
  sampleURL: string;
  doc: ApplicantDocument & { id: string };
  form: Form & { id: string };
}>();
const viewStart = ref(0);

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const onDialogShow = () => {
  viewStart.value = Date.now();
};

const onOk = () => {
  const TIME_SPENT_SECONDS = Math.round((Date.now() - viewStart.value) / 1000);
  amplitude.track('View Sample', {
    applicantName: props.form.applicant.name,
    docId: props.doc.id,
    docName: props.doc.name,
    docStatus: props.doc.status,
    timeSpent: TIME_SPENT_SECONDS,
  });
  onDialogOK();
};

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
