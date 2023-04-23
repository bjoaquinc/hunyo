<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" persistent>
    <q-card class="full-width">
      <q-card-section>
        <div class="full-width">
          <q-card-section>
            <div class="flex justify-between no-wrap">
              <div class="text-h5">
                Check
                {{ `${applicantName?.first} ${applicantName?.last}` }}'s
                Documents
              </div>
              <q-btn icon="fas fa-times" color="grey-8" flat v-close-popup />
            </div>
          </q-card-section>
          <q-card-section>
            <q-list
              separator
              v-if="applicantDocuments && applicantDocuments.length > 0"
            >
              <q-separator />
              <q-item
                @click="openDialogActionVerifyDocument(index)"
                v-for="(doc, index) in applicantDocuments"
                :key="index"
                :clickable="!doc.isUpdating"
              >
                <q-item-section>
                  <q-item-label class="text-h6">{{ doc.name }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="flex text-body1 items-center">
                    <div>
                      {{ doc.isUpdating ? 'Updating...' : 'View Document' }}
                    </div>
                    <q-icon
                      v-if="!doc.isUpdating"
                      class="q-ml-sm"
                      name="fas fa-chevron-right"
                    />
                    <q-spinner-pie v-else class="q-ml-md" size="md" />
                  </div>
                </q-item-section>
              </q-item>
              <q-separator />
            </q-list>
            <q-skeleton v-else height="200px" square />
          </q-card-section>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { QDialog, useDialogPluginComponent, useQuasar } from 'quasar';
import { dbColRefs } from 'src/utils/db';
import { ref, onMounted, onUnmounted } from 'vue';
import DialogActionVerifyDocument from './DialogActionVerifyDocument.vue';
import {
  query,
  where,
  orderBy,
  Unsubscribe,
  onSnapshot,
} from '@firebase/firestore';
import { ApplicantDocument } from 'src/utils/new-types';
import * as amplitude from '@amplitude/analytics-browser';

const { dialogRef, onDialogHide } = useDialogPluginComponent();
const $q = useQuasar();
const applicantDocuments = ref<(ApplicantDocument & { id: string })[]>([]);
const unsubApplicantDocuments = ref<Unsubscribe | null>(null);

const props = defineProps<{
  companyId: string;
  applicantId: string;
  applicantName: {
    first: string;
    middle: string;
    last: string;
  };
}>();
onMounted(async () => {
  const documentsRef = dbColRefs.getDocumentsRef(props.companyId);
  const q = query(
    documentsRef,
    where('applicantId', '==', props.applicantId),
    where('status', '==', 'admin-checked'),
    orderBy('docNumber')
  );
  await new Promise<void>((resolve) => {
    let runOnce = () => {
      runOnce = () => {
        return;
      };
      resolve();
    };
    unsubApplicantDocuments.value = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'removed') {
          // remove doc
          if (applicantDocuments.value.length === 1) {
            unsubApplicantDocuments.value?.();
            dialogRef.value?.hide();
          }
          const index = change.oldIndex;
          applicantDocuments.value.splice(index, 1);
        }
        if (change.type === 'modified') {
          // update doc
          const index = change.oldIndex;
          applicantDocuments.value[index] = {
            id: change.doc.id,
            ...change.doc.data(),
          };
        }
        if (change.type === 'added') {
          // add doc
          applicantDocuments.value.push({
            id: change.doc.id,
            ...change.doc.data(),
          });
        }
      });
      runOnce();
    });
  });
});

onUnmounted(() => {
  unsubApplicantDocuments.value?.();
});

const openDialogActionVerifyDocument = (index: number) => {
  const doc = applicantDocuments.value[index];
  amplitude.track('Check - Select Document', {
    docName: doc.name,
    docId: doc.id,
    applicantId: props.applicantId,
    numOfUncheckedDocs: applicantDocuments.value.length,
  });
  $q.dialog({
    component: DialogActionVerifyDocument,
    componentProps: {
      applicantDocument: doc,
    },
  }).onOk(async () => {
    console.log('onOk');
  });
};

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);
</script>
