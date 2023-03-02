<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    persistent
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="card-container text-grey-8">
      <q-form @submit.prevent="onSubmit" greedy>
        <q-card-section>
          <q-img :src="logo" class="q-mb-md" width="200px" loading="eager" />
          <div class="text-h5 gt-xs">Please confirm your name:</div>
          <div class="text-h6 lt-sm">Please confirm your name:</div>

          <q-separator class="q-my-md" />

          <q-input
            class="q-mt-sm"
            name="firstName"
            autocomplete="given-name"
            :rules="[(val) => !!val || 'This field is required']"
            label="First Name(s)"
            filled
            v-model="name.first"
          />
          <q-input
            class="q-mt-sm"
            name="middleName"
            autocomplete="additional-name"
            :rules="[(val) => !!val || 'This field is required']"
            label="Full Middle Name (not initials)"
            filled
            v-model="name.middle"
          />
          <q-input
            class="q-mt-sm"
            name="lastName"
            autocomplete="family-name"
            :rules="[(val) => !!val || 'This field is required']"
            label="Last Name"
            filled
            v-model="name.last"
          />
        </q-card-section>
        <q-card-actions>
          <q-btn
            label="Confirm"
            type="submit"
            class="full-width"
            color="primary"
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
import { updateDoc } from '@firebase/firestore';
import { QDialog, useDialogPluginComponent } from 'quasar';
import { dbDocRefs } from 'src/utils/db';
import { ref } from 'vue';

const props = defineProps<{
  formId: string;
  logo: string;
}>();

const { dialogRef, onDialogHide } = useDialogPluginComponent();
const isLoading = ref(false);
const name = ref({
  first: '',
  middle: '',
  last: '',
});

const onSubmit = async () => {
  isLoading.value = true;
  try {
    const formRef = dbDocRefs.getFormRef(props.formId);
    await updateDoc(formRef, {
      'applicant.name': name.value,
    });
    dialogRef.value?.hide();
  } catch (error) {
    console.log(error);
  }
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
