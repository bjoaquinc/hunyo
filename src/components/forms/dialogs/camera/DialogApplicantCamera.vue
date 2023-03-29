<template>
  <q-dialog
    ref="dialogRef"
    @show="onDialogShow"
    @hide="onDialogHide"
    maximized
    transition-show="slide-left"
    transition-hide="slide-right"
  >
    <div v-show="showShutter" id="shutter" ref="shutterRef" />
    <q-card tag="div" class="card-container text-white bg-black">
      <q-btn
        v-close-popup
        round
        class="q-ml-auto exit-btn"
        icon="fas fa-times"
        color="white"
        flat
      />
      <div class="flex" style="height: 70%">
        <div ref="containerRef" class="full-width q-my-auto">
          <div ref="maskRef" class="mask" />
          <video
            v-show="isStreaming"
            class="bg-black"
            ref="videoRef"
            @canplay="
              (evt) => {
                onCanPlay(evt);
              }
            "
          >
            Video stream not available
          </video>
        </div>
      </div>
      <q-btn
        @click="takePhoto"
        outline
        round
        icon="fas fa-circle"
        size="xl"
        class="capture-btn"
        color="white"
        dense
        style="z-index: 1000"
      />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import {
  QDialog,
  useDialogPluginComponent,
  dom,
  QCard,
  uid,
  useQuasar,
} from 'quasar';
import 'image-capture';
import { ApplicantDocument } from 'src/utils/new-types';
import DialogApplicantCameraImage from './DialogApplicantCameraImage.vue';

const props = defineProps<{
  doc: ApplicantDocument & { id: string };
}>();

const $q = useQuasar();
const containerRef = ref<HTMLDivElement | null>(null);
const shutterRef = ref<HTMLDivElement | null>(null);
const showShutter = ref(false);
const audio = new Audio('camera-shutter-click.mp3');
const videoRef = ref<HTMLVideoElement | null>(null);
const maskRef = ref<HTMLDivElement | null>(null);

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const isStreaming = ref(false);
const imageCapture = ref<ImageCapture | null>(null);
const videoDevice = ref<MediaStreamTrack | null>(null);
const image = ref<{
  image: Blob;
  name: string;
  type: string;
  size: number;
} | null>(null);

const onDialogShow = async () => {
  try {
    await setUpCamera();
  } catch (err) {
    console.log(err);
  }
};

const setUpCamera = async () => {
  if (videoRef.value && containerRef.value) {
    const BACK_CAMERA = 'environment';
    // eslint-disable-next-line no-undef
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { exact: BACK_CAMERA },
        width: { min: 1280, ideal: 1920, max: 2560 },
        aspectRatio: { ideal: 5 / 4 },
      },
    };
    const { mediaDevices } = navigator;
    const mediaStream = await mediaDevices.getUserMedia(constraints);
    console.log(mediaStream);
    videoDevice.value = mediaStream.getVideoTracks()[0];
    imageCapture.value = new ImageCapture(videoDevice.value);
    videoRef.value.srcObject = mediaStream;

    // Add these three attributes to avoid the video freezing in the first frame
    videoRef.value.setAttribute('autoplay', '');
    videoRef.value.setAttribute('muted', '');
    videoRef.value.setAttribute('playsinline', '');

    videoRef.value.play();
  }
};

const onCanPlay = (evt: Event) => {
  if (!videoRef.value || !containerRef.value) return;
  const { videoWidth, videoHeight } = evt.target as HTMLVideoElement;
  setVideoWidthAndHeight(videoWidth, videoHeight);
};

const setVideoWidthAndHeight = (videoWidth: number, videoHeight: number) => {
  if (
    !isStreaming.value &&
    videoRef.value &&
    containerRef.value &&
    maskRef.value
  ) {
    const { width } = dom;
    const containerWidth = width(containerRef.value);
    const videoRatio = videoWidth / videoHeight;
    const height = containerWidth / videoRatio;
    videoRef.value.setAttribute('width', containerWidth.toString());
    videoRef.value.setAttribute('height', height.toString());
    maskRef.value.style.height = height.toString() + 'px';
    isStreaming.value = true;
  }
};

const takePhoto = async () => {
  if (!imageCapture.value || !shutterRef.value) return;
  audio.play();
  showShutter.value = true;
  shutterRef.value.className += ' on';
  setTimeout(() => {
    if (!shutterRef.value) return;
    shutterRef.value.className = shutterRef.value.className.replace(' on', '');
    showShutter.value = false;
  }, 30 * 2 + 45); // double the shutter speed + 45ms for the transition
  const imageBlob = await imageCapture.value.takePhoto();
  image.value = {
    image: imageBlob,
    name: props.doc.name + '-' + uid(),
    type: imageBlob.type,
    size: imageBlob.size,
  };
  const imageBitMap = await createImageBitmap(imageBlob);
  isStreaming.value = false;
  stopCamera();
  openDialogApplicantCameraImage(imageBitMap);
};

const openDialogApplicantCameraImage = (imageBitmap: ImageBitmap) => {
  $q.dialog({
    component: DialogApplicantCameraImage,
    componentProps: {
      image: image.value,
      imageBitmap,
    },
  })
    .onOk(
      (payload: {
        image: {
          image: Blob;
          name: string;
          type: string;
          size: number;
        };
        angle: '0' | '270' | '180' | '270';
      }) => {
        onDialogOK(payload);
        dialogRef.value?.hide();
      }
    )
    .onCancel(async () => {
      await setUpCamera();
    });
};

const stopCamera = () => {
  videoDevice.value?.stop();
};

onUnmounted(() => {
  stopCamera();
});

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

.exit-btn
  position: absolute
  top: 10px
  right: 10px
  z-index: 1000
  background-color: rgba(0, 0, 0, 0.5)

.capture-btn
  position: absolute
  bottom: 30px
  left: calc(50% - 28.75px)

#shutter
  width: 100vw
  height: 100vh
  opacity: 0
  transition: all 30ms ease-in
  background-color: white

#shutter.on
  opacity: 1
  z-index: 1000

.mask
  position: absolute
  width: 100%
  border: 30px solid black
  z-index: 2
  opacity: 0.5
</style>
