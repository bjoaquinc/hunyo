<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" @show="onDialogShow">
    <q-card style="width: 700px; max-width: 80vw">
      <q-card-section>
        <div class="flex">
          <div class="text-h5">{{ applicant ? 'Edit' : 'Add' }} Applicant</div>
          <q-btn
            v-if="applicant"
            @click="removeApplicant"
            :loading="removeIsLoading"
            label="Remove"
            color="negative"
            class="q-ml-md"
            unelevated
          />
          <q-btn
            class="q-ml-auto"
            v-close-popup
            icon="fas fa-times"
            dense
            flat
          />
        </div>

        <q-separator class="q-my-md" />
        <q-form
          @submit="
            () => {
              if (applicant) {
                updateApplicant();
              } else {
                addApplicant();
              }
            }
          "
        >
          <div class="q-col-gutter-md row">
            <div class="col-12 text-h6">Name</div>
            <q-input
              v-model="name.first"
              filled
              class="col"
              label="Given Name(s)"
              outlined
              :rules="[(val) => !!val || 'Required']"
            />
            <q-input
              v-model="name.middle"
              filled
              class="col"
              label="Middle Name"
              outlined
              :rules="[(val) => !!val || 'Required']"
            />
            <q-input
              v-model="name.last"
              filled
              class="col"
              label="Last Name"
              outlined
              :rules="[(val) => !!val || 'Required']"
            />
            <div class="col-12 text-h6">Email</div>
            <q-input
              v-model="email"
              filled
              class="col"
              label="Primary Email"
              type="email"
              outlined
              :rules="[(val) => !!val || 'Required', isValidEmail]"
            />
            <div class="col-12 text-h6">Phone Numbers</div>
            <q-input
              v-model="phoneNumbers.primary"
              filled
              class="col"
              label="Primary"
              type="tel"
              outlined
              mask="(####) ### - ####"
              hint="(####) ### - ####"
            />
            <q-input
              v-model="phoneNumbers.secondary"
              filled
              class="col"
              label="Secondary (Optional)"
              type="tel"
              outlined
              mask="(####) ### - ####"
              hint="(####) ### - ####"
            />
            <div class="col-12 text-h6">Address</div>
            <q-input
              v-model="address"
              filled
              class="col"
              label="Complete Address"
              outlined
            />
            <div class="col-12">
              <q-btn
                :loading="isLoading"
                type="submit"
                class="full-width"
                :label="applicant ? 'Update' : 'Create'"
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
import { arrayRemove, arrayUnion, updateDoc } from 'firebase/firestore';
import { QDialog, useDialogPluginComponent, useQuasar } from 'quasar';
import { useUserStore } from 'src/stores/user-store';
import { dbDocRefs } from 'src/utils/db';
import { ref } from 'vue';
import { ApplicantItem } from 'src/utils/types';

const { dialogRef, onDialogHide } = useDialogPluginComponent();
const { user } = useUserStore();
const $q = useQuasar();
const props = defineProps<{
  dashboardId: string;
  applicant?: ApplicantItem;
  applicants?: ApplicantItem[];
}>();
const isLoading = ref(false);
const removeIsLoading = ref(false);
const name = ref({
  first: '',
  middle: '',
  last: '',
});
const email = ref('');
const phoneNumbers = ref({
  primary: '',
  secondary: '',
});
const address = ref('');

const onDialogShow = () => {
  if (props.applicant) {
    email.value = props.applicant.email;
    if (props.applicant.name) {
      name.value = props.applicant.name;
    }
    if (props.applicant.phoneNumbers) {
      phoneNumbers.value = props.applicant.phoneNumbers;
    }
    if (props.applicant.address) {
      address.value = props.applicant.address;
    }
  }
};

const updateApplicant = async () => {
  if (!user) return;
  try {
    isLoading.value = true;
    const { company } = user;
    const { applicants } = props;
    if (applicants) {
      const applicantIndex = applicants.findIndex(
        (applicant) => applicant.email === props.applicant?.email
      );
      if (applicantIndex !== -1) {
        applicants[applicantIndex] = {
          name: name.value,
          email: email.value,
          phoneNumbers: phoneNumbers.value,
          address: address.value,
        };
      }
      const dashboardRef = dbDocRefs.getDraftDashboardRef(
        company.id,
        props.dashboardId
      );
      await updateDoc(dashboardRef, {
        newApplicants: applicants,
      });
      dialogRef.value?.hide();
      return;
    }
  } catch (error) {
    console.log(error);
    $q.notify({
      message: 'Could not add applicant. Please try again later.',
      color: 'negative',
    });
  } finally {
    isLoading.value = false;
  }
};

const addApplicant = async () => {
  if (!user) return;
  try {
    isLoading.value = true;
    const { company } = user;
    const applicant = {
      name: name.value,
      email: email.value,
      phoneNumbers:
        phoneNumbers.value.primary || phoneNumbers.value.secondary
          ? phoneNumbers.value
          : null,
      address: address.value,
    };
    const dashboardRef = dbDocRefs.getDraftDashboardRef(
      company.id,
      props.dashboardId
    );
    await updateDoc(dashboardRef, {
      newApplicants: arrayUnion(applicant),
    });
    dialogRef.value?.hide();
  } catch (error) {
    console.log(error);
    $q.notify({
      message: 'Could not add applicant. Please try again later.',
      color: 'negative',
    });
  } finally {
    isLoading.value = false;
  }
};

const removeApplicant = async () => {
  if (!user) return;
  try {
    removeIsLoading.value = true;
    const dashboardRef = dbDocRefs.getDraftDashboardRef(
      user.company.id,
      props.dashboardId
    );
    await updateDoc(dashboardRef, {
      newApplicants: arrayRemove(props.applicant),
    });
    dialogRef.value?.hide();
  } catch (error) {
    console.error(error);
  } finally {
    removeIsLoading.value = false;
  }
};

const isValidEmail = (val: string) => {
  if (val === '') return true;
  const emailPattern =
    /^(?=[a-zA-Z0-9@._%+-]{6,254}$)[a-zA-Z0-9._%+-]{1,64}@(?:[a-zA-Z0-9-]{1,63}\.){1,8}[a-zA-Z]{2,63}$/;
  return emailPattern.test(val) || 'Invalid email';
};

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);
</script>
