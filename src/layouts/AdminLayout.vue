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
          <div v-show="!isEditingName && !isEditingImageProperties">
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
                @click="showEditName"
                class="text-body1"
                :label="`${selectedApplicant.applicant.name.first} ${selectedApplicant.applicant.name.middle} ${selectedApplicant.applicant.name.last}`"
                flat
                dense
                color="primary"
                no-caps
              />
            </div>
            <q-list separator v-if="selectedApplicant" class="q-mt-sm">
              <q-separator />
              <q-item
                :clickable="!selectedDoc || selectedDoc.name !== doc.name"
                v-for="(doc, index) in sortedDocs"
                :key="index"
              >
                <q-item-section>
                  <div class="flex justify-between full-width">
                    <div
                      @click="
                        () => {
                          if (selectedDoc && selectedDoc.name === doc.name) {
                            return;
                          } else {
                            clearSortedPages();
                            selectedDocIndex = index;
                          }
                        }
                      "
                      class="text-primary text-h6"
                      :class="
                        !selectedDoc || doc.name !== selectedDoc.name
                          ? 'full-width'
                          : ''
                      "
                    >
                      {{ doc.name }}
                    </div>
                    <q-btn
                      @click="
                        () => {
                          selectedPageIndex = null;
                          selectedDocIndex = null;
                        }
                      "
                      v-if="selectedDoc && selectedDoc.name === doc.name"
                      icon="fas fa-times"
                      flat
                      dense
                      color="primary"
                    />
                  </div>
                  <q-slide-transition>
                    <q-list
                      v-if="
                        selectedDoc &&
                        selectedDoc.name === doc.name &&
                        sortedPages.length > 0
                      "
                      class="q-mt-sm"
                      separator
                    >
                      <q-item
                        v-for="(page, index) in sortedPages"
                        :key="index"
                        @click="
                          () => {
                            if (
                              selectedPageIndex !== null &&
                              selectedPageIndex === index
                            ) {
                              showEditImageProperties();
                            } else {
                              selectedPageIndex = index;
                            }
                          }
                        "
                        :active="
                          selectedPage !== null &&
                          selectedPage.name === page.name
                        "
                        active-class="bg-grey-4"
                        class="q-py-sm"
                        clickable
                        v-ripple
                      >
                        <q-item-section>{{ page.name }}</q-item-section>
                      </q-item>
                      <q-form @submit.prevent="acceptOrRejectDocument">
                        <q-btn
                          @click="doc.updatedStatus = 'admin-checked'"
                          label="Accept"
                          color="positive"
                          class="full-width q-mt-sm"
                          :outline="doc.updatedStatus !== 'admin-checked'"
                        />
                        <q-btn
                          @click="doc.updatedStatus = 'rejected'"
                          label="Reject"
                          color="negative"
                          class="full-width q-mt-sm"
                          :outline="doc.updatedStatus !== 'rejected'"
                        />
                        <q-slide-transition>
                          <div
                            v-if="doc.updatedStatus === 'rejected'"
                            class="row q-gutter-sm q-mt-md"
                          >
                            <div class="text-body1 text-grey-8 col-12">
                              Is this the wrong doc?
                            </div>
                            <q-btn
                              @click="
                                () => {
                                  doc.updatedRejection.reasons = [
                                    {
                                      label: 'Wrong document',
                                      value: 'wrong-document',
                                    },
                                  ];
                                  doc.isWrongDoc = true;
                                }
                              "
                              class="col"
                              label="Yes"
                              color="primary"
                              :outline="doc.isWrongDoc !== true"
                            />
                            <q-btn
                              @click="
                                () => {
                                  doc.updatedRejection.reasons = [];
                                  doc.isWrongDoc = false;
                                }
                              "
                              class="col"
                              label="No"
                              color="primary"
                              :outline="doc.isWrongDoc !== false"
                            />
                            <q-slide-transition>
                              <div
                                v-if="doc.isWrongDoc === false"
                                class="col-12 row"
                              >
                                <q-select
                                  class="col-12 q-mt-sm"
                                  filled
                                  v-model="doc.updatedRejection.reasons"
                                  multiple
                                  :options="rejectionOptions"
                                  use-chips
                                  stack-label
                                  label="Select all that apply"
                                  :rules="[
                                    (val) =>
                                      val.length > 0 ||
                                      'Please add at least one reason',
                                  ]"
                                />
                                <q-input
                                  autogrow
                                  v-model="doc.updatedRejection.message"
                                  :rules="[
                                    (val) =>
                                      !!val ||
                                      !doc.updatedRejection.reasons.some(
                                        (reason) => reason.value === 'other'
                                      ) ||
                                      'Please add a comment',
                                  ]"
                                  filled
                                  label="Comment (optional)"
                                  class="col-12"
                                />
                              </div>
                            </q-slide-transition>
                          </div>
                        </q-slide-transition>
                        <q-btn
                          type="submit"
                          :loading="checkDocumentLoading"
                          label="Done"
                          color="primary"
                          class="full-width q-mt-sm"
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
                            {{ warningMessage }}
                          </div>
                        </div>
                      </q-form>
                    </q-list>
                  </q-slide-transition>
                </q-item-section>
              </q-item>
              <q-separator />
            </q-list>
          </div>
          <AdminEditName
            v-if="isEditingName"
            :selected-applicant="selectedApplicant"
            @exitUpdateName="hideEditName"
          />
          <AdminEditImageProperties
            v-if="isEditingImageProperties"
            :selected-page="selectedPage"
            @exitUpdateImageProperties="hideEditImageProperties"
          />
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
        :pages="sortedPages"
        :selected-page-index="selectedPageIndex"
        :selected-doc="selectedDoc"
        :selected-applicant="selectedApplicant"
      />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
// import * as amplitude from '@amplitude/analytics-browser';
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import { dbColRefs, dbDocRefs } from 'src/utils/db';
import {
  onSnapshot,
  orderBy,
  query,
  Unsubscribe,
  updateDoc,
  where,
  serverTimestamp,
} from '@firebase/firestore';
import { Form } from 'src/utils/types';
import { QStepper } from 'quasar';
import { FullMetadata, getDownloadURL, getMetadata } from '@firebase/storage';
import { storageRefs } from 'src/utils/storage';
import {
  ApplicantDocument,
  ApplicantPage,
  RejectionReasons,
} from 'src/utils/new-types';
import AdminEditName from 'src/components/admin/AdminEditName.vue';
import AdminEditImageProperties from 'src/components/admin/AdminEditImageProperties.vue';

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

onUnmounted(() => {
  unsubSortedPages.value?.();
  unsubSortedDocs.value?.();
  unsubApplicants.value?.();
});

const showWarningMessage = ref(false);
const warningMessage = ref('');
const isEditingName = ref(false);
const isEditingImageProperties = ref(false);

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
const step = ref(1);
const stepperRef = ref<QStepper | null>(null);
const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);
const checkDocumentLoading = ref(false);

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value;
};

const showEditName = () => {
  if (selectedApplicant.value && selectedApplicant.value.applicant.name) {
    isEditingName.value = true;
  }
};

const hideEditName = () => {
  isEditingName.value = false;
};

const showEditImageProperties = () => {
  if (selectedPage.value) {
    isEditingImageProperties.value = true;
  }
};

const hideEditImageProperties = () => {
  isEditingImageProperties.value = false;
};

const rejectionOptions = [
  {
    label: 'Blurry',
    value: 'blurry',
  },
  {
    label: 'Edges not visible',
    value: 'birth-certificate',
  },
  {
    label: 'Too dark',
    value: 'too-dark',
  },
  {
    label: 'Other',
    value: 'other',
  },
];

const sortedDocs = ref<
  (ApplicantDocument & {
    id: string;
    updatedStatus: 'admin-checked' | 'rejected' | '';
    updatedRejection: {
      reasons: {
        label: string;
        value: RejectionReasons;
      }[];
      rejectedBy: 'admin';
      message: string;
    };
    isWrongDoc: boolean | null;
  })[]
>([]);
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
    unsubSortedDocs.value = onSnapshot(q, (applicantDocsSnap) => {
      sortedDocs.value = applicantDocsSnap.docs.map((doc) => ({
        id: doc.id,
        updatedStatus: '',
        isWrongDoc: null,
        updatedRejection: {
          reasons: [],
          rejectedBy: 'admin',
          message: '',
        },
        ...doc.data(),
      }));
    });
  } else {
    clearSortedDocs();
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
const clearSortedDocs = () => {
  unsubSortedDocs.value?.();
  sortedDocs.value = [];
};

const sortedPages = ref<
  (ApplicantPage & {
    id: string;
    originalURL: string;
    fixedURL?: string;
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
    clearSortedPages();
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
const clearSortedPages = () => {
  unsubSortedPages.value?.();
  sortedPages.value = [];
};

// const sendAmplitudeAssessPageEvent = (status: string) => {
//   if (originalMetadata.value && fixedMetadata.value) {
//     const originalImageProperties = {
//       ...originalMetadata.value.customMetadata,
//     } as unknown as ImageProperties;
//     const fixedImageProperties = {
//       ...fixedMetadata.value.customMetadata,
//     } as unknown as ImageProperties;
//     amplitude.track('Admin Assess Page', {
//       decision: status,
//       originalBrightness: originalImageProperties.brightness,
//       originalSharpness: originalImageProperties.sharpness,
//       originalContrast: originalImageProperties.contrast,
//       fixedBrightness: fixedImageProperties.brightness,
//       fixedSharpness: fixedImageProperties.sharpness,
//       fixedContrast: fixedImageProperties.contrast,
//       docName: selectedDoc.value?.name,
//       docId: selectedDoc.value?.id,
//       pageNumber: selectedPage.value?.pageNumber,
//       pageId: selectedPage.value?.id,
//       totalNumberOfPages: sortedPages.value.length,
//     });
//   }
// };

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

const displayWarningMessage = (message: string) => {
  warningMessage.value = message;
  showWarningMessage.value = true;
  setTimeout(() => {
    clearWarningMessage();
  }, 5000);
};

const clearWarningMessage = () => {
  showWarningMessage.value = false;
  warningMessage.value = '';
};

const acceptOrRejectDocument = async () => {
  try {
    // Remove warning message if it is showing
    clearWarningMessage();

    checkDocumentLoading.value = true;
    if (!validateDecision()) return;
    if (selectedDoc.value && selectedDoc.value.updatedStatus) {
      const applicantDocRef = dbDocRefs.getDocumentRef(
        selectedDoc.value.companyId,
        selectedDoc.value.id
      );
      const updatedName = getUpdatedDocName();
      const updatedStatus = selectedDoc.value.updatedStatus;

      if (updatedStatus === 'admin-checked') {
        // Handle accept document
        await updateDoc(applicantDocRef, {
          status: 'admin-checked',
          updatedName,
        });
      }
      if (updatedStatus === 'rejected') {
        // Handle reject document
        const { reasons, rejectedBy, message } =
          selectedDoc.value.updatedRejection;
        const rejectionReasons = reasons.map((reason) => reason.value);
        await updateDoc(applicantDocRef, {
          status: 'rejected',
          rejection: {
            reasons: rejectionReasons,
            rejectedBy,
            message,
            rejectedAt: serverTimestamp(),
          },
        });
      }
    } else {
      throw new Error('No document selected');
    }
  } catch (error) {
    console.error(error);
  } finally {
    // kill loader and possibly remove selected page and document
    checkDocumentLoading.value = false;
  }
};

const validateDecision = () => {
  if (selectedDoc.value) {
    if (selectedDoc.value.updatedStatus === '') {
      // Handle no decision
      displayWarningMessage('Please either accept or reject document');
      return false;
    }
    if (
      selectedDoc.value.updatedStatus === 'rejected' &&
      selectedDoc.value.isWrongDoc === null
    ) {
      // Handle is wrong doc not selected
      displayWarningMessage('Please select if document is wrong');
      return false;
    }
    return true;
  }
  return false;
};

const getUpdatedDocName = () => {
  if (
    !selectedApplicant.value ||
    !selectedApplicant.value.applicant.name ||
    !selectedDoc.value
  )
    return;
  const name = selectedApplicant.value.applicant.name;
  Object.keys(name).forEach((key) => {
    const typedKey = key as keyof typeof name;
    name[typedKey] = fixName(name[typedKey]);
  });
  const { first, middle, last } = name;
  const updatedName = `${first}_${middle}_${last}`;
  const docName = selectedDoc.value.name.trim();
  return docName + '_' + updatedName + '.pdf';
};

const fixName = (name: string) => {
  // Remove all non-alphanumeric characters
  const fixedName = name
    .trim()
    .split(' ')
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join('_');
  return fixedName;
};
</script>
