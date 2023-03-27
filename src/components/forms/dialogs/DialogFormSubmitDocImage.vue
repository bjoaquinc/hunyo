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
          <div class="row q-mt-xs">
            <div class="col">
              <q-btn
                stack
                outline
                class="full-width q-mt-md q-py-xl"
                size="xl"
                @click="openDialogApplicantCamera"
                icon="fas fa-camera"
                label="Add a Page"
                color="primary"
              />
            </div>
          </div>
          <div
            v-if="uploadedFiles.length > 0"
            class="text-h6 text-grey-8 q-mt-md"
          >
            Your uploads (drag and drop to reorder the pages)
          </div>
          <draggable
            v-model="uploadedFiles"
            group="people"
            @start="dragStart"
            @end="dragEnd"
            item-key="file.name"
          >
            <template #item="{ element }">
              <q-item
                class="q-mt-sm"
                :class="element.isDragging ? 'bg-blue-2' : ''"
                clickable
              >
                <q-item-section>
                  <q-item-label>
                    <q-btn
                      target="_blank"
                      no-caps
                      @click="
                        openBaseDialogViewImage(
                          element.downloadURL,
                          element.file.type,
                          element.angle
                        )
                      "
                      style="max-width: 100% !important"
                      flat
                      dense
                      class="gt-xs text-body1"
                      :color="uploadedFileItemStyles[(element as UploadedFile).status].textColor"
                      size="md"
                    >
                      <div class="text-left ellipsis">
                        {{
                          element.isDragging ? 'DROP HERE' : element.file.name
                        }}
                      </div>
                    </q-btn>
                    <q-btn
                      no-caps
                      @click="
                        openBaseDialogViewImage(
                          element.downloadURL,
                          element.file.type,
                          element.angle
                        )
                      "
                      style="max-width: 100% !important"
                      flat
                      dense
                      class="lt-sm text-body1"
                      :size="element.isDragging ? 'lg' : 'md'"
                      :class="
                        element.isDragging
                          ? 'text-weight-bold full-width text-center'
                          : ''
                      "
                      :color="uploadedFileItemStyles[(element as UploadedFile).status].textColor"
                    >
                      <div class="text-left ellipsis">
                        {{
                          element.isDragging ? 'DROP HERE' : element.file.name
                        }}
                      </div>
                    </q-btn>
                  </q-item-label>
                </q-item-section>
                <q-item-section v-if="!element.isDragging" avatar side>
                  <q-btn
                    @click="removeFile(element)"
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
        <q-card-actions v-if="uploadedFiles.length > 0">
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
import * as amplitude from '@amplitude/analytics-browser';
import { getDownloadURL, getMetadata } from '@firebase/storage';
import { QDialog, useDialogPluginComponent } from 'quasar';
import { storageRefs } from 'src/utils/storage';
import { ref, watch, onMounted } from 'vue';
import { Form, PageStatus } from 'src/utils/types';
import { useQuasar } from 'quasar';
import draggable from 'vuedraggable';
// import DialogFormTips from './DialogFormTips.vue';
import DialogFormSubmitDocPreview from './DialogFormSubmitDocPreview.vue';
import DialogApplicantCamera from './camera/DialogApplicantCamera.vue';
import BaseDialogViewImage from 'src/components/BaseDialogViewImage.vue';
import { ApplicantDocument } from 'src/utils/new-types';

const drag = ref(false);

const openDialogApplicantCamera = async () => {
  const dialog = $q.dialog({
    component: DialogApplicantCamera,
    componentProps: {
      doc: props.doc,
    },
  });

  dialog.onOk(
    (payload: {
      image: { image: Blob; name: string; type: string; size: number };
      angle: 0 | 90 | 180 | 270;
    }) => {
      const { image, angle } = payload;
      const file = new File([image.image], image.name, { type: image.type });
      const IMAGE_URL = URL.createObjectURL(file);
      const uploadedFile = {
        name: image.name,
        file,
        status: 'New' as PageStatus,
        downloadURL: IMAGE_URL,
        angle,
        isDragging: false,
      };
      uploadedFiles.value.push(uploadedFile);
    }
  );
};

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const $q = useQuasar();
const props = defineProps<{
  doc: ApplicantDocument & { id: string };
  index: number;
  form: Form & { id: string };
}>();
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

const dragStart = (e: { oldIndex: number }) => {
  console.log(e);
  const index = e.oldIndex;
  uploadedFiles.value[index].isDragging = true;
  drag.value = true;
};

const dragEnd = (e: { newIndex: number }) => {
  console.log(e);
  drag.value = false;
  const index = e.newIndex;
  uploadedFiles.value[index].isDragging = false;
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

const sample = ref<{
  url: string;
  contentType: string;
} | null>(null);
interface UploadedFile {
  name: string;
  file: File;
  status: PageStatus | 'New';
  downloadURL: string;
  isDragging: boolean;
  angle?: 0 | 90 | 180 | 270;
}
const uploadedFiles = ref<UploadedFile[]>([]);
const files = ref<FileList | null>(null);
const isLoading = ref(false);

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
        isDragging: false,
      });
      const CONVERT_TO_KB = 0.001;
      amplitude.track('Add Pages/Document', {
        docName: props.doc.name,
        formatSubmitted: file.type,
        fileSize: file.size * CONVERT_TO_KB,
        pageNumber: uploadedFiles.value.length,
        numberOfPages: newFiles.length,
        source: 'applicant',
      });
    }
    files.value = null;
    isLoading.value = false;
  }
});

const removeFile = (element: UploadedFile) => {
  const index = uploadedFiles.value.indexOf(element);
  uploadedFiles.value.splice(index, 1);
};

const onSubmit = async () => {
  amplitude.track('Confirm Document', {
    docName: props.doc.name,
    docId: props.doc.id,
    numberOfPages: uploadedFiles.value.length,
    source: 'applicant',
    status: 'submit',
  });
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

const openBaseDialogViewImage = (
  imgURL: string,
  contentType: string,
  angle: 0 | 90 | 180 | 270
) => {
  $q.dialog({
    component: BaseDialogViewImage,
    componentProps: {
      angle,
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
