<template>
  <div></div>
</template>

<script setup lang="ts"></script>

<style scoped></style>

<!-- <template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="full-width">
      <q-card-section v-if="isReady && applicant">
        <div class="flex full-width">
          <div class="text-h5">
            {{
              applicant.name
                ? `${applicant?.name.first} ${applicant?.name.last}`
                : applicant.email
            }}
          </div>
          <q-btn v-close-popup class="q-ml-auto" icon="fas fa-times" flat />
        </div>
        <div v-if="applicant.name" class="text-subtitle2">
          {{ applicant.email }}
        </div>
        <q-separator class="q-mt-md" />
        <div class="text-h6 q-mt-md"><u>Submitted</u></div>
        <div v-for="(doc, index) in submittedDocs" :key="index">
          <q-btn
            size="lg"
            :label="`${index + 1}. ${doc.name}`"
            :href="doc.file"
            color="primary"
            flat
            dense
            no-caps
          />
        </div>
        <q-separator class="q-mt-md" />
        <div class="text-h6 q-mt-md"><u>Not Submitted</u></div>
        <div v-for="(doc, index) in notSubmittedDocs" :key="index">
          <q-btn
            size="lg"
            :label="`${index + 1}. ${doc}`"
            color="grey8"
            flat
            dense
            no-caps
            disable
          />
        </div>
      </q-card-section>

      <q-card-section v-else>
        <q-item>
          <q-item-section>
            <q-item-label>
              <q-skeleton type="text" />
            </q-item-label>
            <q-item-label caption>
              <q-skeleton type="text" />
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-skeleton height="200px" square />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { getDoc } from '@firebase/firestore';
import { dbDocRefs } from 'src/utils/db';
import { QDialog, useDialogPluginComponent } from 'quasar';
import { onMounted, ref } from 'vue';
import { Applicant } from 'src/utils/types';
import { storageRefs } from 'src/utils/storage';
import { getDownloadURL } from '@firebase/storage';

const props = defineProps<{
  companyId: string;
  applicantId: string;
  applicantDashboardId: string;
  dashboardId: string;
  dashboardDocs: {
    name: string;
    format: 'pdf' | 'jpeg';
    sample?: string | undefined;
  }[];
}>();

const { dialogRef, onDialogHide } = useDialogPluginComponent();
const isReady = ref(false);
const applicant = ref<(Applicant & { id: string }) | null>(null);
const submittedDocs = ref<{ file: string; name: string }[]>([]);
const notSubmittedDocs = ref<string[]>([]);

onMounted(async () => {
  if (!dialogRef.value) return;
  const applicantRef = dbDocRefs.getApplicantRef(
    props.companyId,
    props.applicantId
  );
  const applicantSnap = await getDoc(applicantRef);
  const applicantData = applicantSnap.data();
  if (!applicantData) return dialogRef.value.hide();
  applicant.value = { id: applicantSnap.id, ...applicantData };
  if (applicant.value.docs && applicant.value.docs[props.dashboardId]) {
    const applicantDocs = applicant.value.docs[props.dashboardId];
    await getDocURLs(applicantDocs);
  }
  getNotSubmittedDocs();
  isReady.value = true;
});

const getDocURLs = async (docs: { file: string; name: string }[]) => {
  for (const doc of docs) {
    const docRef = storageRefs.getVerifyDocsRef(
      props.companyId,
      props.dashboardId,
      props.applicantDashboardId,
      doc.file
    );
    const docURL = await getDownloadURL(docRef);
    submittedDocs.value.push({
      file: docURL,
      name: doc.name,
    });
  }
};

const getNotSubmittedDocs = () => {
  const hasDoc = (docName: string) =>
    submittedDocs.value.filter((doc) => doc.name === docName).length > 0;
  for (const dashboardDoc of props.dashboardDocs) {
    if (submittedDocs.value.length === 0) {
      notSubmittedDocs.value.push(dashboardDoc.name);
    } else if (!hasDoc(dashboardDoc.name)) {
      notSubmittedDocs.value.push(dashboardDoc.name);
    }
  }
};

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);
</script> -->
