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
          <div v-if="applicantDocument" class="text-h5 q-ml-auto">
            {{
              applicantDocument.updatedName
                ? applicantDocument.updatedName
                : applicantDocument.name
            }}
          </div>

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
        <q-list class="q-pa-md" v-if="!showReorderPages">
          <div class="text-h5 q-mb-md">
            Page {{ slide }} of {{ documentPages.length }}
          </div>
          <q-separator />
          <q-item
            :href="finalDocumentURL"
            clickable
            v-ripple
            class="download-border text-primary"
          >
            <q-item-section>
              <q-item-label class="text-subtitle1 text-weight-bold"
                >Download ({{ documentPages.length }} pages)</q-item-label
              >
            </q-item-section>
            <q-item-section avatar side>
              <q-icon name="fas fa-arrow-down" />
            </q-item-section>
            <q-inner-loading :showing="applicantDocument?.restitchDocument" />
          </q-item>
          <q-separator />
          <q-item
            @click="addReorderPageImages"
            clickable
            v-ripple
            class="download-border text-grey-8 q-mt-sm"
          >
            <q-item-section>
              <q-item-label class="text-subtitle1 text-weight-bold"
                >Reorder Pages (Beta)</q-item-label
              >
            </q-item-section>
            <q-item-section avatar side>
              <q-icon name="fas fa-reorder" />
            </q-item-section>
            <q-inner-loading :showing="openingReorder" />
          </q-item>
        </q-list>
        <div class="q-ma-md" v-else>
          <div class="text-h5 q-mb-md">Reordering Pages</div>
          <q-btn
            :loading="isReorderingPages"
            @click="reorderPages"
            label="Done"
            size="lg"
            class="q-mx-md full-width"
            color="primary"
          />
          <q-btn
            @click="clearReorderingPages"
            label="Cancel"
            size="lg"
            class="q-mx-md q-mt-sm full-width"
            color="primary"
            outline
          />
        </div>
      </q-drawer>

      <q-page-container>
        <q-page class="bg-white">
          <div v-if="!showReorderPages" class="bg-white full-width">
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
                v-if="
                  applicantDocument && documentPages.length > 0 && !isLoading
                "
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
          <!-- Reorder Documents UI -->
          <div class="bg-white full-width q-mt-md" v-else>
            <div>
              <draggable
                class="row q-col-gutter-md q-px-md q-pt-md"
                v-bind="dragOptions"
                v-model="reorderPageImages"
                item-key="id"
                @start="dragStart"
                @end="dragEnd"
              >
                <template #item="{ element, index }">
                  <div
                    @click="selectedDragItemIndex = index"
                    class="col-3"
                    :class="
                      selectedDragItemIndex === index || element.isDragging
                        ? 'chosen'
                        : ''
                    "
                  >
                    <q-img
                      :src="element.src"
                      :style="{
                        boxShadow: `rgba(0, 0, 0, 0.35) 0px 5px 15px`,
                      }"
                    />
                    <div class="full-width flex" v-if="!element.isDragging">
                      <q-avatar class="q-mx-auto" text-color="grey-8">{{
                        index + 1
                      }}</q-avatar>
                    </div>
                  </div>
                </template>
              </draggable>
            </div>
          </div>
        </q-page>
      </q-page-container>
    </q-layout>
  </q-dialog>
</template>

<script setup lang="ts">
import { QDialog, useDialogPluginComponent } from 'quasar';
import { ref, onMounted, onUnmounted } from 'vue';
import { ApplicantDocument, ApplicantPage } from 'src/utils/new-types';
import { dbColRefs, dbDocRefs } from 'src/utils/db';
import {
  onSnapshot,
  query,
  where,
  orderBy,
  Unsubscribe,
  updateDoc,
} from 'firebase/firestore';
import { getDownloadURL } from '@firebase/storage';
import { storageRefs } from 'src/utils/storage';
import draggable from 'vuedraggable';
import * as PDFJS from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.entry';

PDFJS.GlobalWorkerOptions.workerSrc = workerSrc;

const { dialogRef, onDialogHide } = useDialogPluginComponent();
const drawerRight = ref(true);
const slide = ref(1);
const applicantDocument = ref<(ApplicantDocument & { id: string }) | null>(
  null
);
const unsubApplicantDocument = ref<Unsubscribe | null>(null);
const documentPages = ref<
  (ApplicantPage & {
    id: string;
    url: string;
  })[]
>([]);
const unsubDocumentPages = ref<Unsubscribe | null>(null);
const finalDocumentURL = ref('');
const showReorderPages = ref(false);
const reorderPageImages = ref<
  {
    src: string;
    isDragging: boolean;
    pageId: string;
  }[]
>([]);
const selectedDragItemIndex = ref<number | null>(null);
const openingReorder = ref(false);
const isLoading = ref(false);
const isReorderingPages = ref(false);

const props = defineProps<{
  docId: string;
  companyId: string;
}>();

const dragOptions = {
  animation: 250,
  group: 'people',
  disabled: false,
  ghostClass: 'ghost',
  dragClass: 'drag',
  chosenClass: 'chosen',
};

onMounted(async () => {
  try {
    const { companyId, docId } = props;
    // Get document
    const docRef = dbDocRefs.getDocumentRef(companyId, docId);
    await new Promise<void>((resolve, reject) => {
      let resolveOnce = () => {
        resolveOnce = () => {
          return;
        };
        resolve();
      };
      unsubApplicantDocument.value = onSnapshot(
        docRef,
        async (docSnap) => {
          const docData = docSnap.data();
          if (docData) {
            applicantDocument.value = {
              id: docSnap.id,
              ...docData,
            };
            getFinalDocumentURL();
          }
          resolveOnce();
        },
        reject
      );
    });

    if (!applicantDocument.value) {
      throw new Error('No document could be loaded');
    }

    const { submissionCount } = applicantDocument.value;

    // Get document Pages
    const pagesRef = dbColRefs.getPagesRef(companyId);
    const q = query(
      pagesRef,
      where('docId', '==', docId),
      where('submissionCount', '==', submissionCount),
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
            snapshot.docs.map(async (pageSnap) => {
              const page = pageSnap.data();
              const { dashboardId, applicantId, requestedFormat } =
                applicantDocument.value as ApplicantDocument & { id: string };
              const fileName = `${page.name}.${requestedFormat}`;
              let url = '';
              if (page.submittedFormat.includes('image')) {
                const storageRef = storageRefs.getFixedDocRef(
                  companyId,
                  dashboardId,
                  applicantId,
                  fileName
                );
                url = await getDownloadURL(storageRef);
              } else {
                const storageRef = storageRefs.getOriginalDocRef(
                  companyId,
                  dashboardId,
                  applicantId,
                  fileName
                );
                url = await getDownloadURL(storageRef);
              }
              return {
                id: pageSnap.id,
                url,
                ...page,
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
  } catch (error) {
    console.log(error);
  }
});

const getFinalDocumentURL = async () => {
  if (!applicantDocument.value) return;
  const {
    companyId,
    dashboardId,
    applicantId,
    updatedName,
    name,
    requestedFormat,
  } = applicantDocument.value;
  const docName = updatedName ? updatedName : `${name}.${requestedFormat}`;
  const finalDocStorageRef = storageRefs.getFinalDocRef(
    companyId,
    dashboardId,
    applicantId,
    docName
  );
  finalDocumentURL.value = await getDownloadURL(finalDocStorageRef);
};

onUnmounted(() => {
  unsubApplicantDocument.value?.();
  unsubDocumentPages.value?.();
});

const addReorderPageImages = async () => {
  openingReorder.value = true;
  try {
    for (const page of documentPages.value) {
      // Get pdf page and viewport
      const loadingTask = PDFJS.getDocument(page.url);
      const pdf = await loadingTask.promise;
      const pdfPage = await pdf.getPage(1);
      const scale = 1;
      const viewport = pdfPage.getViewport({ scale });
      // create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      if (!context) return;
      const renderContext = {
        canvasContext: context,
        viewport,
      };
      await pdfPage.render(renderContext).promise;
      const imageURL = canvas.toDataURL();
      reorderPageImages.value.push({
        src: imageURL,
        isDragging: false,
        pageId: page.id,
      });
    }
    showReorderPages.value = true;
  } catch (error) {
    console.log(error);
  } finally {
    openingReorder.value = false;
  }
};

const dragStart = (e: { oldIndex: number }) => {
  selectedDragItemIndex.value = null;
  const index = e.oldIndex;
  reorderPageImages.value[index].isDragging = true;
};

const dragEnd = (e: { newIndex: number; oldIndex: number }) => {
  const index = e.newIndex;
  reorderPageImages.value[index].isDragging = false;
  selectedDragItemIndex.value = index;
};

const clearReorderingPages = () => {
  reorderPageImages.value = [];
  selectedDragItemIndex.value = null;
  showReorderPages.value = false;
};

const reorderPages = async () => {
  isReorderingPages.value = true;
  try {
    const { companyId, docId } = props;
    // Update page number on all pages
    const promises: Promise<void>[] = [];
    reorderPageImages.value.forEach((page, index) => {
      const pageRef = dbDocRefs.getPageRef(companyId, page.pageId);
      const NEW_PAGE_NUMBER = index + 1;
      const promise = updateDoc(pageRef, {
        pageNumber: NEW_PAGE_NUMBER,
      });
      promises.push(promise);
    });
    await Promise.all(promises);
    // Update doc to restitch pages
    const docRef = dbDocRefs.getDocumentRef(companyId, docId);
    await updateDoc(docRef, {
      restitchDocument: true,
    });
    clearReorderingPages();
  } catch (error) {
    console.log(error);
  } finally {
    isReorderingPages.value = false;
  }
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
  border: 1px solid $primary

.ghost
  opacity: 0.3
.drag
  opacity: 1
  background: #7b95a3
.chosen
  opacity: 1
  background: rgba(165,55,253, 0.7)
  background-clip: content-box
  border-radius: 0 0 25px 35px
</style>
