<template>
  <q-dialog
    ref="dialogRef"
    @show="onDialogShow"
    @hide="onDialogHide"
    maximized
    transition-show="slide-left"
    transition-hide="slide-right"
  >
    <q-card tag="div" class="card-container text-white bg-black">
      <q-btn
        @click="exitPage"
        class="back-btn"
        round
        icon="fas fa-chevron-left"
        color="white"
        no-caps
        flat
      />
      <div ref="containerRef" class="flex full-height">
        <img
          ref="imageRef"
          :src="IMAGE_URL"
          class="image-container"
          style="margin: auto"
          :style="
            isTilted && !isLandscape
              ? {
                  width: 'auto',
                  height: '100vw',
                  aspectRatio: aspectRatio,
                  transform: `rotate(${angles[angleIndex]}deg)`,
                }
              : {
                  transform: `rotate(${angles[angleIndex]}deg)`,
                  width: '100%',
                  height: 'auto',
                }
          "
        />
      </div>
      <div
        class="row q-col-gutter-md q-pb-md q-px-md absolute-bottom"
        style="background-color: rgba(0, 0, 0, 0.5)"
      >
        <div class="col">
          <q-btn
            @click="rotateImage('left')"
            class="full-width"
            icon="fas fa-rotate-left"
            color="white"
            outline
          />
        </div>
        <div class="col">
          <q-btn
            @click="rotateImage('right')"
            class="full-width"
            icon="fas fa-rotate-right"
            color="white"
            outline
          />
        </div>
        <div class="col">
          <q-btn
            @click="onComplete"
            class="full-width"
            label="Done"
            color="primary"
          />
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { QDialog, useDialogPluginComponent, QCard } from 'quasar';
import { ApplicantDocument } from 'src/utils/new-types';

const props = defineProps<{
  file: File;
  IMAGE_URL: string;
  doc: ApplicantDocument & { id: string };
  latestIndex: number;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const angleIndex = ref(0);
const angles = [0, 90, 180, 270];
const imageRef = ref<HTMLImageElement | null>(null);
const aspectRatio = ref(0);
const isTilted = ref(false);
const isLandscape = ref(false);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const onDialogShow = async () => {
  if (imageRef.value && containerRef.value) {
    const { width, height } = imageRef.value;
    containerRef.value.setAttribute('style', `height: ${height}px`);
    aspectRatio.value = width / height;
    if (width > height) {
      isLandscape.value = true;
    }
  }
};

const rotateImage = (direction: 'left' | 'right') => {
  if (!imageRef.value) return;
  if (direction === 'left') {
    if (angleIndex.value === 0) {
      angleIndex.value = angles.length - 1;
    } else {
      angleIndex.value--;
    }
  } else {
    if (angleIndex.value === angles.length - 1) {
      angleIndex.value = 0;
    } else {
      angleIndex.value++;
    }
  }
  const TILTED_ANGLE_INDEXES = [1, 3];
  if (TILTED_ANGLE_INDEXES.includes(angleIndex.value)) {
    isTilted.value = true;
  } else {
    isTilted.value = false;
  }
};

const exitPage = () => {
  onDialogCancel();
};

const onComplete = () => {
  const docName = props.doc.name.replace(' ', '_').toLowerCase();
  const newFileName = `${docName}_image_${props.latestIndex + 1}.jpg`;
  const updatedFile = new File([props.file], newFileName, {
    type: 'image/jpeg',
  });
  onDialogOK({
    image: updatedFile,
    angle: angles[angleIndex.value],
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


.back-btn
  position: absolute
  top: 10px
  left: 10px
  z-index: 2
  background-color: rgba(0, 0, 0, 0.5)
</style>
