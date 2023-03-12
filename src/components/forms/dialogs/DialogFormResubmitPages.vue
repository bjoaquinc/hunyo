<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    :persistent="isLoading || hasUploadedPages"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="card-container text-grey-8">
      <q-form @submit.prevent="onResubmit" greedy>
        <q-card-section>
          <div class="flex justify-between q-mt-sm no-wrap">
            <div class="text-h5 gt-xs">Resubmit {{ doc.name }}</div>
            <div class="text-h6 lt-sm">Resubmit {{ doc.name }}</div>
            <q-btn
              @click="onExitWithUploadedFiles"
              icon="fas fa-times"
              flat
              dense
            />
          </div>
          <q-item class="text-body1 q-mt-md">
            <q-item-section avatar class="gt-xs" top side>
              <q-icon name="fas fa-exclamation" color="negative" size="xs" />
            </q-item-section>
            <q-item-section>
              <div class="flex column">
                <div v-if="doc.instructions" style="white-space: pre-line">
                  {{ doc.instructions }}
                </div>
                <q-btn
                  v-if="sample"
                  @click="
                    sample
                      ? openBaseDialogViewImage(sample.url, sample.contentType)
                      : null
                  "
                  :class="doc.instructions ? 'q-mt-md' : ''"
                  label="See Sample"
                  no-caps
                  outline
                />
                <q-btn
                  @click="openDialogFormTips"
                  :class="doc.instructions || sample ? 'q-mt-md' : ''"
                  label="View tips for taking better document photos"
                  no-caps
                  outline
                />
              </div>
            </q-item-section>
          </q-item>

          <q-separator class="q-my-md" />
          <q-list>
            <div class="text-h6 text-grey-8 q-mt-sm">
              Resubmit following pages
            </div>
            <q-item
              v-for="(page, index) in rejectedPages"
              :key="page.id"
              class="q-mt-sm"
            >
              <q-item-section>
                <q-item-label>
                  <q-btn
                    @click="
                      openBaseDialogViewImage(
                        page.url,
                        page.contentType,
                        page.uploadedFile
                      )
                    "
                    style="max-width: 100% !important"
                    no-caps
                    flat
                    dense
                    class="gt-xs text-body1"
                    color="primary"
                    size="md"
                  >
                    <div class="text-left ellipsis">
                      {{
                        page.uploadedFile ? page.uploadedFile.name : page.name
                      }}
                    </div>
                  </q-btn>
                  <q-btn
                    @click="
                      openBaseDialogViewImage(
                        page.url,
                        page.contentType,
                        page.uploadedFile
                      )
                    "
                    no-caps
                    flat
                    dense
                    class="lt-sm text-body1"
                    color="primary"
                  >
                    <div class="text-left">
                      {{
                        page.uploadedFile ? page.uploadedFile.name : page.name
                      }}
                    </div>
                  </q-btn>
                </q-item-label>
              </q-item-section>
              <q-item-section avatar side>
                <q-btn
                  @click="onClickResubmit(index)"
                  :outline="!page.uploadedFile ? false : true"
                  :color="
                    !page.uploadedFile && page.error ? 'negative' : 'primary'
                  "
                  :label="!page.uploadedFile ? 'Update' : 'Updated. Change?'"
                />
                <q-file
                  :ref="(el: QFile) => {
                  if (filePickerRefs.length < rejectedPages.length) {
                    filePickerRefs.push(el);
                  }
                }"
                  v-model="page.uploadedFile"
                  style="display: none"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-actions>
          <q-btn
            label="Resubmit Document(s)"
            type="submit"
            class="full-width"
            color="primary"
          />
        </q-card-actions>
        <q-inner-loading :showing="isLoading">
          <q-spinner-pie size="80px" color="primary" />
        </q-inner-loading>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { getDownloadURL, getMetadata } from '@firebase/storage';
import { QDialog, QFile, useDialogPluginComponent } from 'quasar';
import { storageRefs } from 'src/utils/storage';
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { Form } from 'src/utils/types';
import { useQuasar } from 'quasar';
import DialogFormTips from './DialogFormTips.vue';
import BaseDialogViewImage from 'src/components/BaseDialogViewImage.vue';
import DialogFormResubmitPagesPreview from './DialogFormResubmitPagesPreview.vue';
import { ApplicantDocument, ApplicantPage } from 'src/utils/new-types';
import { dbColRefs } from 'src/utils/db';
import {
  query,
  where,
  documentId,
  Unsubscribe,
  onSnapshot,
} from '@firebase/firestore';

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const $q = useQuasar();
const props = defineProps<{
  doc: ApplicantDocument & { id: string };
  index: number;
  form: Form & { id: string };
}>();
const filePickerRefs = ref<QFile[]>([]);
const rejectedPages = ref<
  (ApplicantPage & {
    id: string;
    uploadedFile: null | File;
    url: string;
    contentType: string;
    error: boolean;
  })[]
>([]);
const hasUploadedPages = computed(() =>
  rejectedPages.value.some((p) => p.uploadedFile)
);
const unsubRejectedPages = ref<Unsubscribe | null>(null);
onMounted(async () => {
  await setRejectedPages();
  await setSample();
});

onBeforeUnmount(() => {
  return false;
});

const setRejectedPages = async () => {
  if (!props.doc.rejection || !props.doc.rejection.pageIds) return;
  const pagesRef = dbColRefs.getPagesRef(props.doc.companyId);
  const q = query(
    pagesRef,
    where('docId', '==', props.doc.id),
    where(documentId(), 'in', props.doc.rejection.pageIds)
  );
  await new Promise<void>((resolve, reject) => {
    let runOnce = () => {
      runOnce = () => {
        return;
      };
      resolve();
    };
    unsubRejectedPages.value = onSnapshot(
      q,
      async (snapshot) => {
        rejectedPages.value = await Promise.all(
          snapshot.docs.map(async (pageSnap) => {
            const page = pageSnap.data();
            const DOC_NAME = `${page.name}.${
              page.submittedFormat.includes('image') ? 'jpeg' : 'pdf'
            }`;
            const storageRef = storageRefs.getOriginalDocRef(
              page.companyId,
              page.dashboardId,
              page.applicantId,
              DOC_NAME
            );
            const metadata = await getMetadata(storageRef);
            const url = await getDownloadURL(storageRef);
            return {
              ...page,
              error: false,
              id: pageSnap.id,
              uploadedFile: null,
              url,
              contentType: metadata.contentType as string,
            };
          })
        );
        runOnce();
      },
      (err) => reject(err)
    );
  });
};

const setSample = async () => {
  if (props.doc.sample) {
    const sampleRef = storageRefs.getSampleRef(
      props.form.company.id,
      props.form.dashboard.id,
      props.doc.sample.file
    );
    const metadata = await getMetadata(sampleRef);
    const contentType = metadata.contentType;
    const url = await getDownloadURL(sampleRef);
    if (url && contentType) {
      sample.value = {
        url,
        contentType,
      };
    }
  }
};

const onClickResubmit = (index: number) => {
  if (!rejectedPages.value[index].uploadedFile) {
    filePickerRefs.value[index].pickFiles();
  } else {
    $q.dialog({
      title: 'Do you want to change this page?',
      cancel: true,
    }).onOk(() => {
      filePickerRefs.value[index].pickFiles();
    });
  }
};

const onExitWithUploadedFiles = () => {
  if (hasUploadedPages.value) {
    $q.dialog({
      title: 'Are you sure you want to leave this page?',
      message:
        'You have not finished resubmitting all the requested pages. If you leave this page now, your changes will be lost. Do you want to leave this page anyway?',
      ok: {
        label: 'Yes',
        outline: true,
      },
      cancel: {
        label: 'No',
        color: 'primary',
      },
    }).onOk(() => {
      dialogRef.value?.hide();
    });
  } else {
    dialogRef.value?.hide();
  }
};

const onResubmit = () => {
  for (const page of rejectedPages.value) {
    if (page.uploadedFile === null) {
      page.error = true;
      return;
    }
  }
  // TODO: open confirm resubmitted pages
  openDialogFormResubmitPagesPreview();
};

const openDialogFormResubmitPagesPreview = () => {
  $q.dialog({
    component: DialogFormResubmitPagesPreview,
    componentProps: {
      doc: props.doc,
      form: props.form,
      pages: rejectedPages.value,
    },
  }).onOk(() => {
    onDialogOK();
  });
};

const sample = ref<{
  url: string;
  contentType: string;
} | null>(null);
const isLoading = ref(false);

const openDialogFormTips = () => {
  $q.dialog({
    component: DialogFormTips,
  });
};

const openBaseDialogViewImage = (
  imgURL: string,
  contentType: string,
  file?: File | null
) => {
  if (file) {
    const fileBlob = new Blob([file], { type: file.type });
    const downloadURL = URL.createObjectURL(fileBlob);
    $q.dialog({
      component: BaseDialogViewImage,
      componentProps: {
        imgURL: downloadURL,
        contentType: file.type,
      },
    });
  } else {
    $q.dialog({
      component: BaseDialogViewImage,
      componentProps: {
        imgURL,
        contentType,
      },
    });
  }
};

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);
</script>

<style lang="sass" scoped>
.card-container
  @media only screen and (width > $breakpoint-xs)
    max-width: 600px !important
    height: auto !important
</style>
