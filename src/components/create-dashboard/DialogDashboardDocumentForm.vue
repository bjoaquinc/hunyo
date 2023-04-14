<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="width: 700px; max-width: 80vw">
      <q-card-section>
        <div class="flex justify-between">
          <div class="text-h5">
            {{ editDocDetails ? 'Edit' : 'Add' }} Document
          </div>
          <q-btn v-close-popup icon="fas fa-times" dense flat />
        </div>

        <q-separator class="q-my-md" />
        <q-form @submit.prevent="onSubmit" greedy>
          <div class="q-mt-md">
            <div class="q-gutter-md row">
              <q-input
                autofocus
                v-model="name"
                filled
                class="col"
                label="Document Name (Ex. Passport)"
                outlined
                :rules="[(val) => !!val || 'Please add a document name']"
              />
              <!-- <q-select
                v-model="format"
                :options="options"
                filled
                class="col"
                label="Format"
                outlined
                :rules="[
                  (val) =>
                    !!val || 'Please choose the format to receive the document',
                ]"
              /> -->
            </div>
            <div class="q-gutter-md row q-mt-xs">
              <q-select
                v-model="required"
                :options="requiredOptions"
                option-value="value"
                option-label="label"
                filled
                class="col"
                label="Is Required?"
                outlined
                :rules="[
                  (val) =>
                    !!val || 'Please choose if mandatory or if available',
                ]"
              />
              <q-file
                class="col"
                v-model="sample"
                filled
                :label="`${
                  editDocDetails && editDocDetails.sample ? 'Replace' : 'Upload'
                } Sample (Optional)`"
                accept="image/*,application/pdf"
                outlined
              >
                <template v-slot:prepend>
                  <q-icon name="fas fa-paperclip" />
                </template>
                <template v-slot:append>
                  <q-icon name="fas fa-plus" />
                </template>
              </q-file>
            </div>
            <div class="col q-mt-md">
              <q-input
                v-model="instructions"
                filled
                label="Add Instructions (Optional)"
                type="textarea"
                autogrow
                outlined
              />
            </div>
            <div class="col q-mt-md">
              <q-btn
                :loading="isLoading"
                type="submit"
                class="full-width"
                :label="editDocDetails ? 'Edit' : 'Done'"
                color="primary"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { deleteField, updateDoc } from '@firebase/firestore';
import { deleteObject, uploadBytes } from '@firebase/storage';
import { QDialog, useDialogPluginComponent } from 'quasar';
import { useUserStore } from 'src/stores/user-store';
import { dbDocRefs } from 'src/utils/db';
import { storageRefs } from 'src/utils/storage';
import { DashboardDoc } from 'src/utils/types';
import { ref, onMounted } from 'vue';

const props = defineProps<{
  dashboardId: string;
  lastDocNumber: number;
  editDocDetails?: {
    name: string;
    format: 'jpeg' | 'pdf';
    sample?: {
      file: string;
      contentType: string;
    };
    isRequired: boolean;
    instructions: string;
    docNumber: number;
  };
}>();

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const { user } = useUserStore();
const companyId = user?.company.id as string;
const name = ref('');
const format = ref<'jpeg' | 'pdf'>('pdf');
// const options = ['jpeg', 'pdf'];
const required = ref<{
  label: string;
  value: boolean;
}>({
  label: 'Mandatory',
  value: true,
});
const requiredOptions = [
  {
    label: 'If Available',
    value: false,
  },
  {
    label: 'Mandatory',
    value: true,
  },
];
const sample = ref<File | null>(null);
const instructions = ref('');
const isLoading = ref(false);

onMounted(() => {
  if (props.editDocDetails) {
    const {
      name: docName,
      format: docFormat,
      instructions: docInstructions,
      isRequired,
    } = props.editDocDetails;
    name.value = docName;
    format.value = docFormat;
    instructions.value = docInstructions;
    required.value =
      isRequired === true ? requiredOptions[1] : requiredOptions[0];
  }
});

const onSubmit = async () => {
  try {
    isLoading.value = true;
    const newDoc: DashboardDoc = {
      format: format.value as 'pdf' | 'jpeg',
      docNumber: props.lastDocNumber + 1,
      isRequired: (
        required.value as {
          label: string;
          value: boolean;
        }
      ).value,
    };
    const newSampleData = await uploadSampleToStorage();
    if (newSampleData) {
      newDoc.sample = newSampleData;
    }
    if (instructions.value) {
      newDoc.instructions = instructions.value;
    }
    if (props.editDocDetails) {
      newDoc.docNumber = props.editDocDetails.docNumber; // Retain the original doc number;
      await editDoc(newDoc);
    } else {
      await addDoc(newDoc);
    }
    onDialogOK('Adding payload to avoid error');
  } catch (error) {
    console.log(error);
  }
  isLoading.value = false;
};
const addDoc = async (newDoc: DashboardDoc) => {
  const dashboardRef = dbDocRefs.getDraftDashboardRef(
    companyId,
    props.dashboardId
  );
  await updateDoc(dashboardRef, {
    [`docs.${name.value}`]: newDoc,
  });
};

const editDoc = async (newDoc: DashboardDoc) => {
  if (!props.editDocDetails) return;
  const prevSample = props.editDocDetails?.sample;
  if (newDoc.sample && prevSample) {
    await removeSampleFromStorage(prevSample.file);
  } else if (!newDoc.sample && prevSample) {
    newDoc.sample = prevSample;
  }
  const dashboardRef = dbDocRefs.getDraftDashboardRef(
    companyId,
    props.dashboardId
  );
  if (name.value && props.editDocDetails.name !== name.value) {
    await updateDoc(dashboardRef, {
      [`docs.${name.value}`]: newDoc,
      [`docs.${props.editDocDetails.name}`]: deleteField(),
    });
  } else {
    await updateDoc(dashboardRef, {
      [`docs.${props.editDocDetails.name}`]: newDoc,
    });
  }
};

const uploadSampleToStorage = async () => {
  if (!sample.value) return null;
  const contentType = sample.value.type;
  const sampleName = `sample_${name.value}`;
  const storageRef = storageRefs.getNewSampleRef(
    companyId,
    props.dashboardId,
    sampleName
  );
  await uploadBytes(storageRef, sample.value, {
    contentType,
  });
  return {
    file: sampleName,
    contentType,
  };
};

const removeSampleFromStorage = async (sampleName: string) => {
  const storageRef = storageRefs.getSampleRef(
    companyId,
    props.dashboardId,
    sampleName
  );
  await deleteObject(storageRef);
};

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);
</script>
