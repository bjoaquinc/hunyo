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
              v-for="(form, index) in adminChecks"
              :key="index"
            >
              <q-item-section
                v-if="form.applicant.name"
                @click="selectedAdminCheckIndex = index"
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
            v-if="selectedAdminCheck"
            class="text-h6 q-mb-md flex items-center"
          >
            <span
              ><q-btn
                @click="
                  () => {
                    selectedAdminCheckIndex = null;
                    selectedDocIndex = null;
                  }
                "
                class="q-mr-sm"
                icon="fas fa-chevron-left"
                flat
                color="primary"
                dense /></span
            >{{ selectedAdminCheck.applicant.name?.first }}'s Documents
          </div>
          <q-list separator v-if="selectedAdminCheck">
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
        :selected-admin-check="selectedAdminCheck"
      />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, computed } from 'vue';
import { dbColRefs } from 'src/utils/db';
import { onSnapshot, query, Unsubscribe, where } from '@firebase/firestore';
import { AdminCheck, AdminCheckDoc, AdminCheckPage } from 'src/utils/types';
import { QStepper } from 'quasar';
import { FullMetadata, getMetadata } from '@firebase/storage';
import { storageRefs } from 'src/utils/storage';

interface ImageProperties {
  sharpness: number;
  brightness: number;
  contrast: number;
}

onMounted(async () => {
  const adminChecksRef = dbColRefs.adminChecks;
  const q = query(adminChecksRef, where('isChecked', '==', false));
  await new Promise((resolve, reject) => {
    let runOnce = () => {
      runOnce = () => {
        return;
      };
      resolve;
    };
    unsubAdminChecks.value = onSnapshot(
      q,
      (adminChecksSnap) => {
        const adminChecksList: (AdminCheck & { id: string })[] = [];
        adminChecksSnap.forEach((adminCheckSnap) => {
          const adminCheckData = adminCheckSnap.data();
          adminChecksList.push({ id: adminCheckSnap.id, ...adminCheckData });
        });
        adminChecks.value = adminChecksList;
        runOnce();
      },
      reject
    );
  });
});

const adminChecks = ref<(AdminCheck & { id: string })[]>([]);
const unsubAdminChecks = ref<Unsubscribe | null>(null);
const selectedAdminCheckIndex = ref<null | number>(null);
const selectedAdminCheck = computed<null | (AdminCheck & { id: string })>(
  () => {
    if (
      typeof selectedAdminCheckIndex.value === 'number' &&
      adminChecks.value.length > 0
    ) {
      return adminChecks.value[selectedAdminCheckIndex.value];
    } else {
      return null;
    }
  }
);
const sortedDocs = computed(() => {
  if (selectedAdminCheck.value) {
    const docs = selectedAdminCheck.value.docs;
    const sortedDocs = Object.keys(docs)
      .map((key) => ({ id: key, ...docs[key] }))
      .sort((docA, docB) => docA.docNumber - docB.docNumber);
    return sortedDocs.filter((doc) => doc.adminCheckStatus === 'Not Checked');
  } else {
    return [];
  }
});
const selectedDocIndex = ref<null | number>(null);
const selectedDoc = computed<null | (AdminCheckDoc & { id: string })>(() => {
  if (
    typeof selectedDocIndex.value === 'number' &&
    sortedDocs.value.length > 0
  ) {
    return sortedDocs.value[selectedDocIndex.value];
  } else {
    return null;
  }
});
const sortedPages = computed(() => {
  if (selectedDoc.value) {
    const pages = selectedDoc.value.pages;
    return Object.keys(pages)
      .map((key) => ({ id: key, ...pages[key] }))
      .sort((pageA, pageB) => pageA.pageNumber - pageB.pageNumber);
  } else {
    return [];
  }
});
const selectedPageIndex = ref<null | number>(null);
const selectedPage = computed<null | (AdminCheckPage & { id: string })>(() => {
  if (
    typeof selectedPageIndex.value === 'number' &&
    sortedPages.value.length > 0
  ) {
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
    selectedAdminCheck.value &&
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
      'Requested Format': selectedDoc.value.format,
      'Compressed Size': `${Math.round(
        originalMetadata.value.size * CONVERT_TO_KILO_BYTES
      )} KB`,
      'Page Number': selectedPage.value.pageNumber,
      'Total Pages': sortedPages.value.length,
      'Device Submitted': selectedDoc.value.deviceSubmitted,
      Job: selectedAdminCheck.value.dashboard.job,
      Country: selectedAdminCheck.value.dashboard.country,
    };
    return data;
  } else {
    return null;
  }
});

watch(selectedAdminCheck, (newValue, oldValue) => {
  if (newValue && !oldValue) {
    step.value = 2;
  } else if (!newValue) {
    step.value = 1;
  }
});

// Update original and fixed metadata
watch(selectedPage, async (newValue) => {
  if (newValue && selectedAdminCheck.value) {
    const companyId = selectedAdminCheck.value.companyId;
    const dashboardId = selectedAdminCheck.value.dashboard.id;
    const applicantId = selectedAdminCheck.value.applicant.id;
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
        getFileName((selectedDoc.value as AdminCheckDoc).format)
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
  selectedAdminCheckIndex.value = null;
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
