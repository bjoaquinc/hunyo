<template>
  <div>
    <component
      :is="steps[step]"
      :doc="doc"
      :form="form"
      :company="company"
      @nextStep="nextStep"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DocumentRejected from './DocumentRejected.vue';
import UploadFiles from './UploadFiles.vue';
import { ApplicantDocument } from 'src/utils/new-types';
import { Company, Form } from 'src/utils/types';

const step = ref<1 | 2>(1);
const steps = {
  1: DocumentRejected,
  2: UploadFiles,
};

const nextStep = () => {
  step.value = 2;
};

defineProps<{
  doc: ApplicantDocument & { id: string };
  form: Form & { id: string };
  company: Company;
}>();
</script>

<style scoped></style>
