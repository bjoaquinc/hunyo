<template>
  <q-page>
    <div v-if="doc.rejection" class="absolute-center text-h4 text-grey-7">
      <!-- <div>Reason for Rejection</div> -->
      <!-- <q-separator class="q-my-md" /> -->
      <div>Your {{ doc.alias || doc.name }} was rejected because:</div>
      <q-list class="q-mt-md">
        <q-item
          v-for="rejection in doc.rejection.reasons"
          class="text-h5 text-negative"
          :key="rejection"
        >
          <q-item-section side avatar>
            <q-icon name="fas fa-file-circle-exclamation" size="40px" />
          </q-item-section>
          <q-item-section>
            {{ rejectionLabels[rejection] }}
          </q-item-section>
        </q-item>
      </q-list>
      <div class="flex column q-mt-lg" v-if="doc.rejection.message">
        <div class="text-h4 text-grey-8">Kindly note:</div>
        <div class="text-h5 text-grey-8 q-mt-sm" style="white-space: pre-line">
          {{ doc.rejection.message }}
        </div>
      </div>
      <q-btn
        @click="emit('nextStep')"
        class="full-width q-mt-lg"
        label="Resubmit"
        color="primary"
        size="lg"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ApplicantDocument } from 'src/utils/new-types';
import { rejectionLabels } from '../helpers';

defineProps<{
  doc: ApplicantDocument & { id: string };
}>();

const emit = defineEmits<{
  (e: 'nextStep'): void;
}>();
</script>

<style scoped></style>
