<template>
  <q-page>
    <div
      class="row q-col-gutter-md q-py-md"
      v-if="
        selectedDoc &&
        selectedPageIndex !== null &&
        pages.length > 0 &&
        !acceptIsLoading
      "
    >
      <!-- Original Page Render -->
      <div class="col">
        <q-img
          v-if="pages[selectedPageIndex].submittedFormat === 'image/jpeg'"
          style="width: 100%; height: auto"
          :src="pages[selectedPageIndex].originalURL"
        >
          <div class="full-width flex transparent">
            <q-btn
              :href="pages[selectedPageIndex].originalURL"
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
          :src="pages[selectedPageIndex].originalURL"
          type="application/pdf"
          style="width: 100%; height: 85vh"
          inline
        />
      </div>
      <!-- Fixed Page Render (if original is an image) -->
      <div class="col" v-if="pages[selectedPageIndex].fixedURL">
        <embed
          v-if="selectedDoc.requestedFormat === 'pdf'"
          :src="pages[selectedPageIndex].fixedURL"
          type="application/pdf"
          style="width: 100%; height: 100%"
          inline
        />
        <q-img
          v-else
          style="width: 100%; height: auto"
          :src="pages[selectedPageIndex].fixedURL"
        >
          <div class="full-width flex transparent">
            <q-btn
              :href="pages[selectedPageIndex].fixedURL"
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
          @click="updatePageStatus('accepted')"
          :outline="pages[selectedPageIndex].updatedStatus !== 'accepted'"
          :loading="acceptIsLoading"
          label="Accept"
          color="positive"
          size="lg"
        />
        <q-btn
          @click="openDialogAdminCheckReject()"
          :outline="pages[selectedPageIndex].updatedStatus !== 'rejected'"
          label="Reject"
          color="negative"
          size="lg"
        />
        <q-btn
          :loading="replaceIsLoading"
          @click="updateImageProperty()"
          :outline="pages[selectedPageIndex].updatedStatus !== 'replaced'"
          label="Replace"
          color="primary"
          size="lg"
        />
      </div>
    </div>
    <div v-else class="absolute-center text-h3">Select a page...</div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Form, RejectionCode, RejectionReason } from 'src/utils/types';
import { ApplicantDocument, ApplicantPage } from 'src/utils/new-types';
import { useQuasar } from 'quasar';
import DialogAdminCheckReject from 'src/components/admin/DialogAdminCheckReject.vue';
import { storageRefs } from 'src/utils/storage';
import { updateMetadata } from '@firebase/storage';
const replaceIsLoading = ref(false);

const props = defineProps<{
  selectedDoc: (ApplicantDocument & { id: string }) | null;
  selectedApplicant: (Form & { id: string }) | null;
  pages: (ApplicantPage & {
    id: string;
    originalURL: string;
    fixedURL?: string;
    updatedStatus: 'not-checked' | 'accepted' | 'rejected' | 'replaced';
  })[];
  selectedPageIndex: number | null;
}>();

const emit = defineEmits<{
  (e: 'clearSelectedPage'): void;
  (
    e: 'updatePageStatus',
    pageId: string,
    status: 'accepted' | 'rejected' | 'replaced'
  ): void;
  (
    e: 'addPageRejection',
    pageId: string,
    reason: RejectionReason,
    message?: string
  ): void;
}>();

const $q = useQuasar();

const acceptIsLoading = ref(false);

const updatePageStatus = (status: 'accepted' | 'rejected' | 'replaced') => {
  const { pages, selectedPageIndex } = props;
  if (pages.length > 0 && selectedPageIndex !== null) {
    const page = pages[selectedPageIndex];
    emit('updatePageStatus', page.id, status);
  }
};

const updateImageProperty = async () => {
  replaceIsLoading.value = true;
  console.log(props);
  if (props.selectedPageIndex === null) return;
  if (!props.selectedDoc) return;
  const page = props.pages[props.selectedPageIndex];
  const fileName = `${page.name}.jpeg`;
  const storageRef = storageRefs.getOriginalDocRef(
    page.companyId,
    page.dashboardId,
    page.applicantId,
    fileName
  );
  console.log('updating image metadata');
  await updateMetadata(storageRef, {
    customMetadata: {
      property: 'removeBrightness',
      format: props.selectedDoc.requestedFormat,
      companyId: page.companyId,
      dashboardId: page.dashboardId,
      applicantId: page.applicantId,
    },
  });
  replaceIsLoading.value = false;
};

const addPageRejection = (
  pageId: string,
  reason: RejectionReason,
  message?: string
) => {
  console.log('Emitting event');
  emit('addPageRejection', pageId, reason, message);
};

const openDialogAdminCheckReject = () => {
  const dialog = $q.dialog({
    component: DialogAdminCheckReject,
  });
  dialog.onOk(
    (payload: {
      type: RejectionCode;
      reason: RejectionReason;
      message?: string;
    }) => {
      const { type, reason, message } = payload;
      if (type === 'pages') {
        console.log('pages');
        if (props.selectedPageIndex === null) return;
        const currentPage = props.pages[props.selectedPageIndex];
        addPageRejection(currentPage.id, reason, message);
        updatePageStatus('rejected');
      }
      if (type === 'full-submission') {
        for (const page of props.pages) {
          addPageRejection(page.id, reason, message);
          emit('updatePageStatus', page.id, 'rejected');
        }
      }
    }
  );
};
</script>

<style scoped></style>
