<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="card-container text-grey-8">
      <q-form @submit.prevent="onSubmit" greedy>
        <q-card-section>
          <div class="flex">
            <div class="text-h5 gt-xs">
              When can you submit your {{ docName }}?
            </div>
            <div class="text-h6 lt-sm">
              When can you submit your {{ docName }}?
            </div>
            <q-btn
              v-close-popup
              round
              class="q-ml-auto"
              icon="fas fa-times"
              color="grey-8"
              flat
              dense
            />
          </div>

          <q-separator class="q-my-md" />

          <div class="text-subtitle1 text-italic">
            If you don't know the exact date, give an approximate date.
          </div>
          <q-input
            class="q-mt-md"
            placeholder="YYYY-MM-DD"
            filled
            v-model="date"
            mask="date"
            :rules="[
              (val) => !!val || 'This field is required',
              (val, rules) => rules.date(val) || 'Invalid date',
              (val) =>
                dateIsGreaterThanToday(val) ||
                'Date must be greater than today',
            ]"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <q-date
                    v-model="date"
                    :options="(date) => dateIsGreaterThanToday(date)"
                  >
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </q-card-section>
        <q-card-actions>
          <q-btn
            type="submit"
            label="Done"
            color="primary"
            class="full-width"
          />
        </q-card-actions>
        <q-inner-loading :showing="isLoading">
          <q-spinner-pie size="80px" color="primary" />
        </q-inner-loading>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { QDialog, useDialogPluginComponent } from 'quasar';
import { ref } from 'vue';
import { DateTime } from 'luxon';

const date = ref('');
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const isLoading = ref(false);
const dateIsGreaterThanToday = (date: string) => {
  const today = DateTime.now().toFormat('yyyy/MM/dd');
  return date > today;
};

defineProps<{
  docName: string;
}>();

const onSubmit = () => {
  isLoading.value = true;
  onDialogOK();
  isLoading.value = false;
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
</style>
