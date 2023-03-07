<template>
  <q-page>
    <div
      class="row q-col-gutter-md q-py-md"
      v-if="selectedPage && selectedDoc && isReady"
    >
      <!-- Original Page Render -->
      <div class="col">
        <q-img
          v-if="selectedPage.submittedFormat === 'image/jpeg'"
          style="width: 100%; height: auto"
          :src="originalPage"
        >
          <div class="full-width flex transparent">
            <q-btn
              :href="originalPage"
              target="_blank"
              class="q-ml-auto bg-black"
              style="opacity: 0.7"
              round
              icon="fas fa-arrow-down"
              size="lg"
              flat
            />
          </div>
        </q-img>
        <embed
          v-else
          :src="originalPage"
          type="application/pdf"
          style="width: 100%; height: 85vh"
          inline
        />
      </div>
      <!-- Fixed Page Render (if original is an image) -->
      <div class="col" v-if="selectedPage.submittedFormat === 'image/jpeg'">
        <embed
          v-if="selectedDoc.requestedFormat === 'pdf'"
          :src="fixedPage"
          type="application/pdf"
          style="width: 100%; height: 100%"
          inline
        />
        <q-img v-else style="width: 100%; height: auto" :src="fixedPage">
          <div class="full-width flex transparent">
            <q-btn
              :href="fixedPage"
              target="_blank"
              class="q-ml-auto bg-black"
              style="opacity: 0.7"
              round
              icon="fas fa-arrow-down"
              size="lg"
              flat
            />
          </div>
        </q-img>
      </div>
      <div class="col-12 flex justify-around q-py-md">
        <q-btn
          @click="onAccept()"
          :loading="acceptIsLoading"
          label="Accept"
          color="positive"
          size="lg"
        />
        <q-btn label="Reject" color="negative" size="lg" />
        <q-btn label="Replace" color="primary" size="lg" />
      </div>
      <!-- <div
        v-else
        class="col-12 text-h3 text-center q-mb-lg q-mt-xl text-positive"
      >
        Test
      </div> -->
    </div>
    <div v-else class="absolute-center text-h3">Select a page...</div>
  </q-page>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue';
import { Form } from 'src/utils/types';
import { storageRefs } from 'src/utils/storage';
import { getDownloadURL } from '@firebase/storage';
import { dbDocRefs, dbColRefs } from 'src/utils/db';
import {
  addDoc,
  increment,
  serverTimestamp,
  updateDoc,
} from '@firebase/firestore';
import { useQuasar } from 'quasar';
import { ApplicantDocument, ApplicantPage } from 'src/utils/new-types';

const props = defineProps<{
  selectedPage: (ApplicantPage & { id: string }) | null;
  selectedDoc: (ApplicantDocument & { id: string }) | null;
  selectedApplicant: (Form & { id: string }) | null;
}>();

const emit = defineEmits<{
  (e: 'clearSelectedIndexData'): void;
}>();

const $q = useQuasar();
const originalPage = ref('');
const fixedPage = ref('');
const isReady = ref(false);
const acceptIsLoading = ref(false);

// fetch urls for documents and images
watch(
  props,
  async (newValue) => {
    if (
      newValue.selectedPage &&
      newValue.selectedApplicant &&
      newValue.selectedDoc
    ) {
      isReady.value = false;
      const ORIGINAL_FORMAT =
        newValue.selectedPage.submittedFormat === 'application/pdf'
          ? 'pdf'
          : 'jpeg';
      const originalPageRef = storageRefs.getOriginalDocRef(
        newValue.selectedApplicant.company.id,
        newValue.selectedApplicant.dashboard.id,
        newValue.selectedApplicant.applicant.id,
        `${newValue.selectedPage.name}.${ORIGINAL_FORMAT}`
      );
      originalPage.value = await getDownloadURL(originalPageRef);
      if (ORIGINAL_FORMAT === 'jpeg') {
        const fixedPageRef = storageRefs.getFixedDocRef(
          newValue.selectedApplicant.company.id,
          newValue.selectedApplicant.dashboard.id,
          newValue.selectedApplicant.applicant.id,
          `${newValue.selectedPage.name}.${newValue.selectedDoc.requestedFormat}`
        );
        fixedPage.value = await getDownloadURL(fixedPageRef);
      }
      isReady.value = true;
    }
  },
  { deep: true }
);

const onAccept = async () => {
  acceptIsLoading.value = true;
  if (props.selectedApplicant && props.selectedDoc && props.selectedPage) {
    const pageRef = dbDocRefs.getPageRef(
      props.selectedPage.companyId,
      props.selectedPage.id
    );
    // Create success doc
    const acceptedPagesRef = dbColRefs.acceptedPagesRef;
    const ACCEPTED_BY = 'admin';
    await addDoc(acceptedPagesRef, {
      createdAt: serverTimestamp(),
      companyId: props.selectedApplicant.company.id,
      dashboardId: props.selectedApplicant.dashboard.id,
      applicantId: props.selectedApplicant.applicant.id,
      docId: props.selectedDoc.id,
      pageId: props.selectedPage.id,
      formId: props.selectedApplicant.id,
      name: props.selectedPage.name,
      contentType: props.selectedPage.submittedFormat,
      acceptedBy: ACCEPTED_BY,
    });
    // Update page status to admin-checked
    await updateDoc(pageRef, {
      status: 'admin-checked',
    });
    // Update Applicant Document
    const documentRef = dbDocRefs.getDocumentRef(
      props.selectedDoc.companyId,
      props.selectedDoc.id
    );
    await updateDoc(documentRef, {
      adminAcceptedPages: increment(1),
    });
    acceptIsLoading.value = false;
  }
};

// const onReject = async () => {
//   const data = await openDialogAdminCheckReject();
//   const { rejection, reason, message } = data;
//   if (rejection === 'rejectPages') {
//     $q.loading.show({
//       spinner: QSpinnerPie,
//     });
//     const updatedPageData = await updatePageStatusToRejected(reason, message);
//     const adminCheck = { ...props.selectedApplicant };
//     if (updatedPageData && adminCheck && adminCheck.id) {
//       const adminCheckRef = dbDocRefs.getAdminCheckRef(adminCheck.id);
//       await updateDoc(adminCheckRef, updatedPageData);
//       const updatedDocAndApplicantData = await updateDocAndApplicantStatus();
//       if (updatedDocAndApplicantData) {
//         await updateDoc(adminCheckRef, updatedDocAndApplicantData);
//       }
//     }
//     $q.loading.hide();
//   }

//   if (rejection === 'rejectFullSubmission') {
//     // TODO: reject submission
//   }
// };

// const updatePageStatusToRejected = async (
//   reason: RejectionReason,
//   message?: string
// ) => {
//   if (!props.selectedApplicant || !props.selectedDoc || !props.selectedPage) {
//     return;
//   }
//   const docId = props.selectedDoc.id;
//   const pageId = props.selectedPage.id;
//   const PAGE_COMPUTED_KEY = `docs.${docId}.pages.${pageId}`;
//   const updatedPageData = {
//     [`${PAGE_COMPUTED_KEY}.adminCheckStatus`]: 'Rejected',
//     [`${PAGE_COMPUTED_KEY}.rejection`]: {
//       reason,
//       message,
//     },
//   };
//   return updatedPageData;
// };

// const openDialogAdminCheckReject = async () => {
//   const data = await new Promise<{
//     rejection: RejectionCode;
//     reason: RejectionReason;
//     message: string;
//   }>((resolve) => {
//     $q.dialog({
//       component: DialogAdminCheckReject,
//     }).onOk((data) => resolve(data));
//   });
//   return data;
// };

// const updateDocAndApplicantStatus = async () => {
//   if (props.selectedApplicant && props.selectedDoc && props.selectedPage) {
//     const doc = { ...props.selectedDoc };
//     // Check if all pages are checked and get rejection reasons;
//     let DOC_STATUS: 'Accepted' | 'Rejected' = 'Accepted';
//     const rejectionReasons: RejectionReason[] = [];
//     for (const pageId of Object.keys(doc.pages)) {
//       if (doc.pages[pageId].adminCheckStatus === undefined) {
//         return console.log('page not checked');
//       }
//       const docAdminCheckStatus = doc.pages[pageId].adminCheckStatus;
//       const pageRejection = doc.pages[pageId].rejection;
//       if (docAdminCheckStatus === 'Rejected' && pageRejection !== undefined) {
//         DOC_STATUS = 'Rejected';
//         rejectionReasons.push(pageRejection.reason);
//       }
//     }
//     const updatedDocData = await updateDocStatusAndCreateSystemTask(
//       DOC_STATUS,
//       doc.id,
//       rejectionReasons
//     );
//     // Check if all docs are checked
//     const adminCheck = { ...props.selectedApplicant };
//     let uncheckedDocs = 0;
//     for (const docId of Object.keys(adminCheck.docs)) {
//       if (adminCheck.docs[docId].adminCheckStatus === 'Not Checked') {
//         uncheckedDocs++;
//       }
//     }
//     if (uncheckedDocs > 1) {
//       console.log('not all docs are checked');
//       return updatedDocData;
//     }
//     if (props.selectedDoc && props.selectedDoc.id === doc.id) {
//       emit('clearSelectedIndexData');
//     }
//     const updatedAdminCheck = await updateAdminIsChecked();
//     return {
//       ...updatedDocData,
//       ...updatedAdminCheck,
//     };
//   }
// };

// const updateDocStatusAndCreateSystemTask = async (
//   docStatus: 'Accepted' | 'Rejected',
//   docId: string,
//   rejectionReasons: RejectionReason[]
// ) => {
//   console.log('doc status', docStatus);
//   const DOC_COMPUTED_KEY = `docs.${docId}`;
//   const updatedData: { [key: string]: string | DocRejection } = {
//     [`${DOC_COMPUTED_KEY}.adminCheckStatus`]: docStatus,
//   };
//   if (docStatus === 'Rejected') {
//     const REJECTION_CODE = 'rejectPages';
//     const REJECTED_BY = 'admin';
//     const DOC_REJECTION = {
//       code: REJECTION_CODE,
//       reason: rejectionReasons,
//       rejectedBy: REJECTED_BY,
//       rejectedAt: serverTimestamp(),
//     } as DocRejection;
//     updatedData[`${DOC_COMPUTED_KEY}.systemTask`] = REJECTION_CODE;
//     updatedData[`${DOC_COMPUTED_KEY}.rejection`] = DOC_REJECTION;
//   } else {
//     updatedData[`${DOC_COMPUTED_KEY}.systemTask`] = 'acceptDoc';
//   }
//   return updatedData;
// };

// const updateAdminIsChecked = async () => {
//   const ADMIN_IS_CHECKED_STATUS = true;
//   const updatedData = {
//     isChecked: ADMIN_IS_CHECKED_STATUS,
//   };
//   return updatedData;
// };
</script>

<style scoped></style>
