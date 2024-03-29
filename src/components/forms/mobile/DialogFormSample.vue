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
    <div class="flex container">
      <q-img :src="sampleURL" @load="showOkButton" />
      <q-btn
        v-if="showButton"
        class="full-width"
        @click="onOk"
        size="lg"
        label="Ok"
        color="primary"
      />
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
const showButton = ref(false);

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

const showOkButton = () => {
  showButton.value = true;
};

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);
</script>

<style lang="sass" scoped>
.container
  background-color: #7b95a3
</style>
