<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    :persistent="isLoading"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="card-container text-grey-8">
      <q-form @submit.prevent="onSubmit" greedy>
        <q-card-section>
          <div class="flex justify-between q-mt-sm no-wrap">
            <div class="text-h5 gt-xs">Upload {{ doc.name }}</div>
            <div class="text-h6 lt-sm">Upload {{ doc.name }}</div>
            <q-btn v-close-popup icon="fas fa-times" flat dense />
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
          <div class="row q-mt-xs">
            <div class="col">
              <q-file
                ref="uploadFileRef"
                v-model="files"
                accept=".jpg, images/*, .pdf"
                multiple
                :reactive-rules="true"
                :rules="[
                  (val) =>
                    newUploadedFilesCount > 0 ||
                    'Upload at least one file to submit.',
                ]"
                standout
                label="ADD IMAGE OR PDF FILE"
                filled
                outlined
                class="rounded-borders"
              >
                <template v-slot:prepend>
                  <q-icon
                    style="cursor: pointer"
                    @click="uploadFileRef?.pickFiles()"
                    name="fas fa-file-arrow-up"
                  />
                </template>
                <template v-slot:append>
                  <q-icon
                    style="cursor: pointer"
                    @click="uploadFileRef?.pickFiles()"
                    name="fas fa-plus"
                  />
                </template>
              </q-file>
            </div>
          </div>
          <div
            v-if="uploadedFiles.length > 0"
            class="text-h6 text-grey-8 q-mt-sm"
          >
            Your uploads (drag and drop to reorder the pages)
          </div>
          <draggable
            v-model="uploadedFiles"
            group="people"
            @start="drag = true"
            @end="drag = false"
            item-key="index"
          >
            <template #item="{ element }">
              <q-item class="q-mt-sm" clickable>
                <q-item-section>
                  <q-item-label>
                    <q-btn
                      target="_blank"
                      no-caps
                      @click="
                        openBaseDialogViewImage(
                          element.downloadURL,
                          element.file.type
                        )
                      "
                      flat
                      dense
                      class="gt-xs text-body1"
                      :color="uploadedFileItemStyles[(element as UploadedFile).status].textColor"
                      size="md"
                    >
                      <div class="text-left">
                        {{ element.file.name }}
                      </div>
                    </q-btn>
                    <q-btn
                      target="_blank"
                      no-caps
                      @click="
                        openBaseDialogViewImage(
                          element.downloadURL,
                          element.file.type
                        )
                      "
                      flat
                      dense
                      class="lt-sm text-body1"
                      :color="uploadedFileItemStyles[(element as UploadedFile).status].textColor"
                    >
                      <div class="text-left">
                        {{ element.file.name }}
                      </div>
                    </q-btn>
                  </q-item-label>
                </q-item-section>
                <q-item-section avatar side>
                  <q-btn
                    @click="removeFile(index)"
                    :outline="uploadedFileItemStyles[(element as UploadedFile).status].outline"
                    :color="uploadedFileItemStyles[(element as UploadedFile).status].color"
                    :label="uploadedFileItemStyles[(element as UploadedFile).status].label"
                    :flat="uploadedFileItemStyles[(element as UploadedFile).status].flat"
                  />
                </q-item-section>
              </q-item>
            </template>
          </draggable>
        </q-card-section>
        <q-card-actions>
          <q-btn
            label="Confirm Document(s)"
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
import { ref, watch, computed, onMounted } from 'vue';
import { FormDoc, Form, PageStatus } from 'src/utils/types';
import { useQuasar } from 'quasar';
import draggable from 'vuedraggable';
import DialogFormTips from './DialogFormTips.vue';
import DialogFormSubmitDocPreview from './DialogFormSubmitDocPreview.vue';
import BaseDialogViewImage from 'src/components/BaseDialogViewImage.vue';

const drag = ref(false);

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const $q = useQuasar();
const props = defineProps<{
  doc: FormDoc & { docId: string };
  index: number;
  form: Form & { id: string };
}>();
const uploadFileRef = ref<QFile | null>(null);
const uploadedFileItemStyles = {
  New: {
    label: 'Delete',
    flat: false,
    outline: true,
    color: 'grey-8',
    textColor: 'primary',
  },
  Submitted: {
    label: 'Submitted',
    flat: true,
    outline: false,
    color: 'grey-8',
    textColor: 'grey-8',
  },
  Rejected: {
    label: 'Resubmit',
    flat: false,
    outline: true,
    color: 'negative',
    textColor: 'negative',
  },
  Accepted: {
    label: 'Accepted',
    flat: true,
    outline: false,
    color: 'positive',
    textColor: 'positive',
  },
};

onMounted(async () => {
  await setSample();
});

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

const sample = ref<{
  url: string;
  contentType: string;
} | null>(null);
interface UploadedFile {
  name: string;
  file: File;
  status: PageStatus | 'New';
  downloadURL: string;
}
const uploadedFiles = ref<UploadedFile[]>([]);
const newUploadedFilesCount = computed(() => {
  return uploadedFiles.value.filter((file) => file.status === 'New').length;
});
const files = ref<FileList | null>(null);
const isLoading = ref(false);

const openDialogFormTips = () => {
  $q.dialog({
    component: DialogFormTips,
  });
};

watch(files, (newFiles) => {
  if (newFiles) {
    isLoading.value = true;
    for (const file of newFiles) {
      const fileBlob = new Blob([file], { type: file.type });
      const downloadURL = URL.createObjectURL(fileBlob);
      uploadedFiles.value.push({
        name: file.name,
        file,
        downloadURL,
        status: 'New',
      });
    }
    files.value = null;
    isLoading.value = false;
  }
});

const removeFile = (index: number) => {
  uploadedFiles.value.splice(index, 1);
};

const onSubmit = async () => {
  await openDialogFormSubmitDocPreview();
  onDialogOK();
};

const openDialogFormSubmitDocPreview = async () => {
  await new Promise((resolve) => {
    $q.dialog({
      component: DialogFormSubmitDocPreview,
      componentProps: {
        doc: props.doc,
        form: props.form,
        uploadedFiles: uploadedFiles.value,
      },
    }).onOk(resolve);
  });
};

// const uploadFilesToStorage = async () => {
//   const promises: Promise<FormPage>[] = [];

//   uploadedFiles.value.forEach((file, index) => {
//     const PAGE_NUMBER = index + 1;
//     const promise = uploadFileToStorage(file, PAGE_NUMBER);
//     promises.push(promise);
//   });
//   return await Promise.all(promises);
// };

// const uploadFileToStorage = async (
//   file: {
//     file: File;
//     name: string;
//     downloadURL: string;
//     status: PageStatus | 'New';
//   },
//   pageNumber: number
// ) => {
//   const applicantName = `${props.form.applicant.name?.first} ${props.form.applicant.name?.last}`;
//   let fileName = applicantName + '-' + props.doc.name + '-' + pageNumber;
//   if (uploadedFiles.value.length <= 1) {
//     fileName = applicantName + '-' + props.doc.name;
//   }
//   const format = props.doc.format;
//   const formId = props.form.id;
//   const docId = props.doc.docId;
//   const pageId = `${docId}-${pageNumber.toString()}`;
//   const companyId = props.form.company.id;
//   const dashboardId = props.form.dashboard.id;
//   const applicantId = props.form.applicant.id;
//   const storageRef = storageRefs.getTemporaryDocsRef(fileName);
//   const contentType = file.file.type;
//   const contentSize = file.file.size;
//   const CONVERT_TO_KILOBYTES = 0.001;
//   const FIRST_TIME_SUBMITTED = 1;

//   await uploadBytes(storageRef, file.file, {
//     contentType,
//     customMetadata: {
//       companyId,
//       dashboardId,
//       applicantId,
//       formId,
//       docId,
//       pageId,
//       format,
//       submissionCount: FIRST_TIME_SUBMITTED.toString(),
//     },
//   });
//   const formPage: FormPage = {
//     name: fileName,
//     status: 'Submitted',
//     submittedFormat: contentType,
//     submittedSize: contentSize * CONVERT_TO_KILOBYTES,
//     submissionCount: FIRST_TIME_SUBMITTED,
//     pageNumber,
//   };
//   return formPage;
// };

// const submitPages = async (pagesList: FormPage[]) => {
//   const pages: { [key: string]: FormPage } = {};
//   pagesList.forEach((page) => {
//     pages[`${props.doc.docId}-${page.pageNumber.toString()}`] = page;
//   });
//   const formRef = dbDocRefs.getFormRef(props.form.id);
//   const formDoc = `docs.${props.doc.docId}`;
//   const form: Partial<Form> = {
//     [`${formDoc}.pages`]: pages,
//     [`${formDoc}.status`]: 'Submitted',
//     [`${formDoc}.deviceSubmitted`]: $q.platform.is.mobile
//       ? 'mobile'
//       : 'desktop',
//     [`${formDoc}.systemTask`]: 'createDoc',
//   };
//   await updateDoc(formRef, {
//     ...form,
//   });
// };

const openBaseDialogViewImage = (imgURL: string, contentType: string) => {
  $q.dialog({
    component: BaseDialogViewImage,
    componentProps: {
      imgURL,
      contentType,
    },
  });
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
