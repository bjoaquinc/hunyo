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
      <q-card-section>
        <div class="flex">
          <q-btn
            @click="returnToCamera"
            round
            icon="fas fa-chevron-left"
            color="white"
            no-caps
            flat
            dense
          />
        </div>
      </q-card-section>
      <div ref="containerRef" class="flex" style="height: 70%">
        <canvas
          class="full-width q-my-auto"
          :style="{ transform: `rotate(${angles[angleIndex]}deg)` }"
          ref="canvasRef"
        ></canvas>
      </div>
      <div
        class="row q-col-gutter-md q-mt-auto q-px-md absolute-bottom"
        style="bottom: 20px"
      >
        <div class="col">
          <q-btn
            @click="rotateLeft"
            class="full-width"
            icon="fas fa-rotate-left"
            color="white"
            outline
          />
        </div>
        <div class="col">
          <q-btn
            @click="rotateRight"
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

const props = defineProps<{
  image: {
    image: Blob;
    name: string;
    type: string;
    size: number;
  };
  imageBitmap: ImageBitmap;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const context = ref<CanvasRenderingContext2D | null>(null);
const angleIndex = ref(0);
const angles = [0, 90, 180, 270];

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const onDialogShow = async () => {
  if (props.imageBitmap && canvasRef.value) {
    drawCanvas(props.imageBitmap);
  }
};

const drawCanvas = (imageBitmap: ImageBitmap) => {
  if (!canvasRef.value) return;
  canvasRef.value.width = parseInt(
    getComputedStyle(canvasRef.value).width.split('px')[0]
  );
  const imageRatio = imageBitmap.width / imageBitmap.height;
  canvasRef.value.height = canvasRef.value.width / imageRatio;
  let ratio = Math.max(
    canvasRef.value.width / imageBitmap.width,
    canvasRef.value.height / imageBitmap.height
  );
  const x = (canvasRef.value.width - imageBitmap.width * ratio) / 2;
  const y = (canvasRef.value.height - imageBitmap.height * ratio) / 2;
  context.value = canvasRef.value.getContext('2d');
  if (context.value) {
    console.log(context.value);
    context.value.clearRect(
      0,
      0,
      canvasRef.value.width,
      canvasRef.value.height
    );
    context.value.drawImage(
      imageBitmap,
      0,
      0,
      imageBitmap.width,
      imageBitmap.height,
      x,
      y,
      imageBitmap.width * ratio,
      imageBitmap.height * ratio
    );
  }
};

const rotateRight = () => {
  if (angleIndex.value === angles.length - 1) {
    angleIndex.value = 0;
  } else {
    angleIndex.value++;
  }
};

const rotateLeft = () => {
  console.log(angleIndex.value);
  if (angleIndex.value === 0) {
    angleIndex.value = angles.length - 1;
  } else {
    angleIndex.value--;
  }
};

const returnToCamera = () => {
  onDialogCancel();
};

const onComplete = () => {
  onDialogOK({
    image: props.image,
    angle: angles[angleIndex.value],
  });
};

// const clearCanvas = () => {
//   canvasRef.value
//     ?.getContext('2d')
//     ?.clearRect(0, 0, window.innerWidth, window.innerHeight);
// };

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
