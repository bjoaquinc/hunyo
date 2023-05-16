<template>
  <q-page>
    <div class="full-width flex">
      <div class="q-mx-auto q-mt-lg" style="max-width: 680px">
        <!-- <div class="text-h5">Upload your Identity Document</div> -->
        <q-file
          v-model="files"
          @update:model-value="
            (value) => {
              addFiles(value);
            }
          "
          class="upload-button q-mt-lg"
          input-style="padding: 150px 250px"
          :item-aligned="true"
          accept="image/*, application/pdf"
          multiple
          rounded
          filled
        >
          <template v-slot:default>
            <div class="absolute-center flex column text-grey-8 text-h4">
              <q-icon
                name="fas fa-cloud-arrow-up"
                class="q-mx-auto"
                size="140px"
              />
              <div class="q-mt-md">Upload a file</div>
            </div>
          </template>
        </q-file>
        <q-list v-if="uploadedFiles.length > 0">
          <div class="text-h4 q-mt-xl q-mb-md">
            Uploaded Documents ({{ uploadedFiles.length }})
          </div>
          <q-item v-for="(file, index) in uploadedFiles" :key="index">
            <q-item-section>
              <q-btn
                @click="viewUpload(index)"
                color="primary"
                class="text-h5"
                style="max-width: 100%"
                align="left"
                dense
                flat
                no-caps
              >
                <div class="ellipsis">{{ file.name }}</div>
              </q-btn>
            </q-item-section>
            <q-item-section side>
              <q-btn
                @click="removeFile(index)"
                icon="fas fa-times"
                flat
                dense
              />
            </q-item-section>
          </q-item>
          <q-btn
            @click="submitDocs"
            label="Confirm Documents"
            class="full-width q-mt-md q-mb-lg"
            size="lg"
            color="primary"
          />
        </q-list>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import BaseDialogViewImage from 'src/components/BaseDialogViewImage.vue';
import DialogFormSubmitDocPreview from '../DialogFormSubmitDocPreview.vue';
import { ApplicantDocument } from 'src/utils/new-types';
import { Company, Form } from 'src/utils/types';

interface UploadedFile {
  name: string;
  file: File;
  downloadURL: string;
  angle?: 0 | 90 | 180 | 270;
}

const props = defineProps<{
  doc: ApplicantDocument & { id: string };
  form: Form & { id: string };
  company: Company;
}>();
const $q = useQuasar();
const files = ref<FileList | null>(null);
const uploadedFiles = ref<UploadedFile[]>([]);

onMounted(() => {
  console.log(props);
});

const addFiles = (value: FileList) => {
  console.log(value);
  for (const file of value) {
    const downloadURL = URL.createObjectURL(file);
    const uploadedFile: UploadedFile = {
      name: file.name,
      file,
      downloadURL,
    };
    uploadedFiles.value.push(uploadedFile);
  }
  files.value = null;
};

const removeFile = (index: number) => {
  uploadedFiles.value.splice(index, 1);
};

const viewUpload = (index: number) => {
  const uploadedFile = uploadedFiles.value[index];
  const { file, downloadURL } = uploadedFile;
  $q.dialog({
    component: BaseDialogViewImage,
    componentProps: {
      imgURL: downloadURL,
      contentType: file.type,
    },
  });
};

const submitDocs = () => {
  $q.dialog({
    component: DialogFormSubmitDocPreview,
    componentProps: {
      doc: props.doc,
      form: props.form,
      company: props.company,
      uploadedFiles: uploadedFiles.value,
    },
  }).onOk(() => {
    $q.notify({
      type: 'positive',
      message: `Successfully submitted ${props.doc.name}!`,
      position: 'top',
    });
    emit('changePage', props.doc.id, 'submitted');
  });
};

const emit = defineEmits<{
  (e: 'changePage', id: string, page: string): void;
}>();
</script>

<style lang="sass" scoped>
.upload-button
  border: 2px dashed #92b0b3
  border-radius: 25px
  outline-offset : -20px
</style>
