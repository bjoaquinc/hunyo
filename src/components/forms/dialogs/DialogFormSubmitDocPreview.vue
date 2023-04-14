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
      <q-form @submit.prevent="onSubmit" greedy v-if="!isLoading">
        <q-card-section>
          <div class="flex justify-between q-mt-sm no-wrap">
            <div class="text-h5 gt-xs">
              These are the pages/documents you are submitting in this order
            </div>
            <div class="text-h6 lt-sm">
              These are the pages/documents you are submitting in this order
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
                        uploadedFile.file.type,
                        uploadedFile.angle
                      )
                    "
                    flat
                    dense
                    style="max-width: 100% !important"
                    class="gt-xs text-body1"
                    color="primary"
                    size="md"
                  >
                    <div class="text-left ellipsis">
                      {{ uploadedFile.file.name }}
                    </div>
                  </q-btn>
                  <q-btn
                    target="_blank"
                    no-caps
                    @click="
                      openBaseDialogViewImage(
                        uploadedFile.downloadURL,
                        uploadedFile.file.type,
                        uploadedFile.angle
                      )
                    "
                    flat
                    dense
                    style="max-width: 100% !important"
                    class="lt-sm text-body1"
                    color="primary"
                  >
                    <div class="text-left ellipsis">
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
                      uploadedFile.file.type,
                      uploadedFile.angle
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
        <q-card-actions class="flex column">
          <q-btn
            label="Submit Now"
            class="full-width"
            type="submit"
            color="primary"
          />
          <q-btn
            v-close-popup
            outline
            class="full-width q-mt-md"
            label="Cancel"
            type="reset"
            color="primary"
          />
        </q-card-actions>
      </q-form>
      <div v-else class="bg-white q-pa-md">
        <div class="text-h5 q-mt-md">Uploading Documents</div>
        <q-linear-progress
          class="q-mt-md"
          :value="averageProgress / 100"
          size="25px"
          color="purple-7"
        />
        <div class="text-body1 q-mt-md text-negative">
          Can take up to 5 minutes. Don't close this page.
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import * as amplitude from '@amplitude/analytics-browser';
import { uploadBytesResumable } from '@firebase/storage';
import { QDialog, uid, useDialogPluginComponent } from 'quasar';
import { storageRefs } from 'src/utils/storage';
import { ref, computed } from 'vue';
import { Form } from 'src/utils/types';
import { dbColRefs, dbDocRefs } from 'src/utils/db';
import {
  addDoc,
  updateDoc,
  DocumentReference,
  serverTimestamp,
  Timestamp,
} from '@firebase/firestore';
import { useQuasar } from 'quasar';
import BaseDialogViewImage from 'src/components/BaseDialogViewImage.vue';
import { ApplicantDocument, ApplicantPage } from 'src/utils/new-types';

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const $q = useQuasar();
const props = defineProps<{
  doc: ApplicantDocument & { id: string };
  form: Form & { id: string };
  uploadedFiles: UploadedFile[];
}>();

const updatedSubmissionCount = computed(() => props.doc.submissionCount + 1);

interface UploadedFile {
  name: string;
  file: File;
  downloadURL: string;
  angle?: 0 | 90 | 180 | 270;
}

const isLoading = ref(false);
const progressTotal = ref<{ [key: string]: number }>({});
const averageProgress = computed(() => {
  if (Object.values(progressTotal.value).length === 0) return 0;
  const total = Object.values(progressTotal.value).reduce((a, b) => a + b, 0);
  console.log('total', total);
  const average = total / Object.values(progressTotal.value).length;
  return average;
});

const onSubmit = async () => {
  amplitude.track('Click Document Complete', {
    docName: props.doc.name,
    docId: props.doc.id,
    numberOfPages: props.uploadedFiles.length,
    source: 'applicant',
    status: 'submit',
  });
  try {
    isLoading.value = true;
    const pages = await uploadFilesToStorage();
    const totalPages = await createApplicantPages(pages);
    await updateApplicantDocument(totalPages);
    isLoading.value = false;
    const CONVERT_TO_KB = 0.001;
    amplitude.track('Document Successfully Submitted', {
      docName: props.doc.name,
      docId: props.doc.id,
      numberOfPages: props.uploadedFiles.length,
      source: 'applicant',
      status: 'submit',
      formatsSubmitted: props.uploadedFiles.map((file) => file.file.type),
      formatRequired: props.doc.requestedFormat,
      orderOnList: props.doc.docNumber,
      totalFileSizeKB:
        props.uploadedFiles.reduce((a, b) => a + b.file.size, 0) *
        CONVERT_TO_KB,
    });
    onDialogOK();
  } catch (error) {
    console.log(error);
  }
};

const uploadFilesToStorage = async () => {
  const promises: Promise<{
    name: string;
    submittedFormat: string;
    submittedSize: number;
    pageNumber: number;
  }>[] = [];

  props.uploadedFiles.forEach((file, index) => {
    const PAGE_NUMBER = index + 1;
    const promise = uploadFileToStorage(file, PAGE_NUMBER);
    promises.push(promise);
  });
  return await Promise.all(promises);
};

const uploadFileToStorage = async (file: UploadedFile, pageNumber: number) => {
  const applicantName = `${props.form.applicant.name?.first} ${props.form.applicant.name?.middle} ${props.form.applicant.name?.last}`;
  const fileName = applicantName + '-' + props.doc.name + '-' + uid();
  // if (props.uploadedFiles.length <= 1) {
  //   fileName = applicantName + '-' + props.doc.name;
  // }
  const format = props.doc.requestedFormat;
  const formId = props.form.id;
  const docId = props.doc.id;
  const pageId = `${docId}-${pageNumber.toString()}`;
  const companyId = props.form.company.id;
  const dashboardId = props.form.dashboard.id;
  const applicantId = props.form.applicant.id;
  const storageRef = storageRefs.getTemporaryDocsRef(fileName);
  const contentType = file.file.type;
  const contentSize = file.file.size;
  const CONVERT_TO_KILOBYTES = 0.001;

  const customMetadata: { [key: string]: string } = {
    companyId,
    dashboardId,
    applicantId,
    formId,
    docId,
    pageId,
    format,
  };

  if (file.angle !== undefined) {
    customMetadata['angle'] = file.angle.toString();
  }

  const uploadTask = uploadBytesResumable(storageRef, file.file, {
    contentType,
    customMetadata,
  });

  await new Promise<void>((resolve) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(progress);
        progressTotal.value[fileName] = progress;
        console.log(progressTotal.value);
        console.log('average', averageProgress.value);

        switch (snapshot.state) {
          case 'paused':
            console.log('Upload is paused');
            break;
          case 'running':
            console.log('Upload is running');
            break;
        }
      },
      (error) => {
        console.log(error);
      },
      () => {
        resolve();
      }
    );
  });
  return {
    name: fileName,
    submittedFormat: contentType,
    submittedSize: contentSize * CONVERT_TO_KILOBYTES,
    pageNumber,
  };
};

const createApplicantPages = async (
  pages: {
    name: string;
    submittedFormat: string;
    submittedSize: number;
    pageNumber: number;
  }[]
) => {
  const pagesRef = dbColRefs.getPagesRef(props.doc.companyId);
  const promises: Promise<DocumentReference>[] = [];
  pages.forEach((page) => {
    const applicantPage: ApplicantPage = {
      createdAt: serverTimestamp() as Timestamp,
      docId: props.doc.id,
      formId: props.form.id,
      companyId: props.doc.companyId,
      dashboardId: props.doc.dashboardId,
      applicantId: props.doc.applicantId,
      submissionCount: updatedSubmissionCount.value,
      ...page,
    };
    const promise = addDoc(pagesRef, applicantPage);
    promises.push(promise);
  });
  const TOTAL_PAGES_NUMBER = pages.length;
  return TOTAL_PAGES_NUMBER;
};

const updateApplicantDocument = async (totalPages: number) => {
  const docRef = dbDocRefs.getDocumentRef(props.doc.companyId, props.doc.id);
  const UPDATED_DOC_STATUS = 'submitted';
  await updateDoc(docRef, {
    status: UPDATED_DOC_STATUS,
    totalPages,
    deviceSubmitted: $q.platform.is.mobile ? 'mobile' : 'desktop',
    submissionCount: updatedSubmissionCount.value,
    rejection: null,
  });
};

const openBaseDialogViewImage = (
  imgURL: string,
  contentType: string,
  angle?: 0 | 90 | 180 | 270
) => {
  $q.dialog({
    component: BaseDialogViewImage,
    componentProps: {
      imgURL,
      contentType,
      angle,
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
