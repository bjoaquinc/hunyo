<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    persistent
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card
      style="max-width: 100% !important; max-height: 100vh"
      class="bg-black transparent"
    >
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
      <q-img
        v-if="contentType === 'image/jpeg'"
        class="image-width absolute-center"
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
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { QDialog, useDialogPluginComponent } from 'quasar';

const props = defineProps<{
  imgURL: string;
  contentType: string;
}>();

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
.image-width
  width: 100vw
  @media only screen and (width > $breakpoint-xs)
    width: auto
    height: 90vh
    aspect-ratio: 1/1
</style>