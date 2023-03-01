<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    maximized
    :persistent="isLoading"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="card-container text-grey-8">
      <q-form @submit.prevent="onSubmit" greedy>
        <q-card-section>
          <div class="flex justify-between q-mt-sm no-wrap">
            <div class="text-h5 gt-xs">
              <span class="q-mr-md"
                >Upload {{ capsFirstLetters(doc.name) }}</span
              >
              <q-btn
                @click="openEditDocDialog"
                class="q-mr-md"
                outline
                color="primary"
                label="Edit"
              />
              <q-btn
                :loading="isRemoving"
                @click="removeDoc"
                outline
                color="negative"
                label="Remove"
              />
            </div>
            <div class="text-h6 lt-sm">
              Upload {{ capsFirstLetters(doc.name) }}
            </div>
            <q-btn v-close-popup icon="fas fa-times" flat dense />
          </div>
          <q-item
            class="text-body1 q-mt-md"
            v-if="doc.instructions || sampleURL"
          >
            <q-item-section avatar class="gt-xs" top side>
              <q-icon name="fas fa-exclamation" size="xs" />
            </q-item-section>
            <q-item-section>
              <div class="flex column">
                <div v-if="doc.instructions" style="white-space: pre-line">
                  {{ doc.instructions }}
                </div>
                <q-btn
                  v-if="sampleURL"
                  :href="sampleURL"
                  target="_blank"
                  :class="doc.instructions ? 'q-mt-md' : ''"
                  label="See Sample"
                  no-caps
                  outline
                />
              </div>
            </q-item-section>
          </q-item>

          <q-separator class="q-my-md" />
          <div class="row q-mt-xs">
            <div class="col">
              <q-file
                @click.prevent="null"
                :reactive-rules="true"
                standout
                label="ADD IMAGE OR FILE"
                filled
                outlined
                class="rounded-borders"
              >
                <q-tooltip class="bg-negative text-body2">
                  Only for applicants
                </q-tooltip>
                <template v-slot:prepend>
                  <q-icon name="fas fa-file-arrow-up" />
                </template>
                <template v-slot:append>
                  <q-icon name="fas fa-plus" />
                </template>
              </q-file>
            </div>
          </div>
        </q-card-section>
        <q-card-actions>
          <q-btn
            label="Submit"
            type="submit"
            class="full-width"
            color="primary"
          >
            <q-tooltip class="bg-negative text-body2">
              Only for applicants
            </q-tooltip>
          </q-btn>
        </q-card-actions>
        <q-inner-loading :showing="isLoading">
          <q-spinner-pie size="80px" color="primary" />
        </q-inner-loading>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { deleteField, updateDoc } from '@firebase/firestore';
import { deleteObject, getDownloadURL } from '@firebase/storage';
import { QDialog, QFile, useDialogPluginComponent, useQuasar } from 'quasar';
import { useUserStore } from 'src/stores/user-store';
import { dbDocRefs } from 'src/utils/db';
import { storageRefs } from 'src/utils/storage';
import { ref, onMounted } from 'vue';
import { capsFirstLetters } from './helpers';
import { DashboardDoc } from 'src/utils/types';
import DialogDashboardDocumentForm from './DialogDashboardDocumentForm.vue';

const { dialogRef, onDialogHide } = useDialogPluginComponent();
const q = useQuasar();
const props = defineProps<{
  doc: DashboardDoc & { name: string };
  dashboardId: string;
  lastDocNumber: number;
}>();
defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);
const { user } = useUserStore();
const companyId = user?.company.id as string;
const isLoading = ref(false);
const isRemoving = ref(false);
const sampleURL = ref('');

onMounted(async () => {
  if (props.doc.sample) {
    await getSampleURL(props.doc.sample.file);
  }
});

const getSampleURL = async (sampleName: string) => {
  if (!user) return;
  const sampleRef = storageRefs.getNewSampleRef(
    user.company.id,
    props.dashboardId,
    sampleName
  );
  const url = await getDownloadURL(sampleRef);
  sampleURL.value = url;
};

const onSubmit = () => {
  console.log('Submit');
};

const openEditDocDialog = () => {
  q.dialog({
    component: DialogDashboardDocumentForm,
    componentProps: {
      dashboardId: props.dashboardId,
      editDocDetails: props.doc,
      lastDocNumber: props.lastDocNumber,
    },
  }).onOk(() => {
    dialogRef.value?.hide();
  });
};

const removeDoc = async () => {
  isRemoving.value = true;
  const dashboardRef = dbDocRefs.getDraftDashboardRef(
    companyId,
    props.dashboardId
  );
  if (props.doc.sample) {
    await removeSampleFromStorage(props.doc.sample.file);
  }
  await updateDoc(dashboardRef, {
    [`docs.${props.doc.name}`]: deleteField(),
  });
  isRemoving.value = false;
  dialogRef.value?.hide();
};

const removeSampleFromStorage = async (sampleName: string) => {
  const sampleRef = storageRefs.getNewSampleRef(
    companyId,
    props.dashboardId,
    sampleName
  );
  await deleteObject(sampleRef);
};
</script>

<style lang="sass" scoped>
.card-container
  @media only screen and (width > $breakpoint-xs)
    max-width: 600px !important
    height: auto !important
</style>
