<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    @show="onDialogShow"
    maximized
    :persistent="isLoading"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="card-container text-grey-8">
      <q-form @submit.prevent="updateImageProperties" greedy>
        <q-card-section>
          <div class="flex items-center justify-between">
            <div class="text-h5">Edit Image Properties</div>
            <q-btn v-close-popup icon="fas fa-times" flat color="grey-8" />
          </div>

          <q-separator class="q-my-md" />
          <div class="row q-col-gutter-md">
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
              <q-checkbox
                v-model="imageProperties.normalise"
                label="Normalise"
              />
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
                type="submit"
                class="full-width"
                color="primary"
              />
            </div>
          </div>
        </q-card-section>
        <q-inner-loading :showing="isLoading">
          <q-spinner-pie size="80px" color="primary" />
        </q-inner-loading>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { QDialog, useDialogPluginComponent, useQuasar } from 'quasar';
import { ref } from 'vue';
import {
  ApplicantPage,
  ApplicantPageImageProperties,
} from 'src/utils/new-types';
import { dbDocRefs } from 'src/utils/db';
import { updateDoc } from 'firebase/firestore';

const props = defineProps<{
  page: ApplicantPage & { id: string };
}>();

const $q = useQuasar();
const isLoading = ref(false);

// interface ImageProperties {
//   brightness: string;
//   contrast: string;
//   sharpness: string;
//   rotateRight: { label: string; value: number };
//   normalise: boolean;
//   clahe: boolean;
// }

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

const setOriginalImageProperties = () => {
  imageProperties.value = originalImageProperties;
};

const setQuickFixImageProperties = () => {
  imageProperties.value = quickFixImageProperties;
};

const onDialogShow = () => {
  if (props.page.imageProperties) {
    const { brightness, contrast, sharpness, rotateRight, normalise, clahe } =
      props.page.imageProperties;
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
};

const updateImageProperties = async () =>
  // properties: ApplicantPageImageProperties
  {
    try {
      isLoading.value = true;
      const pageRef = dbDocRefs.getPageRef(props.page.companyId, props.page.id);
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
      dialogRef.value?.hide();
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

const { dialogRef, onDialogHide } = useDialogPluginComponent();

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
