<template>
  <q-page>
    <div
      class="row q-col-gutter-md q-py-md"
      v-if="selectedPage && selectedDoc && isReady && !acceptIsLoading"
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
import { ApplicantDocument, ApplicantPage } from 'src/utils/new-types';

const props = defineProps<{
  selectedPage: (ApplicantPage & { id: string }) | null;
  selectedDoc: (ApplicantDocument & { id: string }) | null;
  selectedApplicant: (Form & { id: string }) | null;
}>();

const emit = defineEmits<{
  (e: 'clearSelectedPage'): void;
}>();

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
    const page = { ...props.selectedPage };
    emit('clearSelectedPage');
    const pageRef = dbDocRefs.getPageRef(page.companyId, page.id);
    // Create success doc
    const acceptedPagesRef = dbColRefs.acceptedPagesRef;
    const ACCEPTED_BY = 'admin';
    await addDoc(acceptedPagesRef, {
      createdAt: serverTimestamp(),
      companyId: props.selectedApplicant.company.id,
      dashboardId: props.selectedApplicant.dashboard.id,
      applicantId: props.selectedApplicant.applicant.id,
      docId: props.selectedDoc.id,
      pageId: page.id,
      formId: props.selectedApplicant.id,
      name: page.name,
      contentType: page.submittedFormat,
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
</script>

<style scoped></style>
