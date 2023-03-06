<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="card-container text-grey-8">
      <q-form greedy>
        <q-card-section>
          <div class="flex">
            <div class="text-h5 gt-xs">Select one</div>
            <div class="text-h6 lt-sm">Select one</div>
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

          <q-btn
            @click="onDialogOK('available')"
            size="lg"
            class="q-mt-lg full-width"
            outline
            no-caps
            color="primary"
            :label="`I have my ${doc.name}`"
          />
          <q-btn
            @click="onDialogOK('not-available')"
            size="lg"
            class="q-mt-lg full-width"
            outline
            no-caps
            color="primary"
            :label="`I'm waiting to receive my ${doc.name}`"
          />
          <q-btn
            @click="changeStatusToNotApplicable"
            size="lg"
            class="q-mt-lg full-width"
            outline
            no-caps
            color="primary"
            :label="`${doc.name} does not apply to me`"
          />
        </q-card-section>
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
import { ApplicantDocument } from 'src/utils/new-types';
import { ref } from 'vue';

const props = defineProps<{
  doc: ApplicantDocument & { id: string };
  formId: string;
}>();

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const isLoading = ref(false);

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);

const changeStatusToNotApplicable = async () => {
  isLoading.value = true;
  const docRef = dbDocRefs.getDocumentRef(props.doc.companyId, props.doc.id);
  await updateDoc(docRef, {
    status: 'not-applicable',
  });
  onDialogOK('not-applicable');
  isLoading.value = false;
};
</script>

<style lang="sass" scoped>
.card-container
  @media only screen and (width > $breakpoint-xs)
    max-width: 600px !important
    height: auto !important
</style>
