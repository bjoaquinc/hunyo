<template>
  <div>
    <q-form @submit.prevent="updateImageProperties" greedy>
      <div class="flex items-center justify-between">
        <div class="text-h6">Edit Image Properties</div>
        <q-btn
          @click="emit('exitUpdateImageProperties')"
          icon="fas fa-times"
          flat
          dense
          color="grey-8"
        />
      </div>
      <div class="row q-col-gutter-md q-mt-sm">
        <div class="col-6">
          <q-input
            v-model="imageProperties.brightness"
            accept
            name="Brightness"
            label="Brightness"
            filled
          />
        </div>
        <div class="col-6">
          <q-input
            v-model="imageProperties.contrast"
            name="Contrast"
            label="Contrast"
            filled
          />
        </div>
        <div class="col-6">
          <q-input
            v-model="imageProperties.sharpness"
            name="Sharpness"
            label="Sharpness"
            filled
          />
        </div>
        <div class="col-6">
          <q-select
            v-model="imageProperties.rotateRight"
            :options="rotateOptions"
            name="Rotation"
            label="Rotate Right"
            filled
          />
        </div>
        <div class="col-6">
          <q-checkbox v-model="imageProperties.normalise" label="Normalise" />
        </div>
        <div class="col-6">
          <q-checkbox v-model="imageProperties.clahe" label="Clahe" />
        </div>
        <div class="col-6">
          <q-btn
            @click="setOriginalImageProperties"
            label="Original Image"
            class="full-width"
            color="primary"
            outline
          />
        </div>
        <div class="col-6">
          <q-btn
            @click="setQuickFixImageProperties"
            label="Quick Fix"
            class="full-width"
            color="primary"
            outline
          />
        </div>
        <div class="col-12">
          <q-btn
            label="Update Image Properties"
            :loading="isLoading"
            type="submit"
            class="full-width"
            color="primary"
          />
        </div>
      </div>
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { dbDocRefs } from 'src/utils/db';
import { updateDoc } from 'firebase/firestore';
import {
  ApplicantPage,
  ApplicantPageImageProperties,
} from 'src/utils/new-types';
import { useQuasar } from 'quasar';

const props = defineProps<{
  selectedPage: (ApplicantPage & { id: string }) | null;
}>();
const $q = useQuasar();
const imageProperties = ref({
  brightness: '1.2',
  contrast: '1',
  sharpness: '0',
  rotateRight: { label: '0°', value: 0 },
  normalise: true,
  clahe: false,
});
const rotateOptions = [
  { label: '0°', value: 0 },
  { label: '90°', value: 90 },
  { label: '180°', value: 180 },
  { label: '270°', value: 270 },
];
const originalImageProperties = {
  brightness: '1',
  contrast: '1',
  sharpness: '',
  rotateRight: { label: '0°', value: 0 },
  normalise: false,
  clahe: false,
};
const quickFixImageProperties = {
  brightness: '1.3',
  contrast: '1.2',
  sharpness: '1',
  rotateRight: { label: '0°', value: 0 },
  normalise: false,
  clahe: false,
};
const isLoading = ref(false);

onMounted(() => {
  if (!props.selectedPage) throw new Error('No selected page.');
  if (props.selectedPage.imageProperties) {
    const { brightness, contrast, sharpness, rotateRight, normalise, clahe } =
      props.selectedPage.imageProperties;
    const rotateValue = rotateOptions.find(
      (option) => option.value === Number(rotateRight)
    );
    imageProperties.value = {
      brightness: brightness ? brightness : '1.2',
      contrast: contrast ? contrast : '1',
      sharpness: sharpness ? sharpness : '0',
      rotateRight: rotateValue ? rotateValue : { label: '0°', value: 0 },
      normalise,
      clahe,
    };
  }
});

const setOriginalImageProperties = () => {
  imageProperties.value = originalImageProperties;
};

const setQuickFixImageProperties = () => {
  imageProperties.value = quickFixImageProperties;
};

const updateImageProperties = async () => {
  if (!props.selectedPage) throw new Error('No selected page.');
  try {
    isLoading.value = true;
    const pageRef = dbDocRefs.getPageRef(
      props.selectedPage.companyId,
      props.selectedPage.id
    );
    const { brightness, contrast, sharpness, rotateRight, normalise, clahe } =
      imageProperties.value;
    console.log(brightness);
    const updatedImageProperties: ApplicantPageImageProperties = {
      brightness,
      contrast,
      rotateRight: rotateRight.value.toString() as '0' | '90' | '180' | '270',
      normalise,
      clahe,
    };
    if (sharpness) updatedImageProperties.sharpness = sharpness;
    await updateDoc(pageRef, {
      imageProperties: updatedImageProperties,
      updatingFixedImage: true,
    });
    // dialogRef.value?.hide();
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Something went wrong. Please try again.',
    });
  } finally {
    isLoading.value = false;
  }
};

const emit = defineEmits<{
  (e: 'exitUpdateImageProperties'): void;
}>();
</script>

<style scoped></style>