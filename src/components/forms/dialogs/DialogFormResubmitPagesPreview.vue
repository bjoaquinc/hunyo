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
      <q-form @submit.prevent="onSubmit" v-if="!isLoading" greedy>
        <q-card-section>
          <div class="flex justify-between q-mt-sm no-wrap">
            <div class="text-h5 gt-xs">
              These are the pages you are submitting
            </div>
            <div class="text-h6 lt-sm">
              These are the pages you are submitting
            </div>
            <q-btn v-close-popup icon="fas fa-times" flat dense />
          </div>

          <q-separator class="q-my-md" />

          <div class="text-subtitle1 text-italic">
            If this is not correct, press cancel and fix your pages/documents
          </div>
          <q-list separator>
            <q-item v-for="(page, index) in pages" :key="index" class="q-py-md">
              <q-item-section>
                <q-item-label>
                  <q-btn
                    target="_blank"
                    no-caps
                    @click="openBaseDialogViewImage(page.uploadedFile)"
                    style="max-width: 100% !important"
                    flat
                    dense
                    class="gt-xs text-body1"
                    color="primary"
                    size="md"
                  >
                    <div class="text-left ellipsis">
                      {{ page.uploadedFile.name }}
                    </div>
                  </q-btn>
                  <q-btn
                    target="_blank"
                    no-caps
                    @click="openBaseDialogViewImage(page.uploadedFile)"
                    style="max-width: 100% !important"
                    flat
                    dense
                    class="lt-sm text-body1"
                    color="primary"
                  >
                    <div class="text-left ellipsis">
                      {{ page.name }}
                    </div>
                  </q-btn>
                </q-item-label>
              </q-item-section>
              <q-item-section avatar side>
                <q-btn
                  @click="openBaseDialogViewImage(page.uploadedFile)"
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
import { uploadBytesResumable } from '@firebase/storage';
import { QDialog, useDialogPluginComponent } from 'quasar';
import { storageRefs } from 'src/utils/storage';
import { ref, computed } from 'vue';
import { Form } from 'src/utils/types';
import { dbDocRefs } from 'src/utils/db';
import {
  updateDoc,
  serverTimestamp,
  increment,
  deleteField,
} from '@firebase/firestore';
import { useQuasar } from 'quasar';
import BaseDialogViewImage from 'src/components/BaseDialogViewImage.vue';
import { ApplicantDocument, ApplicantPage } from 'src/utils/new-types';

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const $q = useQuasar();
const props = defineProps<{
  doc: ApplicantDocument & { id: string };
  form: Form & { id: string };
  pages: (ApplicantPage & { id: string; url: string; uploadedFile: File })[];
}>();

const isLoading = ref(false);
const progressTotal = ref<{ [key: string]: number }>({});
const averageProgress = computed(() => {
  const total = Object.values(progressTotal.value).reduce((a, b) => a + b, 0);
  const count = Object.values(progressTotal.value).length;
  return total / count;
});

const onSubmit = async () => {
  try {
    isLoading.value = true;
    await uploadFilesToStorage();
    await updateApplicantPages();
    await updateApplicantDocument();
    await updateForm();
    isLoading.value = false;
    onDialogOK();
  } catch (error) {
    console.log(error);
  }
};

const uploadFilesToStorage = async () => {
  const promises: Promise<void>[] = [];

  props.pages.forEach((page) => {
    const promise = uploadFileToStorage(page);
    promises.push(promise);
  });
  return await Promise.all(promises);
};

const uploadFileToStorage = async (
  page: ApplicantPage & { id: string; url: string; uploadedFile: File }
) => {
  const format = props.doc.requestedFormat;
  const formId = page.formId;
  const docId = page.docId;
  const companyId = page.companyId;
  const dashboardId = page.dashboardId;
  const applicantId = page.applicantId;
  const storageRef = storageRefs.getTemporaryDocsRef(page.name);
  const contentType = page.uploadedFile.type;

  const uploadTask = uploadBytesResumable(storageRef, page.uploadedFile, {
    contentType,
    customMetadata: {
      companyId,
      dashboardId,
      applicantId,
      formId,
      docId,
      format,
    },
  });

  await new Promise<void>((resolve) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        progressTotal.value[page.id] = progress;

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
};

const updateApplicantPages = async () => {
  const promises: Promise<void>[] = [];
  const CONVERT_TO_KILOBYTES = 0.001;
  props.pages.forEach((page) => {
    const pageRef = dbDocRefs.getPageRef(page.companyId, page.id);
    const promise = updateDoc(pageRef, {
      submissionCount: increment(1),
      submittedFormat: page.uploadedFile.type,
      submittedSize: page.uploadedFile.size * CONVERT_TO_KILOBYTES,
      status: 'submitted',
      rejection: deleteField(),
      updatedAt: serverTimestamp(),
    });
    promises.push(promise);
  });
  return await Promise.all(promises);
};

const updateApplicantDocument = async () => {
  const docRef = dbDocRefs.getDocumentRef(props.doc.companyId, props.doc.id);
  const UPDATED_DOC_STATUS = 'submitted';
  await updateDoc(docRef, {
    status: UPDATED_DOC_STATUS,
  });
};

const updateForm = async () => {
  const formRef = dbDocRefs.getFormRef(props.form.id);
  const INCREMENT_DOCS_FOR_APPLICANT_CHECK = increment(1);
  await updateDoc(formRef, {
    adminCheckDocs: INCREMENT_DOCS_FOR_APPLICANT_CHECK,
  });
};

const openBaseDialogViewImage = (file: File) => {
  const fileBlob = new Blob([file], { type: file.type });
  const downloadURL = URL.createObjectURL(fileBlob);
  $q.dialog({
    component: BaseDialogViewImage,
    componentProps: {
      imgURL: downloadURL,
      contentType: file.type,
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
