<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" maximized persistent>
    <q-layout view="hHr lpR fFf" container>
      <q-header class="bg-white text-grey-8" bordered>
        <q-toolbar class="q-py-sm">
          <q-btn
            v-close-popup
            size="lg"
            icon="fas fa-arrow-left"
            color="primary"
            flat
            dense
            class="q-ml-sm"
          />
          <div class="text-h4 q-ml-auto">{{ applicantDocument.name }}</div>

          <q-btn
            size="lg"
            class="q-ml-auto"
            dense
            flat
            round
            icon="menu"
            @click="drawerRight = !drawerRight"
          />
        </q-toolbar>
      </q-header>

      <q-drawer show-if-above v-model="drawerRight" side="right" bordered>
        <q-list class="q-pa-md" v-if="documentPages.length > 0 && !isLoading">
          <div class="text-h5 q-mb-md">
            Page {{ slide }} of {{ documentPages.length }}
          </div>
          <q-separator />
          <q-item
            @click="documentPages[selectedPageIndex].updatedStatus = 'accepted'"
            clickable
            v-ripple
            :class="
              documentPages[selectedPageIndex].updatedStatus === 'accepted'
                ? 'bg-positive text-white'
                : 'accept-border text-positive'
            "
          >
            <q-item-section>
              <q-item-label class="text-subtitle1 text-weight-bold"
                >Accept Page {{ slide }}</q-item-label
              >
            </q-item-section>
            <q-item-section avatar side>
              <q-icon name="fas fa-check" />
            </q-item-section>
          </q-item>
          <q-item
            @click="documentPages[selectedPageIndex].updatedStatus = 'rejected'"
            clickable
            v-ripple
            class="q-mt-md"
            :class="
              documentPages[selectedPageIndex].updatedStatus === 'rejected'
                ? 'bg-negative text-white'
                : 'reject-border text-negative'
            "
          >
            <q-item-section>
              <q-item-label class="text-subtitle1 text-weight-bold"
                >Reject Page {{ slide }}</q-item-label
              >
            </q-item-section>
            <q-item-section avatar side>
              <q-icon name="fas fa-times" />
            </q-item-section>
          </q-item>
          <q-slide-transition>
            <q-list
              separator
              class="q-mt-md"
              v-show="
                documentPages[selectedPageIndex].updatedStatus === 'rejected'
              "
            >
              <div class="text-body1">Select One</div>
              <q-separator class="q-mt-sm" />
              <q-item
                clickable
                @click="
                  documentPages[selectedPageIndex].rejectionReason = 'wrong-doc'
                "
                :class="
                  documentPages[selectedPageIndex].rejectionReason ===
                  'wrong-doc'
                    ? 'text-white bg-primary'
                    : 'text-primary'
                "
              >
                <q-item-section class="text-body1">
                  Wrong Document
                </q-item-section>
              </q-item>
              <q-item
                clickable
                @click="
                  documentPages[selectedPageIndex].rejectionReason =
                    'image-quality'
                "
                :class="
                  documentPages[selectedPageIndex].rejectionReason ===
                  'image-quality'
                    ? 'text-white bg-primary'
                    : 'text-primary'
                "
              >
                <q-item-section class="text-body1">
                  Poor Image Quality
                </q-item-section>
              </q-item>
              <q-item
                clickable
                @click="
                  documentPages[selectedPageIndex].rejectionReason = 'other'
                "
                :class="
                  documentPages[selectedPageIndex].rejectionReason === 'other'
                    ? 'text-white bg-primary'
                    : 'text-primary'
                "
              >
                <q-item-section class="text-body1"> Other </q-item-section>
              </q-item>
              <q-separator />
              <q-slide-transition>
                <q-input
                  ref="otherReasonInput"
                  class="q-mt-sm"
                  autofocus
                  autogrow
                  v-if="
                    documentPages[selectedPageIndex].rejectionReason === 'other'
                  "
                  v-model="documentPages[selectedPageIndex].otherReason"
                  label="Please explain..."
                />
              </q-slide-transition>
            </q-list>
          </q-slide-transition>
          <q-item
            @click="showOptions = !showOptions"
            clickable
            v-ripple
            class="q-mt-md"
          >
            <q-item-section>
              <q-item-label class="text-subtitle1 text-grey-8 text-weight-bold"
                >More Options</q-item-label
              >
            </q-item-section>
            <q-item-section avatar side>
              <q-icon
                :name="`fas fa-chevron-${showOptions ? 'up' : 'down'}`"
                color="grey-8"
              />
            </q-item-section>
          </q-item>
          <q-separator />
          <q-slide-transition>
            <q-list
              v-show="showOptions"
              class="q-pa-md"
              style="padding-top: 0 !important"
              separator
            >
              <q-item
                @click="onAcceptAll"
                class="text-subtitle1 text-weight-bold text-positive"
                clickable
                v-ripple
              >
                <q-item-section>
                  <q-item-label> Accept All </q-item-label>
                </q-item-section>
                <q-item-section avatar side>
                  <q-icon name="fas fa-check-double" />
                </q-item-section>
              </q-item>
              <q-item
                class="text-subtitle1 text-weight-bold text-negative"
                clickable
                v-ripple
              >
                <q-item-section>
                  <q-item-label> Reject All </q-item-label>
                </q-item-section>
                <q-item-section avatar side>
                  <q-icon name="fas fa-times" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-slide-transition>
          <q-btn
            @click="onSubmit"
            color="primary"
            label="Done"
            class="full-width q-mt-xl"
          />
        </q-list>
        <div
          class="text-body1 q-mt-md text-negative q-px-sm"
          v-if="showWarningMessage"
        >
          <div class="q-mt-md text-center">
            <q-icon size="lg" name="fas fa-exclamation-triangle" />
          </div>
          <div class="q-mt-md text-center">
            <span>Warning!</span>
          </div>
          <div class="q-mt-md text-center">
            {{ warningMessage }}
          </div>
        </div>
      </q-drawer>

      <q-page-container>
        <q-page class="bg-white">
          <div
            class="bg-white full-width"
            style="position: absolute; top: 0; bottom: 0"
          >
            <q-btn
              v-if="slide > 1"
              @click="slide--"
              outline
              round
              class="nav-left"
              color="primary"
              icon="fas fa-chevron-left"
              size="lg"
            />
            <q-btn
              v-if="slide < documentPages.length"
              @click="slide++"
              outline
              round
              class="nav-right"
              color="primary"
              icon="fas fa-chevron-right"
              size="lg"
            />
            <div
              class="q-pa-md flex justify-center"
              style="max-height: 100%; overflow: auto !important"
            >
              <q-carousel
                v-if="documentPages.length > 0 && !isLoading"
                style="height: 100%; width: 80%"
                animated
                v-model="slide"
                control-color="primary"
                transition-prev="slide-right"
                transition-next="slide-left"
              >
                <q-carousel-slide
                  :name="index + 1"
                  class="column no-wrap flex-center"
                  v-for="(page, index) in documentPages"
                  :key="index"
                >
                  <q-img
                    v-if="applicantDocument.requestedFormat === 'jpeg'"
                    :src="documentPages[index].url"
                  />
                  <embed
                    v-else
                    :src="documentPages[index].url"
                    type="application/pdf"
                    style="width: 100%; height: 85vh"
                  />
                </q-carousel-slide>
              </q-carousel>
              <q-spinner-pie
                class="absolute-center"
                color="primary"
                v-else
                size="100px"
              />
            </div>
          </div>
        </q-page>
      </q-page-container>
    </q-layout>
  </q-dialog>
</template>

<script setup lang="ts">
import { QDialog, QInput, useDialogPluginComponent } from 'quasar';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ApplicantDocument, ApplicantPage } from 'src/utils/new-types';
import { dbColRefs, dbDocRefs } from 'src/utils/db';
import {
  onSnapshot,
  query,
  where,
  orderBy,
  Unsubscribe,
  updateDoc,
  increment,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getDownloadURL, updateMetadata } from '@firebase/storage';
import { storageRefs } from 'src/utils/storage';
import { useUserStore } from 'src/stores/user-store';
import { RejectionReason } from 'src/utils/types';

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const { user } = useUserStore();
const drawerRight = ref(true);
const slide = ref(1);
const selectedPageIndex = computed(() => slide.value - 1);
const showOptions = ref(false);
const documentPages = ref<
  (ApplicantPage & {
    id: string;
    url: string;
    updatedStatus: 'not-checked' | 'accepted' | 'rejected';
    rejectionReason: 'wrong-doc' | 'image-quality' | 'other' | null;
    otherReason: string;
    message?: string;
  })[]
>([]);
// const pageStatusAndURL = ref<string[]>([]);
const unsubDocumentPages = ref<Unsubscribe | null>(null);
const showWarningMessage = ref(false);
const warningMessage = ref('');
const otherReasonInput = ref<QInput | null>(null);
const isLoading = ref(false);

const props = defineProps<{
  applicantDocument: ApplicantDocument & { id: string };
}>();

onMounted(async () => {
  console.log(props.applicantDocument.companyId);
  const pagesRef = dbColRefs.getPagesRef(props.applicantDocument.companyId);
  const q = query(
    pagesRef,
    where('docId', '==', props.applicantDocument.id),
    where('status', '==', 'admin-checked'),
    orderBy('pageNumber', 'asc')
  );
  await new Promise<void>((resolve, reject) => {
    let runOnce = () => {
      runOnce = () => {
        return;
      };
      resolve();
    };
    unsubDocumentPages.value = onSnapshot(
      q,
      async (snapshot) => {
        documentPages.value = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const {
              name,
              companyId,
              dashboardId,
              applicantId,
              submittedFormat,
            } = doc.data();
            const requestedFormat = props.applicantDocument.requestedFormat;
            let url = '';
            if (submittedFormat === 'application/pdf') {
              const storageRef = storageRefs.getOriginalDocRef(
                companyId,
                dashboardId,
                applicantId,
                `${name}.${requestedFormat}`
              );
              url = await getDownloadURL(storageRef);
            } else {
              const storageRef = storageRefs.getFixedDocRef(
                companyId,
                dashboardId,
                applicantId,
                `${name}.${requestedFormat}`
              );
              url = await getDownloadURL(storageRef);
            }
            return {
              id: doc.id,
              url,
              updatedStatus: 'not-checked',
              rejectionReason: null,
              otherReason: '',
              ...doc.data(),
            };
          })
        );
        runOnce();
      },
      (err) => {
        reject(err);
      }
    );
  });
});

onUnmounted(() => {
  unsubDocumentPages.value?.();
});

const onAcceptAll = async () => {
  for (const page of documentPages.value) {
    page.updatedStatus = 'accepted';
  }
};

const onSubmit = async () => {
  if (!validateFields()) return;
  isLoading.value = true;
  const promises: Promise<void>[] = [];
  let rejectedPages = 0;
  let acceptedPages = 0;
  let isRejected = false;
  const rejectionReasons: RejectionReason[] = [];
  const rejectedPageIds: string[] = [];
  // Update image status and create accepted/rejected pages
  documentPages.value.forEach((page) => {
    if (page.updatedStatus === 'rejected') {
      // Reject Page
      isRejected = true;
      const rejectionReason = page.rejectionReason as RejectionReason;
      if (!rejectionReasons.includes(rejectionReason)) {
        rejectionReasons.push(rejectionReason);
      }
      rejectedPageIds.push(page.id);
      rejectedPages++;
      const pageRef = dbDocRefs.getPageRef(page.companyId, page.id);
      const rejection = {
        reason: rejectionReason,
        other: page.otherReason,
      };
      promises.push(
        updateDoc(pageRef, {
          status: 'rejected',
          rejection,
        })
      );
      // Create Rejection Page Doc
      promises.push(
        createRejectedPageDoc(page, rejectionReason, page.otherReason)
      );
    }
    if (page.updatedStatus === 'accepted') {
      // Accept Page
      acceptedPages++;
      const pageRef = dbDocRefs.getPageRef(page.companyId, page.id);
      promises.push(
        updateDoc(pageRef, {
          status: 'accepted',
        })
      );
      // Create Accepted Page Doc
      promises.push(createAcceptedPageDoc(page));
    }
    // Update Image Metadata
    promises.push(
      addMetadataToImage(page, page.updatedStatus as 'accepted' | 'rejected')
    );
  });

  // Update document status
  const DECREMENT_REJECTED_PAGES = increment(rejectedPages * -1);
  const INCREMENT_ACCEPTED_PAGES = increment(acceptedPages);
  const INCREMENT = increment(1);
  const DECREMENT = increment(-1);
  const docRef = dbDocRefs.getDocumentRef(
    props.applicantDocument.companyId,
    props.applicantDocument.id
  );
  const applicantRef = dbDocRefs.getApplicantRef(
    props.applicantDocument.companyId,
    props.applicantDocument.dashboardId,
    props.applicantDocument.applicantId
  );

  if (!isRejected) {
    // Accept Document
    const promise = updateDoc(docRef, {
      acceptedPages: INCREMENT_ACCEPTED_PAGES,
    });
    promises.push(promise);
  }

  if (
    isRejected &&
    (acceptedPages > 0 ||
      documentPages.value.length < props.applicantDocument.totalPages)
  ) {
    // Resubmit Pages
    const promise = updateDoc(docRef, {
      acceptedPages: INCREMENT_ACCEPTED_PAGES,
      adminAcceptedPages: DECREMENT_REJECTED_PAGES,
      status: 'rejected',
      rejection: {
        rejectedAt: serverTimestamp(),
        type: 'pages',
        pageIds: rejectedPageIds,
        reasons: rejectionReasons,
        rejectedBy: user?.id,
      },
    });
    promises.push(promise);
    // Update Applicant Accepted Doc Count
    promises.push(
      updateDoc(applicantRef, {
        adminAcceptedDocs: DECREMENT,
      })
    );
  }

  if (
    isRejected &&
    acceptedPages === 0 &&
    documentPages.value.length === props.applicantDocument.totalPages
  ) {
    // Resubmit Full Document
    promises.push(
      updateDoc(docRef, {
        status: 'rejected',
        adminAcceptedPages: DECREMENT_REJECTED_PAGES,
        rejection: {
          rejectedAt: serverTimestamp(),
          type: 'full-submission',
          reasons: rejectionReasons,
          rejectedBy: 'admin',
        },
      })
    );
    // Update Applicant Accepted Doc Count
    promises.push(
      updateDoc(applicantRef, {
        adminAcceptedDocs: DECREMENT,
      })
    );
  }

  await Promise.all(promises);
  isLoading.value = false;
  onDialogOK();
};

const validateFields = () => {
  for (let i = 0; i < documentPages.value.length; i++) {
    const page = documentPages.value[i];
    if (page.updatedStatus === 'not-checked') {
      slide.value = i + 1;
      warningMessage.value = warningMessages['notChecked'];
      showWarningMessage.value = true;

      const timeout = setTimeout(() => {
        warningMessage.value = '';
        showWarningMessage.value = false;
        clearTimeout(timeout);
      }, 8000);
      return false;
    }
    if (page.updatedStatus === 'rejected') {
      if (page.rejectionReason === null) {
        slide.value = i + 1;
        showWarningMessage.value = true;
        warningMessage.value = warningMessages['noRejectionReason'];

        const timeout = setTimeout(() => {
          warningMessage.value = '';
          showWarningMessage.value = false;
          clearTimeout(timeout);
        }, 8000);

        return false;
      }
      if (page.rejectionReason === 'other' && page.otherReason === '') {
        slide.value = i + 1;
        warningMessage.value = warningMessages['noOtherReason'];
        showWarningMessage.value = true;
        otherReasonInput.value?.focus();

        const timeout = setTimeout(() => {
          warningMessage.value = '';
          showWarningMessage.value = false;
          clearTimeout(timeout);
        }, 8000);

        return false;
      }
    }
  }
  return true;
};

// const updatePageStatus = async (page: ApplicantPage & { id: string }) => {
//   console.log('accept page', documentPages.value[selectedPageIndex.value]);
//   // update page status
//   const pageRef = dbDocRefs.getPageRef(page.companyId, page.id);
//   await updateDoc(pageRef, {
//     status: 'accepted',
//   });
// };

const createAcceptedPageDoc = async (page: ApplicantPage & { id: string }) => {
  if (!user) return;
  const acceptedPagesRef = dbColRefs.acceptedPagesRef;
  await addDoc(acceptedPagesRef, {
    createdAt: serverTimestamp() as Timestamp,
    companyId: page.companyId,
    dashboardId: page.dashboardId,
    applicantId: page.applicantId,
    formId: page.formId,
    docId: page.docId,
    docName: props.applicantDocument.name,
    pageId: page.id,
    name: page.name,
    contentType: props.applicantDocument.requestedFormat,
    acceptedBy: user.id,
  });
};

const createRejectedPageDoc = async (
  page: ApplicantPage & { id: string },
  reason: RejectionReason,
  otherReason?: string
) => {
  if (!user) return;
  const rejectedPagesRef = dbColRefs.rejectedPagesRef;
  await addDoc(rejectedPagesRef, {
    createdAt: serverTimestamp() as Timestamp,
    companyId: page.companyId,
    dashboardId: page.dashboardId,
    applicantId: page.applicantId,
    formId: page.formId,
    docId: page.docId,
    docName: props.applicantDocument.name,
    pageId: page.id,
    name: page.name,
    contentType: props.applicantDocument.requestedFormat,
    rejectedBy: user.id,
    reasonForRejection: reason,
    otherReason,
  });
};

const addMetadataToImage = async (
  page: ApplicantPage & { id: string },
  status: 'accepted' | 'rejected'
) => {
  const FILE_SUFFIX = props.applicantDocument.requestedFormat;
  const imageRef = storageRefs.getFixedDocRef(
    page.companyId,
    page.dashboardId,
    page.applicantId,
    `${page.name}.${FILE_SUFFIX}`
  );
  await updateMetadata(imageRef, {
    customMetadata: {
      status,
      companyId: page.companyId,
      dashboardId: page.dashboardId,
      applicantId: page.applicantId,
    },
  });
};

// const incrementAcceptedPages = async (incrementNumber: number) => {
//   const applicantDocRef = dbDocRefs.getDocumentRef(
//     props.applicantDocument.companyId,
//     props.applicantDocument.id
//   );
//   await updateDoc(applicantDocRef, {
//     acceptedPages: increment(incrementNumber),
//   });
// };

const warningMessages = {
  notChecked: 'You missed some pages. Please review and accept or reject them.',
  noRejectionReason: 'Please specify the reason for rejection',
  noOtherReason: 'Please explain the reason for rejection',
};

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);
</script>

<style lang="sass" scoped>
.nav-left
  position: absolute
  top: calc(50% - 25.7px)
  left: 44px
.nav-right
  position: absolute
  top: calc(50% - 25.7px)
  right: 60px

.download-border
  border: 1px solid $grey-8
.reject-border
  border: 1px solid $negative
.accept-border
  border: 1px solid $positive
</style>
