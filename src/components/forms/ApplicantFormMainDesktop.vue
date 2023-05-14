<template>
  <q-layout view="hHh LpR fFf">
    <q-drawer
      show-if-above
      v-model="leftDrawerOpen"
      side="left"
      :width="500"
      bordered
    >
      <q-list separator v-model="selectedDocId">
        <!-- <div class="full-width flex justify-center"> -->
        <q-img
          :src="logoURL"
          v-if="logoURL"
          class="q-ma-md"
          style="max-width: 300px"
        />
        <!-- </div> -->
        <div class="text-h5 q-pa-md">
          Requirements ({{ requiredDocs.length }})
        </div>
        <q-separator class="q-px-md" />
        <q-item
          @click="onDocumentClick(doc)"
          :active-class="`bg-${
            documentStatusStyles[doc.status].textColor
          } text-white`"
          :active="doc.id === selectedDocId"
          class="text-h6 q-py-md"
          :class="`text-${documentStatusStyles[doc.status].textColor}`"
          clickable
          v-for="doc in requiredDocs"
          :key="doc.id"
        >
          <q-item-section>
            {{ documentStatusStyles[doc.status].mobileLabel }} {{ doc.name }}
          </q-item-section>
          <q-item-section avatar side>
            <q-icon :name="documentStatusStyles[doc.status].actionIcon" />
          </q-item-section>
        </q-item>
        <q-separator />
      </q-list>
    </q-drawer>

    <q-page-container>
      <q-page>
        <q-tab-panels
          animated
          v-model="selectedDocId"
          class="bg-grey-1"
          keep-alive
          v-show="selectedDocId"
        >
          <q-tab-panel :name="doc.id" v-for="doc in documents" :key="doc.id">
            <component :is="pages[doc.status]" :doc="doc" />
          </q-tab-panel>
        </q-tab-panels>
        <SelectRequirement v-show="!selectedDocId" />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
// import * as amplitude from '@amplitude/analytics-browser';
import { documentStatusStyles } from './styles';
// import { useQuasar } from 'quasar';
import { onMounted, ref, computed } from 'vue';
import { Form } from 'src/utils/types';
import { storageRefs } from 'src/utils/storage';
import { getDownloadURL } from '@firebase/storage';
// import { DateTime } from 'luxon';
import UploadFiles from './desktop/UploadFiles.vue';
import SelectRequirement from './desktop/SelectRequirement.vue';
import DocumentAccepted from './desktop/DocumentAccepted.vue';
import DocumentSubmitted from './desktop/DocumentSubmitted.vue';
import { ApplicantDocument } from 'src/utils/new-types';
// import DialogFormRejectionInformation from './mobile/DialogFormRejectionInformation.vue';
// type ValueOf<T> = T[keyof T];

const pages = {
  'not-submitted': UploadFiles,
  accepted: DocumentAccepted,
  rejected: null,
  delayed: null,
  submitted: DocumentSubmitted,
  'admin-checked': DocumentSubmitted,
};
const leftDrawerOpen = ref(true);
const props = defineProps<{
  form: Form & { id: string };
  documents: (ApplicantDocument & { id: string })[];
}>();
const requiredDocs = computed(() => {
  return props.documents.filter((doc) => doc.isRequired);
});
const selectedDocId = ref<string | null>(null);

// const ifAvailableDocs = computed(() => {
//   return props.documents.filter((doc) => !doc.isRequired);
// });

// const deadline = computed(() => {
//   const deadlineTimestamp = props.form.dashboard.deadline;
//   const dateTime = DateTime.fromMillis(deadlineTimestamp.toMillis());
//   return dateTime.toLocaleString({
//     month: 'long',
//     day: '2-digit',
//     year: 'numeric',
//   });
// });

// const $q = useQuasar();
const logoURL = ref('');

onMounted(async () => {
  const logo = props.form.company.logo;
  if (logo) {
    const logoRef = storageRefs.getLogoRef(logo);
    logoURL.value = await getDownloadURL(logoRef);
  }
});

const onDocumentClick = (doc: ApplicantDocument & { id: string }) => {
  selectedDocId.value = doc.id;
  const docStatus = doc.status;
  // amplitude.track('Select Document', {
  //   applicantName: props.form.applicant.name,
  //   docId: doc.id,
  //   docName: doc.name,
  //   orderOnList: doc.docNumber,
  //   docStatus: doc.status,
  // });
  // const docStatus = doc.status;
  // const rejection = doc.rejection;
  if (docStatus === 'not-submitted') {
    // onNotSubmitted(index);
  }
  // if (docStatus === 'rejected' && rejection) {
  // onRejected(index);
  // }
  // if (docStatus === 'not-applicable') {
  //   onNotApplicable(index);
  // }
  if (docStatus === 'delayed') {
    // onDelayed(index);
  }

  // if (docStatus === 'accepted') {
  //   onAccepted(index);
  // }
};

// const onNotSubmitted = async (index: number) => {
//   await new Promise<void>((resolve) => {
//     showSample(props.documents[index], resolve);
//   });
//   $q.dialog({
//     component: DialogFormDocumentAvailability,
//     componentProps: {
//       form: props.form,
//       doc: props.documents[index],
//     },
//   }).onOk((documentAvailability) => {
//     if (documentAvailability === 'available') {
//       $q.dialog({
//         component: DialogFormSubmitDocImage,
//         componentProps: {
//           doc: props.documents[index],
//           form: props.form,
//           index,
//         },
//       }).onOk(() => {
//         const docName = props.documents[index].name;
//         $q.notify({
//           message: `${docName} submitted. Thank you.`,
//           type: 'positive',
//         });
//       });
//     }

//     if (documentAvailability === 'not-available') {
//       $q.dialog({
//         component: DialogFormScheduleSubmission,
//         componentProps: {
//           doc: props.documents[index],
//           form: props.form,
//         },
//       }).onOk(() => {
//         $q.notify({
//           message: 'Submission scheduled successfully',
//           type: 'positive',
//         });
//       });
//     }

//     if (documentAvailability === 'not-applicable') {
//       $q.notify({
//         message: 'Document changed to Not Applicable.',
//         type: 'grey-8',
//       });
//     }
//   });
// };

// const showSample = async (
//   doc: ApplicantDocument & { id: string },
//   resolve?: () => void
// ) => {
//   if (!doc.sample || doc.sample.contentType === 'application/pdf') {
//     resolve?.();
//     return;
//   }
//   const storageRef = storageRefs.getSampleRef(
//     doc.companyId,
//     doc.dashboardId,
//     doc.sample.file
//   );
//   const url = await getDownloadURL(storageRef);

//   $q.dialog({
//     component: DialogFormSample,
//     componentProps: {
//       sampleURL: url,
//       doc,
//       form: props.form,
//     },
//   }).onOk(() => {
//     if (resolve) {
//       resolve();
//     }
//   });
// };

// const onRejected = (index: number) => {
//   // CREATE NEW FLOW FOR DOCUMENT RESUBMISSION
//   $q.dialog({
//     component: DialogFormRejectionInformation,
//     componentProps: {
//       doc: props.documents[index],
//       form: props.form,
//     },
//   }).onOk(async () => {
//     await new Promise<void>((resolve) => {
//       showSample(props.documents[index], resolve);
//     });
//     $q.dialog({
//       component: DialogFormSubmitDocImage,
//       componentProps: {
//         doc: props.documents[index],
//         form: props.form,
//         index,
//       },
//     }).onOk(() => {
//       const docName = props.documents[index].name;
//       $q.notify({
//         message: `${docName} submitted. Thank you.`,
//         type: 'positive',
//       });
//     });
//   });
// };

// const onDelayed = (index: number) => {
//   const dialog = $q.dialog({
//     component: DialogFormDelayedUpdate,
//   });
//   dialog.onOk(async (payload: 'submit-now' | 'reschedule') => {
//     if (payload === 'submit-now') {
//       await new Promise<void>((resolve) => {
//         showSample(props.documents[index], resolve);
//       });
//       const dialog = $q.dialog({
//         component: DialogFormSubmitDocImage,
//         componentProps: {
//           doc: props.documents[index],
//           form: props.form,
//           index,
//         },
//       });
//       dialog.onOk(() => {
//         const docName = props.documents[index].name;
//         $q.notify({
//           message: `${docName} submitted. Thank you.`,
//           type: 'positive',
//         });
//       });
//     }
//     if (payload === 'reschedule') {
//       const dialog = $q.dialog({
//         component: DialogFormScheduleSubmission,
//         componentProps: {
//           doc: props.documents[index],
//           form: props.form,
//         },
//       });
//       dialog.onOk(() => {
//         $q.notify({
//           message: 'Successfully rescheduled.',
//           type: 'positive',
//         });
//       });
//     }
//   });
// };
</script>

<style lang="sass" scoped></style>
