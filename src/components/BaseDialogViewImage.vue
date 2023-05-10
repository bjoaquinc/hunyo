<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    @show="onDialogShow"
    maximized
    persistent
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card
      style="max-width: 100% !important; max-height: 100vh"
      class="bg-black transparent"
    >
      <q-img
        ref="imageRef"
        v-if="contentType.includes('image')"
        class="image-width absolute-center"
        :style="
          angle
            ? isTilted
              ? {
                  transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                  width: 'auto',
                  height: '100vw',
                  aspectRatio: aspectRatio,
                }
              : { transform: `translate(-50%, -50%) rotate(${angle}deg)` }
            : {}
        "
        fit="contain"
        :src="props.imgURL"
      />
      <embed
        v-else
        class="image-width absolute-center"
        :src="props.imgURL"
        type="application/pdf"
        header="none"
      />
      <q-card-section style="height: 100vh" @click="dialogRef?.hide()">
        <div class="flex full-width">
          <q-btn
            class="q-ml-auto lt-sm text-black"
            icon="close"
            round
            dense
            color="white"
            @click="dialogRef?.hide()"
          />
          <q-btn
            class="q-ml-auto gt-xs text-black"
            icon="close"
            size="lg"
            round
            dense
            color="white"
            @click="dialogRef?.hide()"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { QDialog, useDialogPluginComponent, QImg } from 'quasar';
import { ref } from 'vue';

const props = defineProps<{
  imgURL: string;
  contentType: string;
  angle?: 0 | 90 | 180 | 270;
}>();

const { dialogRef, onDialogHide } = useDialogPluginComponent();
const isTilted = ref(false);
const aspectRatio = ref(0);
const imageRef = ref<QImg | null>(null);

const onDialogShow = () => {
  console.log(props);
  if (imageRef.value) {
    const width = imageRef.value.$el.clientWidth;
    const height = imageRef.value.$el.clientHeight;
    const TILTED_ANGLES = [90, 270];
    const PORTRAIT_IMAGE = height > width;
    if (PORTRAIT_IMAGE && TILTED_ANGLES.includes(props.angle || 0)) {
      aspectRatio.value = width / height;
      isTilted.value = true;
    }
  }
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
.image-width
  width: 100vw
  @media only screen and (width > $breakpoint-xs)
    width: auto
    height: 90vh
    aspect-ratio: 1/1
</style>
