<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    @show="onDialogShow"
    full-width
  >
    <q-card style="max-width: 900px !important">
      <q-card-section>
        <div class="full-width">
          <q-card-section>
            <div class="flex">
              <div class="flex column full-width" v-if="applicant">
                <div class="flex full-width">
                  <div class="text-h5">
                    {{
                      applicant.name
                        ? `${applicant.name?.first} ${applicant.name?.middle} ${applicant.name?.last}`
                        : applicant.email
                    }}
                  </div>
                  <q-btn
                    @click="editApplicantData"
                    icon="far fa-pen-to-square"
                    color="grey-8"
                    class="q-ml-md"
                    flat
                  />
                  <q-btn
                    icon="fas fa-times"
                    color="grey-8"
                    class="q-ml-auto"
                    flat
                    v-close-popup
                  />
                </div>

                <div class="text-subtitle1 text-grey-8" v-if="applicant.name">
                  {{ `${applicant.email}` }}
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
import { ref, onUnmounted, computed } from 'vue';
import {
  query,
  where,
  orderBy,
  Unsubscribe,
  onSnapshot,
} from '@firebase/firestore';
// import { Applicant } from 'src/utils/types';
import { ApplicantDocument } from 'src/utils/new-types';
import DialogActionVerifyDocument from './DialogActionVerifyDocument.vue';
import DialogApplicantPages from './DialogApplicantAcceptedDocument.vue';
import { DateTime } from 'luxon';
import DialogDashboardApplicantForm from './DialogDashboardApplicantForm.vue';
import { useDashboardStore } from 'src/stores/dashboard-store';
import { storeToRefs } from 'pinia';

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
  applicantId: string;
}>();

const dashboardStore = useDashboardStore();
const { applicants } = storeToRefs(dashboardStore);
const applicant = computed(() => {
  return applicants.value.find((a) => a.id === props.applicantId);
});

const onDialogShow = async () => {
  try {
    if (!applicant.value) {
      throw new Error('Applicant not found');
    }
    const applicantDocumentsRef = dbColRefs.getDocumentsRef(props.companyId);
    const q = query(
      applicantDocumentsRef,
      where('applicantId', '==', applicant.value.id),
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
  } catch (error) {
    console.error(error);
    $q.notify({
      message: 'Error loading documents',
      type: 'negative',
    });
  }
};

const onDocumentClick = (docId: string) => {
  const docIndex = applicantDocuments.value.findIndex(
    (doc) => doc.id === docId
  );
  const doc = applicantDocuments.value[docIndex];
  if (doc.status === 'accepted') {
    openApplicantAcceptedDoc(doc);
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
      ok: true,
    });
  }
};

const openApplicantAcceptedDoc = (doc: ApplicantDocument & { id: string }) => {
  const { id: docId, companyId } = doc;
  $q.dialog({
    component: DialogApplicantPages,
    componentProps: {
      docId,
      companyId,
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

const editApplicantData = () => {
  $q.dialog({
    component: DialogDashboardApplicantForm,
    componentProps: {
      applicant: applicant.value,
    },
  });
};

// watch(
//   props,
//   (newVal) => {
//     console.log('applicant: ', newVal.applicant);
//   },
//   { deep: true }
// );

onUnmounted(() => {
  unsubApplicantDocuments.value?.();
});

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);
</script>
