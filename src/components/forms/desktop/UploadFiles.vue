<template>
  <!-- <q-page> -->
  <div class="full-width flex">
    <div class="q-mx-auto q-mt-xl" style="max-width: 680px">
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
            <q-btn @click="removeFile(index)" icon="fas fa-times" flat dense />
          </q-item-section>
        </q-item>
        <q-btn
          label="Submit Now"
          class="full-width q-mt-md"
          size="lg"
          color="primary"
        />
      </q-list>
    </div>
  </div>
  <!-- </q-page> -->
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import BaseDialogViewImage from 'src/components/BaseDialogViewImage.vue';
import { ApplicantDocument } from 'src/utils/new-types';

const props = defineProps<{
  doc: ApplicantDocument & { id: string };
}>();
const $q = useQuasar();
const files = ref<FileList | null>(null);
const uploadedFiles = ref<File[]>([]);

onMounted(() => {
  console.log(props);
});

const addFiles = (value: FileList) => {
  console.log(value);
  for (const file of value) {
    uploadedFiles.value.push(file);
  }
  files.value = null;
};

const removeFile = (index: number) => {
  uploadedFiles.value.splice(index, 1);
};

const viewUpload = (index: number) => {
  const file = uploadedFiles.value[index];
  const Url = URL.createObjectURL(file);
  $q.dialog({
    component: BaseDialogViewImage,
    componentProps: {
      imgURL: Url,
      contentType: file.type,
    },
  });
};
</script>

<style lang="sass" scoped>
.upload-button
  border: 2px dashed #92b0b3
  border-radius: 25px
  outline-offset : -20px
</style>
