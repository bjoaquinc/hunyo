<template>
  <q-page>
    <div
      class="row q-col-gutter-md q-py-md"
      v-if="selectedDoc && selectedPageIndex !== null && pages.length > 0"
    >
      <!-- Original Page Render -->
      <div class="col" style="min-height: 90vh">
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
        <q-inner-loading
          :showing="
            pages &&
            selectedPageIndex !== null &&
            pages[selectedPageIndex].updatingFixedImage
          "
        >
          <q-spinner-pie size="80px" color="primary" />
        </q-inner-loading>
      </div>
    </div>
    <div v-else class="absolute-center text-h3">Select a page...</div>
  </q-page>
</template>

<script setup lang="ts">
import { Form } from 'src/utils/types';
import { ApplicantDocument, ApplicantPage } from 'src/utils/new-types';

defineProps<{
  selectedDoc: (ApplicantDocument & { id: string }) | null;
  selectedApplicant: (Form & { id: string }) | null;
  pages: (ApplicantPage & {
    id: string;
    originalURL: string;
    fixedURL?: string;
  })[];
  selectedPageIndex: number | null;
}>();
</script>

<style scoped></style>
