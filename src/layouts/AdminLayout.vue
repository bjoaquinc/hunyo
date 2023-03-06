<template>
  <q-layout view="lHr LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> Admin Page </q-toolbar-title>

        <q-btn
          dense
          flat
          round
          icon="fas fa-info-circle"
          @click="toggleRightDrawer"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      show-if-above
      v-model="leftDrawerOpen"
      :width="400"
      side="left"
      bordered
    >
      <q-stepper
        v-model="step"
        flat
        ref="stepperRef"
        contracted
        color="primary"
        animated
      >
        <q-step
          :name="1"
          title="Select campaign settings"
          icon="settings"
          :done="step > 1"
        >
          <div class="text-h5 q-mb-md">Applicants</div>
          <q-list separator>
            <q-separator />
            <q-item
              clickable
              v-ripple
              v-for="(form, index) in applicants"
              :key="index"
            >
              <q-item-section
                v-if="form.applicant.name"
                @click="selectedApplicantIndex = index"
                class="text-primary text-h6"
                >{{
                  `${form.applicant.name.first} ${form.applicant.name.last}`
                }}</q-item-section
              >
            </q-item>
            <q-separator />
          </q-list>
        </q-step>

        <q-step
          :name="2"
          title="Create an ad group"
          caption="Optional"
          icon="create_new_folder"
          :done="step > 2"
        >
          <div
            v-if="selectedApplicant"
            class="text-h6 q-mb-md flex items-center"
          >
            <span
              ><q-btn
                @click="
                  () => {
                    selectedApplicantIndex = null;
                    selectedDocIndex = null;
                  }
                "
                class="q-mr-sm"
                icon="fas fa-chevron-left"
                flat
                color="primary"
                dense /></span
            >{{ selectedApplicant.applicant.name?.first }}'s Documents
          </div>
          <q-list separator v-if="selectedApplicant">
            <q-separator />
            <q-item
              :clickable="!selectedDoc || selectedDoc.name !== doc.name"
              v-for="(doc, index) in sortedDocs"
              :key="index"
            >
              <q-item-section
                @click="
                  () => {
                    if (
                      selectedPage &&
                      (!selectedDoc || selectedDoc.name !== doc.name)
                    ) {
                      selectedPageIndex = null;
                    }
                    selectedDocIndex = index;
                  }
                "
                ><div class="text-primary text-h6">{{ doc.name }}</div>
                <q-slide-transition>
                  <q-list
                    v-if="selectedDoc && selectedDoc.name === doc.name"
                    separator
                  >
                    <q-item
                      v-for="(page, index) in sortedPages"
                      :key="index"
                      @click="selectedPageIndex = index"
                      :active="
                        selectedPage !== null && selectedPage.name === page.name
                      "
                      active-class="bg-grey-4"
                      clickable
                      v-ripple
                    >
                      <q-item-section>{{ page.name }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-slide-transition>
              </q-item-section>
              <q-item-section
                avatar
                side
                v-if="selectedDoc && selectedDoc.name === doc.name"
              >
                <q-btn
                  @click="
                    () => {
                      selectedDocIndex = null;
                      selectedPageIndex = null;
                    }
                  "
                  icon="fas fa-times"
                  class="q-mb-auto"
                  flat
                  dense
                  color="primary"
                />
              </q-item-section>
            </q-item>
            <q-separator />
          </q-list>
        </q-step>
      </q-stepper>
    </q-drawer>

    <q-drawer v-model="rightDrawerOpen" side="right" bordered>
      <div class="q-pa-md">
        <div class="text-h5 q-mb-md">Page Info</div>
        <q-list separator v-if="displayData">
          <q-separator />
          <q-item v-for="(value, key) in displayData" :key="key">
            <q-item-section>
              <q-item-label>{{ key }}</q-item-label>
              <q-item-label caption lines="2">{{ value }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-separator />
        </q-list>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view
        ref="adminPageRef"
        @clear-selected-index-data="clearSelectedIndexData"
        :selected-page="selectedPage"
        :selected-doc="selectedDoc"
        :selected-applicant="selectedApplicant"
      />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, computed } from 'vue';
import { dbColRefs } from 'src/utils/db';
import {
  onSnapshot,
  orderBy,
  query,
  Unsubscribe,
  where,
} from '@firebase/firestore';
import { Form } from 'src/utils/types';
import { QStepper } from 'quasar';
import { FullMetadata, getMetadata } from '@firebase/storage';
import { storageRefs } from 'src/utils/storage';
import { ApplicantDocument, ApplicantPage } from 'src/utils/new-types';

interface ImageProperties {
  sharpness: number;
  brightness: number;
  contrast: number;
}

onMounted(async () => {
  const formsRef = dbColRefs.forms;
  const q = query(formsRef, where('isChecked', '==', false));
  await new Promise((resolve, reject) => {
    let runOnce = () => {
      runOnce = () => {
        return;
      };
      resolve;
    };
    unsubApplicants.value = onSnapshot(
      q,
      (applicantsSnap) => {
        const applicantsList: (Form & { id: string })[] = [];
        applicantsSnap.forEach((applicantSnap) => {
          const applicantData = applicantSnap.data();
          applicantsList.push({ id: applicantSnap.id, ...applicantData });
        });
        applicants.value = applicantsList;
        runOnce();
      },
      reject
    );
  });
});

const applicants = ref<(Form & { id: string })[]>([]);
const unsubApplicants = ref<Unsubscribe | null>(null);
const selectedApplicantIndex = ref<null | number>(null);
const selectedApplicant = computed<null | (Form & { id: string })>(() => {
  if (typeof selectedApplicantIndex.value === 'number') {
    return applicants.value[selectedApplicantIndex.value];
  } else {
    return null;
  }
});

const sortedDocs = ref<(ApplicantDocument & { id: string })[]>([]);
// Get applicant documents form firestore
watch(selectedApplicant, async (newVal) => {
  if (newVal) {
    const applicantDocsRef = dbColRefs.getDocumentsRef(newVal.company.id);
    const q = query(
      applicantDocsRef,
      where('status', '==', 'submitted'),
      where('formId', '==', newVal.id),
      orderBy('docNumber')
    );
    await new Promise((resolve, reject) => {
      let runOnce = () => {
        runOnce = () => {
          return;
        };
        resolve;
      };
      unsubSortedDocs.value = onSnapshot(
        q,
        (applicantDocsSnap) => {
          const applicantDocsList: (ApplicantDocument & { id: string })[] = [];
          applicantDocsSnap.forEach((applicantDocSnap) => {
            const applicantDocData = applicantDocSnap.data();
            applicantDocsList.push({
              id: applicantDocSnap.id,
              ...applicantDocData,
            });
          });
          sortedDocs.value = applicantDocsList;
          runOnce();
        },
        reject
      );
    });
  } else {
    unsubSortedDocs.value?.();
  }
});
const unsubSortedDocs = ref<Unsubscribe | null>(null);
const selectedDocIndex = ref<null | number>(null);
const selectedDoc = computed(() => {
  if (typeof selectedDocIndex.value === 'number') {
    return sortedDocs.value[selectedDocIndex.value];
  } else {
    return null;
  }
});

const sortedPages = ref<(ApplicantPage & { id: string })[]>([]);
// Get document pages form firestore
watch(selectedDoc, async (newVal) => {
  if (newVal) {
    const applicantDocsRef = dbColRefs.getPagesRef(newVal.companyId);
    const q = query(
      applicantDocsRef,
      where('docId', '==', newVal.id),
      orderBy('pageNumber')
    );
    await new Promise((resolve, reject) => {
      let runOnce = () => {
        runOnce = () => {
          return;
        };
        resolve;
      };
      unsubSortedPages.value = onSnapshot(
        q,
        (pagesSnap) => {
          const pagesList: (ApplicantPage & { id: string })[] = [];
          pagesSnap.forEach((pageSnap) => {
            const applicantDocData = pageSnap.data();
            pagesList.push({
              id: pageSnap.id,
              ...applicantDocData,
            });
          });
          sortedPages.value = pagesList;
          runOnce();
        },
        reject
      );
    });
  } else {
    unsubSortedPages.value?.();
  }
});
const unsubSortedPages = ref<Unsubscribe | null>(null);
const selectedPageIndex = ref<null | number>(null);
const selectedPage = computed(() => {
  if (typeof selectedPageIndex.value === 'number') {
    return sortedPages.value[selectedPageIndex.value];
  } else {
    return null;
  }
});

const originalMetadata = ref<FullMetadata | null>(null);
const fixedMetadata = ref<FullMetadata | null>(null);
const CONVERT_TO_KILO_BYTES = 0.001;
const displayData = computed(() => {
  if (
    selectedApplicant.value &&
    selectedDoc.value &&
    selectedPage.value &&
    originalMetadata.value &&
    fixedMetadata.value
  ) {
    const originalImageProperties = {
      ...originalMetadata.value.customMetadata,
    } as unknown as ImageProperties;
    const fixedImageProperties = {
      ...fixedMetadata.value.customMetadata,
    } as unknown as ImageProperties;
    const data = {
      'System Check Status': selectedPage.value.systemCheckStatus,
      'Original Sharpness': originalImageProperties.sharpness,
      'Fixed Sharpness': fixedImageProperties.sharpness,
      'Original Brightness': originalImageProperties.brightness,
      'Fixed Brightness': fixedImageProperties.brightness,
      'Original Contrast': originalImageProperties.contrast,
      'Fixed Contrast': fixedImageProperties.contrast,
      'Submitted Format': selectedPage.value.submittedFormat,
      'Submitted Size': `${Math.round(selectedPage.value.submittedSize)} KB`,
      'Requested Format': selectedDoc.value.requestedFormat,
      'Compressed Size': `${Math.round(
        originalMetadata.value.size * CONVERT_TO_KILO_BYTES
      )} KB`,
      'Page Number': selectedPage.value.pageNumber,
      'Total Pages': sortedPages.value.length,
      'Device Submitted': selectedDoc.value.deviceSubmitted,
      Job: selectedApplicant.value.dashboard.job,
      Country: selectedApplicant.value.dashboard.country,
    };
    return data;
  } else {
    return null;
  }
});

watch(selectedApplicant, (newValue, oldValue) => {
  if (newValue && !oldValue) {
    step.value = 2;
  } else if (!newValue) {
    step.value = 1;
  }
});

// Update original and fixed metadata
watch(selectedPage, async (newValue) => {
  if (newValue && selectedApplicant.value && selectedDoc.value) {
    const companyId = selectedApplicant.value.company.id;
    const dashboardId = selectedApplicant.value.dashboard.id;
    const applicantId = selectedApplicant.value.applicant.id;
    const submittedFormat = newValue.submittedFormat;
    const getFileName = (format: string) => `${newValue.name}.${format}`;
    const ORIGINAL_FORMAT =
      submittedFormat === 'application/pdf' ? 'pdf' : 'jpeg';
    console.log(getFileName(ORIGINAL_FORMAT));
    const originalPageRef = storageRefs.getOriginalDocRef(
      companyId,
      dashboardId,
      applicantId,
      getFileName(ORIGINAL_FORMAT)
    );
    console.log(originalPageRef.fullPath);
    originalMetadata.value = await getMetadata(originalPageRef);
    if (originalMetadata.value.contentType === 'image/jpeg') {
      // If the original file is an image, it has a fixed image
      const fixedPageRef = storageRefs.getFixedDocRef(
        companyId,
        dashboardId,
        applicantId,
        getFileName(selectedDoc.value.requestedFormat)
      );
      fixedMetadata.value = await getMetadata(fixedPageRef);
    }
  } else {
    originalMetadata.value = null;
    fixedMetadata.value = null;
  }
});

const clearSelectedIndexData = () => {
  selectedPageIndex.value = null;
  selectedDocIndex.value = null;
  selectedApplicantIndex.value = null;
};

const step = ref(1);
const stepperRef = ref<QStepper | null>(null);
const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value;
};
</script>
