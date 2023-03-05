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
            <div class="text-h5 gt-xs">
              These are the pages/documents your are submitting in this order
            </div>
            <div class="text-h6 lt-sm">
              These are the pages/documents your are submitting in this order
            </div>
            <q-btn v-close-popup icon="fas fa-times" flat dense />
          </div>

          <q-separator class="q-my-md" />

          <div class="text-subtitle1 text-italic">
            If this is not correct, press cancel and fix your pages/documents
          </div>
          <q-list separator>
            <q-item
              v-for="(uploadedFile, index) in uploadedFiles"
              :key="index"
              class="q-py-md"
            >
              <q-item-section>
                <q-item-label>
                  <q-btn
                    target="_blank"
                    no-caps
                    @click="
                      openBaseDialogViewImage(
                        uploadedFile.downloadURL,
                        uploadedFile.file.type
                      )
                    "
                    flat
                    dense
                    class="gt-xs text-body1"
                    color="primary"
                    size="md"
                  >
                    <div class="text-left">
                      {{ uploadedFile.file.name }}
                    </div>
                  </q-btn>
                  <q-btn
                    target="_blank"
                    no-caps
                    @click="
                      openBaseDialogViewImage(
                        uploadedFile.downloadURL,
                        uploadedFile.file.type
                      )
                    "
                    flat
                    dense
                    class="lt-sm text-body1"
                    color="primary"
                  >
                    <div class="text-left">
                      {{ uploadedFile.file.name }}
                    </div>
                  </q-btn>
                </q-item-label>
              </q-item-section>
              <q-item-section avatar side>
                <q-btn
                  @click="
                    openBaseDialogViewImage(
                      uploadedFile.downloadURL,
                      uploadedFile.file.type
                    )
                  "
                  outline
                  color="grey-8"
                  label="View"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-actions align="between">
          <q-btn
            v-close-popup
            outline
            label="Cancel"
            type="reset"
            color="primary"
          />
          <q-btn label="Submit Now" type="submit" color="primary" />
        </q-card-actions>
        <q-inner-loading :showing="isLoading">
          <q-spinner-pie size="80px" color="primary" />
        </q-inner-loading>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { uploadBytes } from '@firebase/storage';
import { QDialog, useDialogPluginComponent } from 'quasar';
import { storageRefs } from 'src/utils/storage';
import { ref } from 'vue';
import { FormDoc, Form, PageStatus, FormPage } from 'src/utils/types';
import { dbDocRefs } from 'src/utils/db';
import { updateDoc } from '@firebase/firestore';
import { useQuasar } from 'quasar';
import BaseDialogViewImage from 'src/components/BaseDialogViewImage.vue';

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const $q = useQuasar();
const props = defineProps<{
  doc: FormDoc & { docId: string };
  form: Form & { id: string };
  uploadedFiles: UploadedFile[];
}>();

interface UploadedFile {
  name: string;
  file: File;
  status: PageStatus | 'New';
  downloadURL: string;
}

const isLoading = ref(false);

const onSubmit = async () => {
  try {
    isLoading.value = true;
    const pages = await uploadFilesToStorage();
    await submitPages(pages);
    isLoading.value = false;
    onDialogOK();
  } catch (error) {
    console.log(error);
  }
};

const uploadFilesToStorage = async () => {
  const promises: Promise<FormPage>[] = [];

  props.uploadedFiles.forEach((file, index) => {
    const PAGE_NUMBER = index + 1;
    const promise = uploadFileToStorage(file, PAGE_NUMBER);
    promises.push(promise);
  });
  return await Promise.all(promises);
};

const uploadFileToStorage = async (
  file: {
    file: File;
    name: string;
    downloadURL: string;
    status: PageStatus | 'New';
  },
  pageNumber: number
) => {
  const applicantName = `${props.form.applicant.name?.first} ${props.form.applicant.name?.last}`;
  let fileName = applicantName + '-' + props.doc.name + '-' + pageNumber;
  if (props.uploadedFiles.length <= 1) {
    fileName = applicantName + '-' + props.doc.name;
  }
  const format = props.doc.format;
  const formId = props.form.id;
  const docId = props.doc.docId;
  const pageId = `${docId}-${pageNumber.toString()}`;
  const companyId = props.form.company.id;
  const dashboardId = props.form.dashboard.id;
  const applicantId = props.form.applicant.id;
  const storageRef = storageRefs.getTemporaryDocsRef(fileName);
  const contentType = file.file.type;
  const contentSize = file.file.size;
  const CONVERT_TO_KILOBYTES = 0.001;
  const FIRST_TIME_SUBMITTED = 1;

  await uploadBytes(storageRef, file.file, {
    contentType,
    customMetadata: {
      companyId,
      dashboardId,
      applicantId,
      formId,
      docId,
      pageId,
      format,
      submissionCount: FIRST_TIME_SUBMITTED.toString(),
    },
  });
  const formPage: FormPage = {
    name: fileName,
    status: 'Submitted',
    submittedFormat: contentType,
    submittedSize: contentSize * CONVERT_TO_KILOBYTES,
    submissionCount: FIRST_TIME_SUBMITTED,
    pageNumber,
  };
  return formPage;
};

const submitPages = async (pagesList: FormPage[]) => {
  const pages: { [key: string]: FormPage } = {};
  pagesList.forEach((page) => {
    pages[`${props.doc.docId}-${page.pageNumber.toString()}`] = page;
  });
  const formRef = dbDocRefs.getFormRef(props.form.id);
  const formDoc = `docs.${props.doc.docId}`;
  const form: Partial<Form> = {
    [`${formDoc}.pages`]: pages,
    [`${formDoc}.status`]: 'Submitted',
    [`${formDoc}.deviceSubmitted`]: $q.platform.is.mobile
      ? 'mobile'
      : 'desktop',
    [`${formDoc}.systemTask`]: 'createDoc',
  };
  await updateDoc(formRef, {
    ...form,
  });
};

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
