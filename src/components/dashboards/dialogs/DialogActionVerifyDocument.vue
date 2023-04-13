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
          <div class="text-h5 q-ml-auto" style="cursor: pointer">
            {{ updatedName }}
            <q-popup-edit
              ref="popUpEditRef"
              v-model="updatedName"
              auto-save
              v-slot="scope"
            >
              <q-input
                v-model="scope.value"
                class="text-h5"
                dense
                autofocus
                counter
                @keyup.enter="scope.set"
              />
            </q-popup-edit>
          </div>
          <q-btn
            @click="popUpEditRef?.show()"
            icon="fas fa-edit"
            label="Edit Name"
            outline
            color="primary"
            class="q-ml-md"
          />

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
        <q-form @submit="onSubmit">
          <q-list class="q-pa-md">
            <div class="text-h5 q-mb-md">
              Page {{ slide }} of {{ documentPages.length }}
            </div>
            <q-separator />
            <q-item
              @click="updatedStatus = 'accepted'"
              clickable
              v-ripple
              :class="
                updatedStatus === 'accepted'
                  ? 'bg-positive text-white'
                  : 'accept-border text-positive'
              "
            >
              <q-item-section>
                <q-item-label class="text-subtitle1 text-weight-bold"
                  >Accept</q-item-label
                >
              </q-item-section>
              <q-item-section avatar side>
                <q-icon name="fas fa-check" />
              </q-item-section>
            </q-item>
            <q-item
              @click="updatedStatus = 'rejected'"
              clickable
              v-ripple
              class="q-mt-md"
              :class="
                updatedStatus === 'rejected'
                  ? 'bg-negative text-white'
                  : 'reject-border text-negative'
              "
            >
              <q-item-section>
                <q-item-label class="text-subtitle1 text-weight-bold"
                  >Reject</q-item-label
                >
              </q-item-section>
              <q-item-section avatar side>
                <q-icon name="fas fa-times" />
              </q-item-section>
            </q-item>
            <q-slide-transition>
              <div
                class="row q-gutter-sm q-mt-md"
                v-if="updatedStatus === 'rejected'"
              >
                <div class="text-body1 col-12">Is this the wrong document?</div>
                <q-btn
                  @click="isWrongDoc = true"
                  class="col"
                  color="primary"
                  label="Yes"
                  :outline="isWrongDoc !== true"
                />
                <q-btn
                  @click="isWrongDoc = false"
                  class="col"
                  color="primary"
                  label="No"
                  :outline="isWrongDoc !== false"
                />
              </div>
            </q-slide-transition>
            <q-slide-transition>
              <q-list
                separator
                class="q-mt-md"
                v-if="updatedStatus === 'rejected' && isWrongDoc === false"
              >
                <div class="text-body1">
                  Whats wrong with this document? (Select all that apply)
                </div>
                <q-item
                  class="q-py-sm"
                  clickable
                  @click="value.value = !value.value"
                  v-for="(value, key) in rejections"
                  :key="key"
                >
                  <q-item-section side top>
                    <q-checkbox v-model="value.value" />
                  </q-item-section>
                  <q-item-section>{{ value.label }}</q-item-section>
                </q-item>
                <q-input
                  class="q-mt-sm"
                  v-model="message"
                  :label="`Add message ${
                    rejections['other'].value === true ? '' : '(Optional)'
                  }`"
                  outlined
                  autogrow
                />
              </q-list>
            </q-slide-transition>
            <q-separator />
            <q-btn
              type="submit"
              color="primary"
              label="Done"
              :loading="isLoading"
              class="full-width q-mt-lg"
            />
          </q-list>
        </q-form>
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
                v-if="documentPages.length > 0"
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
import { QDialog, QInput, QPopupEdit, useDialogPluginComponent } from 'quasar';
import { ref, onMounted, onUnmounted } from 'vue';
import {
  ApplicantDocument,
  ApplicantPage,
  RejectionReasons,
} from 'src/utils/new-types';
import { dbColRefs, dbDocRefs } from 'src/utils/db';
import {
  onSnapshot,
  query,
  where,
  orderBy,
  Unsubscribe,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getDownloadURL } from '@firebase/storage';
import { storageRefs } from 'src/utils/storage';
import { useUserStore } from 'src/stores/user-store';

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const { user } = useUserStore();
const drawerRight = ref(true);
const updatedName = ref('');
const popUpEditRef = ref<null | QPopupEdit>(null);
const slide = ref(1);
// const selectedPageIndex = computed(() => slide.value - 1);
// const showOptions = ref(false);
const documentPages = ref<
  (ApplicantPage & {
    id: string;
    url: string;
    updatedStatus: 'not-checked' | 'accepted' | 'rejected';
    otherReason: string;
    message?: string;
  })[]
>([]);
// const pageStatusAndURL = ref<string[]>([]);
const unsubDocumentPages = ref<Unsubscribe | null>(null);

const updatedStatus = ref<'accepted' | 'rejected' | ''>('');
const isWrongDoc = ref<null | boolean>(null);
const rejections = ref({
  'edges-not-visible': { label: 'Edges not visible', value: false },
  blurry: { label: 'Blurry', value: false },
  'too-dark': { label: 'Too dark', value: false },
  other: { label: 'Other', value: false },
});
const message = ref('');
const timeout = ref<ReturnType<typeof setTimeout> | null>(null);

const showWarningMessage = ref(false);
const warningMessage = ref('');
const isLoading = ref(false);

const props = defineProps<{
  applicantDocument: ApplicantDocument & { id: string };
}>();

onMounted(async () => {
  const pagesRef = dbColRefs.getPagesRef(props.applicantDocument.companyId);
  updatedName.value = props.applicantDocument.updatedName
    ? props.applicantDocument.updatedName
    : props.applicantDocument.name;
  const q = query(
    pagesRef,
    where('docId', '==', props.applicantDocument.id),
    where('submissionCount', '==', props.applicantDocument.submissionCount),
    orderBy('pageNumber', 'asc')
  );
  await new Promise<void>((resolve, reject) => {
    let runOnce = () => {
      runOnce = () => {
        return;
      };
      console.log('resolved');
      resolve();
    };
    unsubDocumentPages.value = onSnapshot(
      q,
      async (snapshot) => {
        documentPages.value = await Promise.all(
          snapshot.docs.map(async (doc) => {
            console.log('starting in map functions');
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
        console.log(err);
        reject(err);
      }
    );
  });
});

onUnmounted(() => {
  unsubDocumentPages.value?.();
});

const setWarningMessage = (warningKey: keyof typeof warningMessages) => {
  warningMessage.value = warningMessages[warningKey];
  showWarningMessage.value = true;

  timeout.value = setTimeout(() => {
    clearWarningMessage();
  }, 8000);
  return false;
};
const clearWarningMessage = () => {
  showWarningMessage.value = false;
  warningMessage.value = '';
  if (timeout.value) {
    clearTimeout(timeout.value);
  }
  timeout.value = null;
};

const validateFields = () => {
  clearWarningMessage(); // Clear any previous warning messages
  if (updatedStatus.value === '') {
    setWarningMessage('no-status-decision');
    return false;
  }

  if (updatedStatus.value === 'rejected') {
    if (isWrongDoc.value === null) {
      setWarningMessage('no-wrong-doc-decision');
      return false;
    }

    if (isWrongDoc.value === false) {
      const hasRejectionReason = Object.values(rejections.value).some(
        (val) => val.value === true
      );
      console.log(hasRejectionReason);
      if (!hasRejectionReason) {
        setWarningMessage('no-rejection-reason');
        return false;
      }

      // If other reason is selected, message is required
      if (rejections.value['other'].value && !message.value) {
        setWarningMessage('no-other-reason');
        return false;
      }
    }
  }

  return true;
};

const onSubmit = async () => {
  if (!validateFields()) return;
  isLoading.value = true;
  const docRef = dbDocRefs.getDocumentRef(
    props.applicantDocument.companyId,
    props.applicantDocument.id
  );
  if (updatedStatus.value === 'accepted') {
    // Handle Accept
    await updateDoc(docRef, {
      status: 'accepted',
      isUpdating: true,
    });
  }
  if (updatedStatus.value === 'rejected') {
    let rejectionReasons: RejectionReasons[] = [];
    if (isWrongDoc.value) {
      rejectionReasons = ['wrong-document'];
    } else {
      rejectionReasons = Object.keys(rejections.value).filter(
        (key) => rejections.value[key as keyof typeof rejections.value].value
      ) as RejectionReasons[];
    }
    await updateDoc(docRef, {
      status: 'rejected',
      rejection: {
        rejectedAt: serverTimestamp(),
        reasons: rejectionReasons,
        rejectedBy: user?.id,
        message: message.value,
      },
      isUpdating: true,
    });
  }
  isLoading.value = false;
  onDialogOK();
};

// const createAcceptedDoc = async (page: ApplicantPage & { id: string }) => {
//   if (!user) return;
//   const acceptedPagesRef = dbColRefs.acceptedPagesRef;
//   await addDoc(acceptedPagesRef, {
//     createdAt: serverTimestamp() as Timestamp,
//     companyId: page.companyId,
//     dashboardId: page.dashboardId,
//     applicantId: page.applicantId,
//     formId: page.formId,
//     docId: page.docId,
//     docName: props.applicantDocument.name,
//     pageId: page.id,
//     name: page.name,
//     contentType: props.applicantDocument.requestedFormat,
//     acceptedBy: user.id,
//   });
// };

// const createRejectedDoc = async (
//   page: ApplicantPage & { id: string },
//   reason: RejectionReason,
//   otherReason?: string
// ) => {
//   if (!user) return;
//   const rejectedPagesRef = dbColRefs.rejectedPagesRef;
//   await addDoc(rejectedPagesRef, {
//     createdAt: serverTimestamp() as Timestamp,
//     companyId: page.companyId,
//     dashboardId: page.dashboardId,
//     applicantId: page.applicantId,
//     formId: page.formId,
//     docId: page.docId,
//     docName: props.applicantDocument.name,
//     pageId: page.id,
//     name: page.name,
//     contentType: props.applicantDocument.requestedFormat,
//     rejectedBy: user.id,
//     reasonForRejection: reason,
//     otherReason,
//   });
// };

const warningMessages = {
  'no-status-decision': 'Please select if the document is accepted or rejected',
  'no-wrong-doc-decision': 'Please select if the document is wrong or not',
  'no-rejection-reason': 'Please select at least one reason for rejection',
  'no-other-reason': "Please add a message for the 'other' reason",
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
