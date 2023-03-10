<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    transition-show="slide-up"
    transition-hide="slide-down"
    full-width
  >
    <q-stepper
      style="max-width: 800px !important"
      v-model="step"
      ref="stepperRef"
      animated
      active-color="primary"
    >
      <q-step
        title="Choose page or submission"
        :name="1"
        :done="step > 1"
        prefix="1"
      >
        <div class="text-h5">What are you rejecting?</div>
        <q-list>
          <q-item
            @click="selectedRejectionType = rejection.code"
            class="text-subtitle1 q-mt-md"
            v-for="rejection in rejections"
            :key="rejection.code"
            clickable
            :active="selectedRejectionType === rejection.code"
            :active-class="
              selectedRejectionType === rejection.code
                ? 'bg-primary text-white'
                : ''
            "
          >
            <q-item-section>
              {{ rejection.title }}
            </q-item-section>
            <q-item-section avatar side>
              <q-icon name="fas fa-dot-circle" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-step>

      <q-step :name="2" prefix="2" title="Choose reason for rejection">
        <div class="text-h5">What is your main reason for rejection?</div>
        <q-list>
          <q-item
            @click="selectedReason = reason.code"
            class="text-subtitle1 q-mt-md"
            v-for="reason in reasonsForRejection"
            :key="reason.code"
            clickable
            :active="selectedReason === reason.code"
            :active-class="
              selectedReason === reason.code ? 'bg-primary text-white' : ''
            "
          >
            <q-item-section>
              {{ reason.title }}
            </q-item-section>
            <q-item-section avatar side>
              <q-icon name="fas fa-dot-circle" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-step>

      <q-step :name="3" prefix="3" title="Add details">
        <div class="text-h5">Give more details for the rejection?</div>
        <q-input
          class="q-mt-md"
          v-model="rejectionMessage"
          filled
          placeholder="Enter details here..."
        />
      </q-step>

      <template v-slot:navigation>
        <q-stepper-navigation>
          <q-btn
            v-if="step > 1"
            flat
            color="primary"
            @click="stepperRef?.previous()"
            label="Back"
            class="q-ml-sm"
          />
          <q-btn
            @click="onNext"
            :loading="isLoading"
            color="primary"
            :label="step === 3 ? 'Done' : 'Continue'"
          />
        </q-stepper-navigation>
      </template>
    </q-stepper>
  </q-dialog>
</template>

<script setup lang="ts">
import { QDialog, QStepper, useDialogPluginComponent, useQuasar } from 'quasar';
import { ref } from 'vue';
import { RejectionCode, RejectionReason } from 'src/utils/types';

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const $q = useQuasar();

const step = ref(1);
const stepperRef = ref<QStepper | null>(null);

const selectedRejectionType = ref<RejectionCode | null>(null);
const selectedReason = ref<RejectionReason | null>(null);
const rejectionMessage = ref('');
const isLoading = ref(false);

const rejections: {
  code: RejectionCode;
  title: string;
}[] = [
  { code: 'rejectFullSubmission', title: 'Reject Full Submission' },
  { code: 'rejectPages', title: 'Reject Page' },
];

const reasonsForRejection: { code: RejectionReason; title: string }[] = [
  { code: 'image-quality', title: 'Poor Image Quality' },
  { code: 'wrong-doc', title: 'Incorrect Document' },
  { code: 'other', title: 'Other' },
];

const onNext = () => {
  if (step.value === 1) {
    if (selectedRejectionType.value === null) {
      $q.notify({
        type: 'negative',
        message: 'Please select a rejection type',
      });
      return;
    }
    stepperRef.value?.next();
  } else if (step.value === 2) {
    if (selectedReason.value === null) {
      $q.notify({
        type: 'negative',
        message: 'Please select a reason for rejection',
      });
      return;
    }
    stepperRef.value?.next();
  } else if (step.value === 3) {
    onSubmit();
  }
};

const onSubmit = async () => {
  isLoading.value = true;
  onDialogOK({
    type: selectedRejectionType.value,
    reason: selectedReason.value,
    message: rejectionMessage.value,
  });

  isLoading.value = false;
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
