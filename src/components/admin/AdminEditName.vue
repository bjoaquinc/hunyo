<template>
  <div>
    <q-form @submit.prevent="updateName" greedy>
      <div class="flex items-center justify-between">
        <div class="text-h6">Edit Name</div>
        <q-btn
          @click="emit('exitUpdateName')"
          icon="fas fa-times"
          flat
          dense
          color="grey-8"
        />
      </div>
      <div class="row q-gutter-sm q-mr-sm q-mt-sm">
        <div class="col-12">
          <q-input
            :rules="[(val) => !!val || 'This field is required']"
            v-model="updatedName.first"
            label="First Name"
            filled
            dense
          />
        </div>
        <div class="col-12">
          <q-input
            :rules="[(val) => !!val || 'This field is required']"
            v-model="updatedName.middle"
            label="Middle Name"
            filled
            dense
          />
        </div>
        <div class="col-12">
          <q-input
            :rules="[(val) => !!val || 'This field is required']"
            v-model="updatedName.last"
            label="Last Name"
            filled
            dense
          />
        </div>
        <div class="col-12">
          <q-btn
            :loading="isUpdatingName"
            type="submit"
            label="Update Name"
            color="primary"
            class="full-width"
          />
        </div>
      </div>
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Form } from 'src/utils/types';
import { dbDocRefs } from 'src/utils/db';
import { updateDoc } from 'firebase/firestore';

const props = defineProps<{
  selectedApplicant: (Form & { id: string }) | null;
}>();

onMounted(() => {
  if (!props.selectedApplicant) throw new Error('No applicant selected');
  const CURRENT_NAME = props.selectedApplicant.applicant.name;
  if (CURRENT_NAME) {
    updatedName.value = CURRENT_NAME;
  } else {
    throw new Error('No name found for applicant');
  }
});

const updatedName = ref({
  first: '',
  middle: '',
  last: '',
});

const updateName = async () => {
  try {
    isUpdatingName.value = true;
    if (props.selectedApplicant) {
      const applicantRef = dbDocRefs.getFormRef(props.selectedApplicant.id);
      await updateDoc(applicantRef, {
        'applicant.name': updatedName.value,
      });
      updatedName.value = {
        first: '',
        middle: '',
        last: '',
      };
    }
    isUpdatingName.value = false;
    emit('exitUpdateName');
  } catch (error) {
    console.log(error);
  }
};

const emit = defineEmits<{
  (e: 'exitUpdateName'): void;
}>();
const isUpdatingName = ref(false);
</script>

<style scoped></style>
