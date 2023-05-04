<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" full-width>
    <q-card style="max-width: 900px !important">
      <q-card-section>
        <div class="full-width">
          <q-card-section>
            <div class="flex justify-between">
              <div class="flex column">
                <div class="text-h5">
                  {{
                    applicant.name
                      ? `${applicant.name?.first} ${applicant.name?.middle} ${applicant.name?.last}`
                      : applicant.email
                  }}
                </div>
                <div class="text-subtitle1 text-grey-8" v-if="applicant.name">
                  {{ applicant.email }}
                </div>
                <div class="flex column" v-if="applicant.phoneNumbers">
                  <div
                    v-for="(number, index) in Object.values(
                      applicant.phoneNumbers
                    )"
                    :key="index"
                  >
                    <div v-if="number" class="text-subtitle1 text-grey-8">
                      {{ number }}
                    </div>
                  </div>
                </div>
                <div
                  class="text-subtitle1 text-grey-8"
                  v-if="applicant.address"
                >
                  {{ applicant.address }}
                </div>
              </div>
              <q-btn icon="fas fa-times" color="grey-8" flat v-close-popup />
            </div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-list
              class="gt-xs"
              separator
              v-if="applicantDocuments && applicantDocuments.length > 0"
            >
              <q-item
                @click="onDocumentClick(doc.id)"
                class="text-h6 q-py-md rounded-borders"
                :class="
                  documentItemStyles[doc.status].bgColor
                    ? `bg-${documentItemStyles[doc.status].bgColor}`
                    : ''
                "
                v-for="(doc, index) in applicantDocuments"
                :key="index"
                :clickable="documentItemStyles[doc.status].clickable"
                :v-ripple="documentItemStyles[doc.status].clickable"
              >
                <q-item-section avatar>
                  <q-icon
                    name="fas fa-file"
                    :color="documentItemStyles[doc.status].textColor"
                  />
                </q-item-section>
                <q-item-section
                  :class="`text-${documentItemStyles[doc.status].textColor}`"
                  >{{ doc.name }}
                </q-item-section>
                <q-item-section class="text-subtitle1 text-grey-8">
                  <div
                    class="q-ml-auto flex items-center"
                    :class="`text-${documentItemStyles[doc.status].textColor}`"
                  >
                    {{ documentItemStyles[doc.status].actionLabel
                    }}<q-icon
                      v-if="documentItemStyles[doc.status].actionIcon"
                      :name="(documentItemStyles[doc.status].actionIcon as string)"
                      class="q-ml-md"
                      size="sm"
                    />
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
import {
  query,
  where,
  orderBy,
  Unsubscribe,
  onSnapshot,
} from '@firebase/firestore';
import { Applicant } from 'src/utils/types';
import { ApplicantDocument } from 'src/utils/new-types';
import DialogActionVerifyDocument from './DialogActionVerifyDocument.vue';
import DialogApplicantPages from './DialogApplicantAcceptedDocument.vue';
import { DateTime } from 'luxon';

const { dialogRef, onDialogHide } = useDialogPluginComponent();
const applicantDocuments = ref<(ApplicantDocument & { id: string })[]>([]);
const unsubApplicantDocuments = ref<Unsubscribe | null>(null);
const $q = useQuasar();

const documentItemStyles = {
  'not-submitted': {
    textColor: 'grey-8',
    actionIcon: '',
    actionLabel: 'Not Submitted',
    mobileLabel: 'Uploaded',
    clickable: false,
    bgColor: null,
  },
  delayed: {
    textColor: 'orange-8',
    actionIcon: 'fas fa-clock',
    actionLabel: 'Delayed',
    mobileLabel: 'Delayed',
    clickable: true,
    bgColor: null,
  },
  submitted: {
    textColor: 'grey-8',
    actionIcon: '',
    actionLabel: 'Not Submitted',
    mobileLabel: 'Uploaded',
    clickable: false,
    bgColor: null,
  },
  accepted: {
    textColor: 'positive',
    actionIcon: 'fas fa-chevron-right',
    actionLabel: 'Accepted',
    mobileLabel: 'Accepted',
    clickable: true,
    bgColor: null,
  },
  rejected: {
    textColor: 'grey-8',
    actionIcon: '',
    actionLabel: 'Not Submitted',
    mobileLabel: 'Uploaded',
    clickable: false,
    bgColor: null,
  },
  'not-applicable': {
    bgColor: null,
    textColor: 'grey-6',
    actionIcon: 'fas fa-minus',
    actionLabel: 'Not Applicable',
    mobileLabel: 'Not Applicable',
    clickable: false,
  },
  'admin-checked': {
    textColor: 'negative',
    actionIcon: 'fas fa-chevron-right',
    actionLabel: 'Check now',
    mobileLabel: 'Uploaded',
    clickable: true,
    bgColor: null,
  },
};

const props = defineProps<{
  companyId: string;
  applicant: Applicant & { id: string };
}>();
onMounted(async () => {
  const applicantDocumentsRef = dbColRefs.getDocumentsRef(props.companyId);
  const q = query(
    applicantDocumentsRef,
    where('applicantId', '==', props.applicant.id),
    orderBy('docNumber')
  );
  await new Promise<void>((resolve, reject) => {
    let runOnce = () => {
      runOnce = () => {
        return;
      };
      resolve();
    };
    unsubApplicantDocuments.value = onSnapshot(
      q,
      (snapshot) => {
        applicantDocuments.value = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        runOnce();
      },
      (error) => {
        reject(error);
      }
    );
  });
});

const onDocumentClick = (docId: string) => {
  const docIndex = applicantDocuments.value.findIndex(
    (doc) => doc.id === docId
  );
  const doc = applicantDocuments.value[docIndex];
  if (doc.status === 'accepted') {
    openDialogApplicantPages(doc);
  }

  if (doc.status === 'admin-checked') {
    openDialogActionVerifyDocument(doc);
  }

  if (doc.status === 'delayed') {
    // TODO: Show dialog delayed
    const delayedUntil = doc.delayedUntil;
    if (!delayedUntil) return;
    const FORMATTED_DELAYED_UNTIL = DateTime.fromMillis(
      delayedUntil.toMillis()
    ).toLocaleString({
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    });
    $q.dialog({
      title: `${doc.name} is delayed until ${FORMATTED_DELAYED_UNTIL}`,
      // message: `${doc.name} is delayed until ${FORMATTED_DELAYED_UNTIL}`,
      ok: true,
    });
  }
};

const openDialogApplicantPages = (doc: ApplicantDocument & { id: string }) => {
  $q.dialog({
    component: DialogApplicantPages,
    componentProps: {
      applicantDocument: doc,
    },
  });
};

const openDialogActionVerifyDocument = (
  doc: ApplicantDocument & { id: string }
) => {
  $q.dialog({
    component: DialogActionVerifyDocument,
    componentProps: {
      applicantDocument: doc,
    },
  }).onOk(() => {
    // TODO: Show updating document
  });
};

onUnmounted(() => {
  unsubApplicantDocuments.value?.();
});

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);
</script>
