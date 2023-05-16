<template>
  <q-layout view="hHh LpR fFf">
    <q-drawer
      show-if-above
      v-model="leftDrawerOpen"
      side="left"
      :width="500"
      bordered
    >
      <q-list separator v-model="selectedDocId" class="q-pa-md">
        <q-img
          :src="logoUrl"
          v-if="logoUrl"
          class="q-ma-md"
          style="max-width: 300px"
        />
        <div class="text-h5 q-px-md">Deadline: {{ formattedDeadline }}</div>
        <div class="text-h5 q-mt-md q-px-md">
          Submit the Requirements below ({{ requiredDocs.length }})
        </div>
        <q-separator class="q-mt-md" />
        <q-item
          @click="selectedDocId = doc.id"
          :active-class="`bg-${
            documentStatusStyles[doc.status].textColor
          } text-white`"
          :active="doc.id === selectedDocId"
          class="text-h6 q-py-md"
          :class="
            doc.id === selectedDocId
              ? ''
              : `text-${documentStatusStyles[doc.status].textColor}`
          "
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
      <!-- <q-page> -->
      <q-tab-panels
        animated
        v-model="selectedDocId"
        class="bg-grey-1"
        keep-alive
        v-show="selectedDocId"
      >
        <q-tab-panel
          :name="doc.id"
          v-for="doc in documents"
          class="q-pa-none"
          :key="doc.id"
        >
          <Transition name="fade" mode="out-in">
            <component
              :is="setPage(doc)"
              :doc="doc"
              :form="form"
              :company="company"
            />
          </Transition>
        </q-tab-panel>
      </q-tab-panels>
      <SelectRequirement v-show="!selectedDocId" />
      <!-- </q-page> -->
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
// import * as amplitude from '@amplitude/analytics-browser';
import { documentStatusStyles } from './styles';
// import { useQuasar } from 'quasar';
import { ref, computed } from 'vue';
import { Company, Form } from 'src/utils/types';
import { DateTime } from 'luxon';
import UploadFiles from './desktop/UploadFiles.vue';
import SelectRequirement from './desktop/SelectRequirement.vue';
import DocumentAccepted from './desktop/DocumentAccepted.vue';
import DocumentSubmitted from './desktop/DocumentSubmitted.vue';
import { ApplicantDocument } from 'src/utils/new-types';
import DocumentRejectFlow from './desktop/DocumentRejectFlow.vue';

const leftDrawerOpen = ref(true);
const props = defineProps<{
  form: Form & { id: string };
  documents: (ApplicantDocument & { id: string })[];
  company: Company;
  logoUrl: string;
}>();
const formattedDeadline = computed(() => {
  const deadline = props.form.dashboard.deadline.toMillis();
  return DateTime.fromMillis(deadline).toLocaleString({
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
});
const requiredDocs = computed(() => {
  return props.documents.filter((doc) => doc.isRequired);
});
const selectedDocId = ref<string | null>(null);

// type PageComponent =
//   | typeof UploadFiles
//   | typeof DocumentAccepted
//   | typeof DocumentSubmitted;

// const pages = {
//   accepted: DocumentAccepted,
//   upload: UploadFiles,
//   submitted: DocumentSubmitted,
// };

const setPage = (doc: ApplicantDocument & { id: string }) => {
  if (doc.status === 'accepted') {
    return DocumentAccepted;
  }

  if (doc.status === 'admin-checked' || doc.status === 'submitted') {
    return DocumentSubmitted;
  }

  if (doc.status === 'rejected' && doc.rejection) {
    return DocumentRejectFlow;
  }

  if (doc.status === 'not-submitted') {
    if (doc.sample) {
      // Return Sample Page
      return null;
    } else {
      return UploadFiles;
    }
  }
  return null;
};
</script>

<style lang="sass" scoped></style>
