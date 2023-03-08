<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" maximized persistent>
    <q-layout view="hHr lpR fFf" container>
      <q-header class="bg-white text-grey-8" bordered>
        <q-toolbar>
          <q-btn
            icon="fas fa-arrow-left"
            color="primary"
            flat
            dense
            class="q-ml-sm"
          />
          <div class="text-h5 q-ml-auto">{{ applicantDocument.name }}</div>

          <q-btn
            class="q-ml-auto"
            dense
            flat
            round
            icon="menu"
            @click="drawerRight = !drawerRight"
          />
        </q-toolbar>
      </q-header>

      <q-drawer show-if-above v-model="drawerRight" side="right" bordered>
        <q-list class="q-pa-md">
          <div class="text-h5 q-mb-md">Page 1 of 7</div>
          <q-separator />
          <q-item clickable v-ripple class="bg-positive">
            <q-item-section>
              <q-item-label class="text-subtitle1 text-white text-weight-bold"
                >Accept Page 1</q-item-label
              >
            </q-item-section>
            <q-item-section avatar side>
              <q-icon name="fas fa-check" color="white" />
            </q-item-section>
          </q-item>
          <q-item clickable v-ripple class="bg-negative q-mt-md">
            <q-item-section>
              <q-item-label class="text-subtitle1 text-white text-weight-bold"
                >Reject Page 1</q-item-label
              >
            </q-item-section>
            <q-item-section avatar side>
              <q-icon name="fas fa-times" color="white" />
            </q-item-section>
          </q-item>
          <q-item clickable v-ripple class="bg-grey-8 q-mt-md">
            <q-item-section>
              <q-item-label class="text-subtitle1 text-white text-weight-bold"
                >Download Page 1</q-item-label
              >
            </q-item-section>
            <q-item-section avatar side>
              <q-icon name="fas fa-arrow-down" color="white" />
            </q-item-section>
          </q-item>
          <q-item
            @click="showOptions = !showOptions"
            clickable
            v-ripple
            class="q-mt-md"
          >
            <q-item-section>
              <q-item-label class="text-subtitle1 text-grey-8 text-weight-bold"
                >More Options</q-item-label
              >
            </q-item-section>
            <q-item-section avatar side>
              <q-icon
                :name="`fas fa-chevron-${showOptions ? 'up' : 'down'}`"
                color="grey-8"
              />
            </q-item-section>
          </q-item>
          <q-separator />
        </q-list>
        <q-slide-transition>
          <q-list
            v-show="showOptions"
            class="q-pa-md"
            style="padding-top: 0 !important"
            separator
          >
            <q-item
              class="text-subtitle1 text-weight-bold text-positive"
              clickable
              v-ripple
            >
              <q-item-section>
                <q-item-label> Accept All </q-item-label>
              </q-item-section>
              <q-item-section avatar side>
                <q-icon name="fas fa-check-double" />
              </q-item-section>
            </q-item>
            <q-item
              class="text-subtitle1 text-weight-bold text-negative"
              clickable
              v-ripple
            >
              <q-item-section>
                <q-item-label> Reject All </q-item-label>
              </q-item-section>
              <q-item-section avatar side>
                <q-icon name="fas fa-times" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-slide-transition>
      </q-drawer>

      <q-page-container>
        <q-page class="bg-white">
          <div
            class="bg-white full-width"
            style="position: absolute; top: 0; bottom: 0"
          >
            <q-btn
              v-if="slide > 1"
              @click="slide--"
              outline
              round
              class="nav-left"
              color="primary"
              icon="fas fa-chevron-left"
              size="lg"
            />
            <q-btn
              v-if="slide < 4"
              @click="slide++"
              outline
              round
              class="nav-right"
              color="primary"
              icon="fas fa-chevron-right"
              size="lg"
            />
            <div
              class="q-pa-md flex justify-center"
              style="max-height: 100%; overflow: auto !important"
            >
              <q-carousel
                style="height: 100%; width: 80%"
                animated
                v-model="slide"
                control-color="primary"
                transition-prev="slide-right"
                transition-next="slide-left"
              >
                <q-carousel-slide :name="1" class="column no-wrap flex-center">
                  <q-img
                    src="https://images.unsplash.com/photo-1677461404800-55ba48012cce?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1887&q=80"
                  />
                </q-carousel-slide>
                <q-carousel-slide :name="2" class="column no-wrap flex-center">
                  <q-img
                    src="https://images.unsplash.com/photo-1677461404800-55ba48012cce?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1887&q=80"
                  />
                </q-carousel-slide>
                <q-carousel-slide :name="3" class="column no-wrap flex-center">
                  <q-img
                    src="https://images.unsplash.com/photo-1677461404800-55ba48012cce?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1887&q=80"
                  />
                </q-carousel-slide>
                <q-carousel-slide :name="4" class="column no-wrap flex-center">
                  <q-img
                    src="https://images.unsplash.com/photo-1677461404800-55ba48012cce?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1887&q=80"
                  />
                </q-carousel-slide>
              </q-carousel>
            </div>
          </div>
        </q-page>
      </q-page-container>
    </q-layout>
  </q-dialog>
</template>

<script setup lang="ts">
import { QDialog, useDialogPluginComponent } from 'quasar';
import { ref } from 'vue';
import { ApplicantDocument } from 'src/utils/new-types';

const { dialogRef, onDialogHide } = useDialogPluginComponent();
const drawerRight = ref(true);
const slide = ref(1);
const showOptions = ref(false);

defineProps<{
  applicantDocument: ApplicantDocument;
}>();

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);
</script>

<style lang="sass" scoped>
.nav-left
  position: absolute
  top: calc(50% - 25.7px)
  left: 44px
.nav-right
  position: absolute
  top: calc(50% - 25.7px)
  right: 60px
</style>
