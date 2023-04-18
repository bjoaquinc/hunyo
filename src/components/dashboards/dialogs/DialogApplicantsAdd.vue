<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" persistent>
    <q-card class="full-width">
      <q-form @submit="addApplicants">
        <q-card-section>
          <div class="full-width">
            <q-card-section style="padding-bottom: 0px">
              <div class="flex justify-between no-wrap">
                <div class="text-h5">Add Applicants</div>
                <q-btn icon="fas fa-times" color="grey-8" flat v-close-popup />
              </div>
            </q-card-section>
            <q-card-section>
              <BaseAddEmails
                ref="baseAddEmailsRef"
                :required="true"
                :action-button="false"
                :added-emails="addedEmails"
              />
            </q-card-section>
          </div>
          <q-btn
            :loading="isLoading"
            color="primary"
            label="Done"
            class="full-width"
            type="submit"
          />
        </q-card-section>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { QDialog, useDialogPluginComponent } from 'quasar';
import { computed, ref } from 'vue';
import BaseAddEmails from 'src/components/BaseAddEmails.vue';
import { dbDocRefs } from 'src/utils/db';
import { PublishedDashboard } from 'src/utils/types';
import { arrayUnion, updateDoc } from '@firebase/firestore';

const { dialogRef, onDialogHide } = useDialogPluginComponent();
const props = defineProps<{
  companyId: string;
  dashboard: PublishedDashboard & { id: string };
  addedEmails: string[];
}>();
const isLoading = ref(false);
const baseAddEmailsRef = ref<null | typeof BaseAddEmails>(null);
const emails = computed(() => {
  if (baseAddEmailsRef.value && baseAddEmailsRef.value.emails) {
    return baseAddEmailsRef.value.emails;
  } else {
    return [];
  }
});

const addApplicants = async () => {
  if (emails.value.length < 1) return;
  isLoading.value = true;
  const applicants = emails.value;
  const dashboardRef = dbDocRefs.getPublishedDashboardRef(
    props.companyId,
    props.dashboard.id
  );
  await updateDoc(dashboardRef, {
    newApplicants: arrayUnion(...applicants),
  });
  isLoading.value = false;
  dialogRef.value?.hide();
};

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);
</script>
