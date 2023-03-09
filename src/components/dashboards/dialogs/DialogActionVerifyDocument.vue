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
          <q-item
            clickable
            v-ripple
            class="text-grey-8 q-mt-md download-border"
          >
            <q-item-section>
              <q-item-label class="text-subtitle1 text-weight-bold"
                >Download Page {{ slide }}</q-item-label
              >
            </q-item-section>
            <q-item-section avatar side>
              <q-icon name="fas fa-arrow-down" />
            </q-item-section>
          </q-item>
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
        </q-list>
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
            You missed some pages. Please review and accept or reject them.
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
import { QDialog, useDialogPluginComponent } from 'quasar';
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
  })[]
>([]);
// const pageStatusAndURL = ref<string[]>([]);
const unsubDocumentPages = ref<Unsubscribe | null>(null);
const showWarningMessage = ref(false);
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
  await onSubmit();
};

const onSubmit = async () => {
  for (let i = 0; i < documentPages.value.length; i++) {
    const page = documentPages.value[i];
    if (page.updatedStatus === 'not-checked') {
      slide.value = i + 1;
      showWarningMessage.value = true;
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 8000);
      });
      showWarningMessage.value = false;
      return;
    }
  }
  isLoading.value = true;
  let ACCEPTED_PAGES = 0;
  const promises: Promise<void>[] = [];
  for (const page of documentPages.value) {
    if (page.updatedStatus === 'accepted') {
      promises.push(updatePageStatus(page));
      promises.push(createAcceptedPageDoc(page));
      promises.push(addMetadataToImage(page, 'accepted'));
      ACCEPTED_PAGES++;
    } else if (page.updatedStatus === 'rejected') {
      // TODO: handle rejection
    }
  }
  await Promise.all(promises);
  await incrementAcceptedPages(ACCEPTED_PAGES);
  onDialogOK();
};

const updatePageStatus = async (page: ApplicantPage & { id: string }) => {
  console.log('accept page', documentPages.value[selectedPageIndex.value]);
  // update page status
  const pageRef = dbDocRefs.getPageRef(page.companyId, page.id);
  await updateDoc(pageRef, {
    status: 'accepted',
  });
};

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
    contentType: props.applicantDocument.requestedFormat,
    acceptedBy: user.id,
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

const incrementAcceptedPages = async (incrementNumber: number) => {
  const applicantDocRef = dbDocRefs.getDocumentRef(
    props.applicantDocument.companyId,
    props.applicantDocument.id
  );
  await updateDoc(applicantDocRef, {
    acceptedPages: increment(incrementNumber),
  });
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
