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
          <div class="text-h5 q-ml-auto">
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
        <q-list class="q-pa-md" v-if="documentPages.length > 0 && !isLoading">
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
          </q-item>
          <q-separator />
        </q-list>
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
import { ref, onMounted, onUnmounted } from 'vue';
import { ApplicantDocument, ApplicantPage } from 'src/utils/new-types';
import { dbColRefs } from 'src/utils/db';
import {
  onSnapshot,
  query,
  where,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { getDownloadURL } from '@firebase/storage';
import { storageRefs } from 'src/utils/storage';

const { dialogRef, onDialogHide } = useDialogPluginComponent();
const drawerRight = ref(true);
const slide = ref(1);
const documentPages = ref<
  (ApplicantPage & {
    id: string;
    url: string;
  })[]
>([]);
const finalDocumentURL = ref('');
const unsubDocumentPages = ref<Unsubscribe | null>(null);
const isLoading = ref(false);

const props = defineProps<{
  applicantDocument: ApplicantDocument & { id: string };
}>();

onMounted(async () => {
  const pagesRef = dbColRefs.getPagesRef(props.applicantDocument.companyId);
  const q = query(
    pagesRef,
    where('docId', '==', props.applicantDocument.id),
    where('status', '==', 'accepted'),
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
            const { companyId, dashboardId, applicantId, requestedFormat } =
              props.applicantDocument;
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
  await getFinalDocumentURL();
});

const getFinalDocumentURL = async () => {
  const {
    companyId,
    dashboardId,
    applicantId,
    updatedName,
    name,
    requestedFormat,
  } = props.applicantDocument;
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
  unsubDocumentPages.value?.();
});

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
</style>
