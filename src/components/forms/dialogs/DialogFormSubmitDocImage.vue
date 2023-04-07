<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    :persistent="isLoading || hasUploadedFiles"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="card-container text-grey-8">
      <q-form @submit.prevent="onSubmit" greedy>
        <q-card-section>
          <div class="flex justify-between q-mt-sm no-wrap">
            <div class="text-h5 gt-xs">Upload {{ doc.name }}</div>
            <div class="text-h6 lt-sm">Upload {{ doc.name }}</div>
            <q-btn
              @click="onExitWithUploadedFiles"
              icon="fas fa-times"
              flat
              dense
            />
          </div>
          <div class="row q-mt-xs">
            <div class="col">
              <q-btn
                stack
                outline
                class="full-width q-mt-md q-py-xl"
                size="xl"
                @click="clickInputImage"
                icon="fas fa-camera"
                label="Add a Page"
                color="primary"
              />
              <input
                @change="onFileChange"
                style="display: none"
                ref="imageInputRef"
                type="file"
                accept="image/*"
                capture="environment"
              />
            </div>
          </div>
          <div
            v-if="uploadedFiles.length > 0"
            class="flex q-mt-md items-center"
          >
            <div class="text-h6 font-weight-normal text-grey-8">
              {{ isDraggable ? 'REORDER' : 'ADDED' }} PAGES
            </div>
            <q-btn
              class="q-ml-md"
              :label="isDraggable ? 'Done' : 'Reorder'"
              color="primary"
              :outline="!isDraggable"
              @click="isDraggable = !isDraggable"
            />
          </div>
          <draggable
            v-model="uploadedFiles"
            :disabled="!isDraggable"
            group="people"
            @start="dragStart"
            @end="dragEnd"
            item-key="file.name"
          >
            <template #item="{ element }">
              <q-item
                class="q-mt-sm q-px-none"
                :class="element.isDragging ? 'bg-blue-2' : ''"
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
                      color="grey-8"
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
                      color="grey-8"
                    >
                      <div class="text-left ellipsis">
                        {{
                          element.isDragging ? 'DROP HERE' : element.file.name
                        }}
                      </div>
                    </q-btn>
                  </q-item-label>
                </q-item-section>
                <q-item-section v-show="!element.isDragging" avatar side>
                  <q-btn
                    v-if="!isDraggable"
                    @click="removeFile(element)"
                    outline
                    color="grey-8"
                    label="Delete"
                  />
                  <q-icon v-else name="fas fa-grip-vertical" color="grey-8" />
                </q-item-section>
              </q-item>
            </template>
          </draggable>
        </q-card-section>
        <q-card-actions v-if="uploadedFiles.length > 0 && !isDraggable">
          <q-btn
            label="Confirm Document(s)"
            type="submit"
            class="full-width"
            color="primary"
          />
        </q-card-actions>
      </q-form>
      <q-inner-loading :showing="isLoading" style="width: 100vw; height: 100vh">
        <q-spinner-pie size="80px" color="primary" />
        <div class="text-body1 q-mt-md">Adding Image...</div>
      </q-inner-loading>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import * as amplitude from '@amplitude/analytics-browser';
import { getDownloadURL, getMetadata } from '@firebase/storage';
import { QDialog, useDialogPluginComponent } from 'quasar';
import { storageRefs } from 'src/utils/storage';
import { ref, onMounted, computed } from 'vue';
import { Form, PageStatus } from 'src/utils/types';
import { useQuasar } from 'quasar';
import draggable from 'vuedraggable';
import DialogFormSubmitDocPreview from './DialogFormSubmitDocPreview.vue';
import DialogApplicantCameraImageVue from './DialogFormImageRotate.vue';
import BaseDialogViewImage from 'src/components/BaseDialogViewImage.vue';
import { ApplicantDocument } from 'src/utils/new-types';

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const $q = useQuasar();
const props = defineProps<{
  doc: ApplicantDocument & { id: string };
  index: number;
  form: Form & { id: string };
}>();
const drag = ref(false);
const isDraggable = ref(false);
const imageInputRef = ref<HTMLInputElement | null>(null);
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
const hasUploadedFiles = computed(() => uploadedFiles.value.length > 0);
const latestIndex = ref(0);
// const files = ref<FileList | null>(null);
const isLoading = ref(false);

const clickInputImage = () => {
  if (imageInputRef.value) {
    imageInputRef.value.click();
  }
};

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.files) return;
  const file = target.files[0];
  const IMAGE_URL = URL.createObjectURL(file);
  $q.dialog({
    component: DialogApplicantCameraImageVue,
    componentProps: {
      doc: props.doc,
      latestIndex: latestIndex.value,
      file,
      IMAGE_URL,
    },
  })
    .onCancel(() => {
      if (imageInputRef.value) {
        imageInputRef.value.value = '';
      }
    })
    .onOk((payload: { image: File; angle: 0 | 90 | 180 | 270 }) => {
      isLoading.value = true;
      const { image, angle } = payload;
      const uploadedFile = {
        name: image.name,
        file: image,
        status: 'New' as PageStatus,
        downloadURL: IMAGE_URL,
        angle,
        isDragging: false,
      };
      uploadedFiles.value.push(uploadedFile);
      latestIndex.value++;
      isLoading.value = false;
    });
};

onMounted(async () => {
  await setSample();
});

const dragStart = (e: { oldIndex: number }) => {
  const index = e.oldIndex;
  uploadedFiles.value[index].isDragging = true;
  drag.value = true;
};

const dragEnd = (e: { newIndex: number }) => {
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

const onExitWithUploadedFiles = () => {
  if (hasUploadedFiles.value) {
    $q.dialog({
      title: 'Are you sure you want to leave this page?',
      message:
        'You have not finished submitting this document. If you leave this page now, your images will be lost. Do you want to leave this page anyway?',
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
