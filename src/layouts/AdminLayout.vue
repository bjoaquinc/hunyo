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
          <div v-show="!isEditingName">
            <div
              class="text-h6 q-mb-md flex items-center"
              v-if="selectedApplicant && selectedApplicant.applicant.name"
            >
              <q-btn
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
                dense
              />
              <q-btn
                @click="showEditApplicantName"
                class="text-body1"
                :label="`${selectedApplicant.applicant.name.first} ${selectedApplicant.applicant.name.middle} ${selectedApplicant.applicant.name.last}`"
                flat
                dense
                color="primary"
                no-caps
              />
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
                      v-if="
                        selectedDoc &&
                        selectedDoc.name === doc.name &&
                        sortedPages.length > 0
                      "
                      separator
                    >
                      <q-item
                        v-for="(page, index) in sortedPages"
                        :key="index"
                        @click="selectedPageIndex = index"
                        :active="
                          selectedPage !== null &&
                          selectedPage.name === page.name
                        "
                        active-class="bg-grey-4"
                        clickable
                        v-ripple
                      >
                        <q-item-section>{{ page.name }}</q-item-section>
                      </q-item>
                      <q-btn
                        @click="updateDocAndPagesStatus"
                        label="Done"
                        color="primary"
                        class="full-width q-mt-md"
                      />
                      <div
                        class="text-body1 q-mt-md text-negative q-px-sm"
                        v-if="showWarningMessage"
                      >
                        <div class="q-mt-md text-center">
                          <q-icon
                            size="lg"
                            name="fas fa-exclamation-triangle"
                          />
                        </div>
                        <div class="q-mt-md text-center">
                          <span>Warning!</span>
                        </div>
                        <div class="q-mt-md text-center">
                          You missed some pages. Please review and accept or
                          reject them.
                        </div>
                      </div>
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
          </div>
          <div v-show="isEditingName">
            <q-form @submit.prevent="updateName" greedy>
              <div class="flex items-center justify-between">
                <div class="text-h6">Edit Name</div>
                <q-btn
                  @click="
                    () => {
                      isEditingName = false;
                      updatedName = {
                        first: '',
                        middle: '',
                        last: '',
                      };
                    }
                  "
                  icon="fas fa-times"
                  flat
                  dense
                  color="grey-8"
                />
              </div>
              <div class="row q-gutter-sm q-mr-sm q-mt-sm">
                <div class="col-12">
                  <q-input
                    :rules="[(val) => !!val || 'This field is required']"
                    v-model="updatedName.first"
                    label="First Name"
                    filled
                    dense
                  />
                </div>
                <div class="col-12">
                  <q-input
                    :rules="[(val) => !!val || 'This field is required']"
                    v-model="updatedName.middle"
                    label="Middle Name"
                    filled
                    dense
                  />
                </div>
                <div class="col-12">
                  <q-input
                    :rules="[(val) => !!val || 'This field is required']"
                    v-model="updatedName.last"
                    label="Last Name"
                    filled
                    dense
                  />
                </div>
                <div class="col-12">
                  <q-btn
                    :loading="isUpdatingName"
                    type="submit"
                    label="Update Name"
                    color="primary"
                    class="full-width"
                  />
                </div>
              </div>
            </q-form>
          </div>
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
        @update-page-status="updatePageStatus"
        @add-page-rejection="addPageRejection"
        @clear-selected-page="clearSelectedPage"
        :pages="sortedPages"
        :selected-page-index="selectedPageIndex"
        :selected-doc="selectedDoc"
        :selected-applicant="selectedApplicant"
      />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import * as amplitude from '@amplitude/analytics-browser';
import { ref, onMounted, watch, computed } from 'vue';
import { dbColRefs, dbDocRefs } from 'src/utils/db';
import {
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Unsubscribe,
  updateDoc,
  where,
} from '@firebase/firestore';
import { Form, RejectionReason } from 'src/utils/types';
import { QStepper } from 'quasar';
import { FullMetadata, getDownloadURL, getMetadata } from '@firebase/storage';
import { storageRefs } from 'src/utils/storage';
import { ApplicantDocument, ApplicantPage } from 'src/utils/new-types';

interface ImageProperties {
  sharpness: number;
  brightness: number;
  contrast: number;
}

const acceptedStatus = ['submitted'];

onMounted(async () => {
  const formsRef = dbColRefs.forms;
  const q = query(formsRef, where('adminCheckDocs', '>', 0));
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
const showWarningMessage = ref(false);
const isEditingName = ref(false);
const updatedName = ref({
  first: '',
  middle: '',
  last: '',
});
const isUpdatingName = ref(false);

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

const showEditApplicantName = () => {
  if (selectedApplicant.value && selectedApplicant.value.applicant.name) {
    updatedName.value = selectedApplicant.value.applicant.name;
    isEditingName.value = true;
  }
};

const updateName = async () => {
  isUpdatingName.value = true;
  if (selectedApplicant.value) {
    const applicantRef = dbDocRefs.getFormRef(selectedApplicant.value.id);
    await updateDoc(applicantRef, {
      'applicant.name': updatedName.value,
    });
    updatedName.value = {
      first: '',
      middle: '',
      last: '',
    };
    isEditingName.value = false;
  }
  isUpdatingName.value = false;
};

const sortedDocs = ref<(ApplicantDocument & { id: string })[]>([]);
// Get applicant documents form firestore
watch(selectedApplicant, async (newVal) => {
  if (newVal) {
    const applicantDocsRef = dbColRefs.getDocumentsRef(newVal.company.id);
    const q = query(
      applicantDocsRef,
      where('status', 'in', acceptedStatus),
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

const sortedPages = ref<
  (ApplicantPage & {
    id: string;
    originalURL: string;
    fixedURL?: string;
    updatedStatus: 'not-checked' | 'accepted' | 'rejected' | 'replaced';
  })[]
>([]);
// Get document pages from firestore
watch(selectedDoc, async (newVal) => {
  if (newVal) {
    const applicantDocsRef = dbColRefs.getPagesRef(newVal.companyId);
    const q = query(
      applicantDocsRef,
      where('docId', '==', newVal.id),
      where('status', 'in', acceptedStatus),
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
        async (pagesSnap) => {
          sortedPages.value = await Promise.all(
            pagesSnap.docs.map(async (pageSnap) => {
              const ORIGINAL_IMAGE_SUFFIX =
                pageSnap.data().submittedFormat === 'application/pdf'
                  ? 'pdf'
                  : 'jpeg';
              const ORIGINAL_DOC_NAME = `${
                pageSnap.data().name
              }.${ORIGINAL_IMAGE_SUFFIX}`;
              const originalImageRef = storageRefs.getOriginalDocRef(
                newVal.companyId,
                newVal.dashboardId,
                newVal.applicantId,
                ORIGINAL_DOC_NAME
              );
              const originalURL = await getDownloadURL(originalImageRef);
              let fixedURL = '';
              if (pageSnap.data().submittedFormat.includes('image')) {
                const FIXED_IMAGE_SUFFIX = newVal.requestedFormat;
                const FIXED_DOC_NAME = `${
                  pageSnap.data().name
                }.${FIXED_IMAGE_SUFFIX}`;
                const fixedImageRef = storageRefs.getFixedDocRef(
                  newVal.companyId,
                  newVal.dashboardId,
                  newVal.applicantId,
                  FIXED_DOC_NAME
                );
                fixedURL = await getDownloadURL(fixedImageRef);
              }
              return {
                id: pageSnap.id,
                updatedStatus: 'not-checked',
                originalURL,
                fixedURL,
                ...pageSnap.data(),
              };
            })
          );
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

const updatePageStatus = (
  pageId: string,
  status: 'accepted' | 'rejected' | 'replaced'
) => {
  sendAmplitudeAssessPageEvent(status);
  const pageIndex = sortedPages.value.findIndex((page) => page.id === pageId);
  sortedPages.value[pageIndex].updatedStatus = status;
};

const sendAmplitudeAssessPageEvent = (status: string) => {
  if (originalMetadata.value && fixedMetadata.value) {
    const originalImageProperties = {
      ...originalMetadata.value.customMetadata,
    } as unknown as ImageProperties;
    const fixedImageProperties = {
      ...fixedMetadata.value.customMetadata,
    } as unknown as ImageProperties;
    amplitude.track('Admin Assess Page', {
      decision: status,
      originalBrightness: originalImageProperties.brightness,
      originalSharpness: originalImageProperties.sharpness,
      originalContrast: originalImageProperties.contrast,
      fixedBrightness: fixedImageProperties.brightness,
      fixedSharpness: fixedImageProperties.sharpness,
      fixedContrast: fixedImageProperties.contrast,
      docName: selectedDoc.value?.name,
      docId: selectedDoc.value?.id,
      pageNumber: selectedPage.value?.pageNumber,
      pageId: selectedPage.value?.id,
      totalNumberOfPages: sortedPages.value.length,
    });
  }
};

const addPageRejection = (
  pageId: string,
  reason: RejectionReason,
  message?: string
) => {
  const pageIndex = sortedPages.value.findIndex((page) => page.id === pageId);
  sortedPages.value[pageIndex].rejection = {
    reason,
    message,
  };
  console.log(sortedPages.value[pageIndex]);
};

const updateDocAndPagesStatus = async () => {
  if (!pagesAreChecked()) return;
  if (!selectedDoc.value) return;
  selectedPageIndex.value = null;
  let isRejected = false;
  let numOfAcceptedPages = 0;
  const rejectionReasons: string[] = [];
  const rejectedPageIds: string[] = [];
  const promises: Promise<void>[] = [];
  sortedPages.value.forEach((page) => {
    if (page.updatedStatus === 'rejected' && page.rejection) {
      isRejected = true;
      if (!rejectionReasons.includes(page.rejection.reason)) {
        rejectionReasons.push(page.rejection.reason);
      }
      rejectedPageIds.push(page.id);
      const pageRef = dbDocRefs.getPageRef(page.companyId, page.id);
      const promise = updateDoc(pageRef, {
        status: 'rejected',
        rejection: page.rejection,
      });
      promises.push(promise);
    }
    if (
      page.updatedStatus === 'accepted' ||
      page.updatedStatus === 'replaced'
    ) {
      numOfAcceptedPages++;
      const pageRef = dbDocRefs.getPageRef(page.companyId, page.id);
      const promise = updateDoc(pageRef, {
        status: 'admin-checked',
      });
      promises.push(promise);
    }
  });

  const docRef = dbDocRefs.getDocumentRef(
    selectedDoc.value.companyId,
    selectedDoc.value.id
  );

  if (!isRejected) {
    // Accept Document
    const promise = updateDoc(docRef, {
      adminAcceptedPages: increment(numOfAcceptedPages),
    });
    promises.push(promise);

    // TODO: UPDATE NAME FOR RRJM, REMOVE FOR OTHER CLIENTS!
    const capitalizeFirstLetter = (string: string) => {
      const stringToLowerCase = string.toLowerCase();
      return (
        stringToLowerCase.charAt(0).toUpperCase() + stringToLowerCase.slice(1)
      );
    };

    const form = applicants.value[selectedApplicantIndex.value as number];
    const name = form.applicant.name as {
      first: string;
      middle: string;
      last: string;
    };

    const fixName = (name: string) => {
      return name.trim().split(' ').map(capitalizeFirstLetter).join('_');
    };
    const fixedDocName = selectedDoc.value.name
      .replace(' (If Available)', '')
      .replace(' - ', '-');
    const fixedName = [
      fixName(name.first),
      fixName(name.middle),
      fixName(name.last),
    ];
    const DOCUMENT_SUFFIX = selectedDoc.value.requestedFormat;
    const updatedDocName = `${fixedDocName}_${fixedName.join(
      '_'
    )}.${DOCUMENT_SUFFIX}`;
    promises.push(updateDoc(docRef, { updatedName: updatedDocName }));
    console.log(selectedDoc.value.id);
  }

  if (
    isRejected &&
    (numOfAcceptedPages > 0 ||
      sortedPages.value.length < selectedDoc.value.totalPages)
  ) {
    // Resubmit Pages
    const promise = updateDoc(docRef, {
      adminAcceptedPages: increment(numOfAcceptedPages),
      status: 'rejected',
      rejection: {
        rejectedAt: serverTimestamp(),
        type: 'pages',
        pageIds: rejectedPageIds,
        reasons: rejectionReasons,
        rejectedBy: 'admin',
      },
    });
    promises.push(promise);
  }

  if (
    isRejected &&
    numOfAcceptedPages === 0 &&
    sortedPages.value.length === selectedDoc.value.totalPages
  ) {
    // Resubmit Full Document
    const promise = updateDoc(docRef, {
      status: 'rejected',
      rejection: {
        rejectedAt: serverTimestamp(),
        type: 'full-submission',
        reasons: rejectionReasons,
        rejectedBy: 'admin',
      },
    });
    promises.push(promise);
  }

  const formRef = dbDocRefs.getFormRef(selectedDoc.value.formId);
  const DECREMENT = increment(-1);
  const promise = updateDoc(formRef, {
    adminCheckDocs: DECREMENT,
  });
  promises.push(promise);

  await Promise.all(promises);
};

const pagesAreChecked = () => {
  for (const page of sortedPages.value) {
    if (page.updatedStatus === 'not-checked') {
      showWarningMessage.value = true;
      selectedPageIndex.value = sortedPages.value.findIndex(
        (p) => p.id === page.id
      );
      const timeout = setTimeout(() => {
        showWarningMessage.value = false;
        clearTimeout(timeout);
      }, 10000);
      return false;
    }
  }
  return true;
};

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

const clearSelectedPage = () => {
  selectedPageIndex.value = null;
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
