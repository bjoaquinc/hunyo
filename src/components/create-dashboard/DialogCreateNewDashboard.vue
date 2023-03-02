<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="width: 700px; max-width: 80vw">
      <q-card-section>
        <div class="flex justify-between">
          <div class="text-h4">New Request for Documents</div>
          <q-btn v-close-popup icon="fas fa-times" dense flat />
        </div>

        <q-separator class="q-mt-md" />
        <q-form @submit.prevent="onSubmit">
          <div class="row">
            <div class="col-12 q-mt-md">
              <q-select
                class="q-mt-md"
                filled
                v-model="country"
                use-input
                input-debounce="0"
                label="What is the destination country?"
                :options="options"
                @filter="filterFn"
                :rules="[(val) => !!val || 'Country is Required']"
                hide-dropdown-icon
              />
            </div>
            <div class="col-12 q-mt-xs">
              <q-input
                v-model="job"
                :rules="[(val) => !!val || 'This field is required']"
                filled
                label="What job are you collecting documents for? (e.g. Nurse)"
                type="textarea"
                autogrow
                outlined
              />
            </div>
            <div class="col-12 q-mt-xs">
              <q-input
                v-model="title"
                :rules="[(val) => !!val || 'This field is required']"
                filled
                label="Add a title (This is for your reference. Applicants will not see this)"
                type="textarea"
                autogrow
                outlined
              />
            </div>
            <div class="col-12 q-mt-xs">
              <q-input
                label="Deadline for document submission (YYYY/mm/dd)"
                ref="deadlineRef"
                filled
                v-model="deadline"
                mask="date"
                :rules="[
                  (val) => !!val || 'This field is required',
                  'date',
                  (val) =>
                    new Date(val).getTime() > Date.now() ||
                    'Must be a future date',
                ]"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy
                      cover
                      transition-show="scale"
                      transition-hide="scale"
                    >
                      <q-date v-model="deadline">
                        <div class="row items-center justify-end">
                          <q-btn
                            v-close-popup
                            label="Close"
                            color="primary"
                            flat
                          />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="col-12 q-mt-xs">
              <q-btn
                type="submit"
                class="full-width"
                label="Next"
                color="primary"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>
      <q-inner-loading :showing="isLoading">
        <q-spinner-pie color="primary" size="80px" />
      </q-inner-loading>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { QDialog, useDialogPluginComponent } from 'quasar';
import { ref } from 'vue';
import { countryList } from 'src/utils/countries-list';
import { dbColRefs } from 'src/utils/db';
import { addDoc, serverTimestamp, Timestamp } from '@firebase/firestore';
import { useUserStore } from 'src/stores/user-store';
import { useRouter } from 'vue-router';
import { DateTime } from 'luxon';

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const router = useRouter();
const { user } = useUserStore();
const country = ref('');
const job = ref('');
const title = ref('');
const deadline = ref('');
const options = ref<string[]>([]);
const isLoading = ref(false);

const filterFn = (val: string, update: (callbackFn: () => void) => void) => {
  if (val === '') {
    update(() => {
      options.value = countryList;
    });
    return;
  }
  update(() => {
    const needle = val.toLowerCase();
    options.value = countryList.filter(
      (v) => v.toLowerCase().indexOf(needle) > -1
    );
  });
};

const onSubmit = async () => {
  try {
    if (!user) return;
    isLoading.value = true;
    const draftDashboardsRef = dbColRefs.getDraftDashboardsRef(user.company.id);
    const deadlineTimestamp = DateTime.fromFormat(deadline.value, 'yyyy/MM/dd');
    const docRef = await addDoc(draftDashboardsRef, {
      createdAt: serverTimestamp() as Timestamp,
      createdBy: user.id,
      country: country.value,
      job: job.value,
      title: title.value,
      deadline: Timestamp.fromMillis(deadlineTimestamp.toMillis()),
      docs: {},
      isPublished: false,
    });
    onDialogOK();
    router.push({
      name: 'DocumentRequestTemplate',
      params: { dashboardId: docRef.id },
    });
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
