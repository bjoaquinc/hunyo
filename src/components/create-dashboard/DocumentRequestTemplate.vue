<template>
  <q-page>
    <div class="absolute-center">
      <q-card class="my-card text-grey-8" v-if="isReady && dashboard">
        <q-stepper
          v-model="step"
          ref="stepperRef"
          color="primary"
          animated
          keep-alive
        >
          <q-step
            :name="1"
            title="Add Documents"
            icon="fas fa-folder"
            :done="step > 1"
          >
            <div class="text-h5 text-center text-negative">
              APPLICANT FORM PREVIEW
            </div>
            <q-card-section>
              <q-img :src="logoURL" style="max-width: 200px" />

              <div class="flex justify-between items-center items-end q-mt-sm">
                <div
                  @click="editHeader = true"
                  v-if="!editHeader"
                  class="text-h5"
                >
                  {{ header }}
                </div>
                <q-input
                  v-else
                  @keydown.enter.prevent="editHeader = false"
                  @blur="editHeader = false"
                  autofocus
                  autogrow
                  outlined
                  color="primary"
                  class="text-h5"
                  input-class="text-h5"
                  input-style="line-height: 27px"
                  v-model="header"
                  style="min-width: 340px"
                />
                <div class="text-h6">
                  Deadline: <strong>{{ deadline }}</strong>
                </div>
              </div>

              <q-separator class="q-my-md" />
              <div
                class="q-mt-sm text-subtitle1"
                v-if="!editCaption"
                @click="editCaption = true"
              >
                {{ caption }}
              </div>
              <q-input
                v-else
                autofocus
                @keydown.enter.prevent="editCaption = false"
                @blur="editCaption = false"
                v-model="caption"
                outlined
                class="q-mt-sm text-subtitle1"
                input-class="text-subtitle1"
              />
            </q-card-section>

            <q-card-section class="q-pt-none">
              <q-list v-if="dashboard && sortedDocs" class="gt-sm" separator>
                <q-item
                  @click="openDialogDocument(doc.name)"
                  class="text-h6 q-py-md rounded-borders"
                  v-for="(doc, index) in sortedDocs"
                  :key="index"
                  :clickable="documentItemStyles['not submitted'].clickable"
                  :v-ripple="documentItemStyles['not submitted'].clickable"
                >
                  <q-item-section avatar>
                    <q-icon
                      name="fas fa-file"
                      :color="documentItemStyles['not submitted'].color"
                    />
                  </q-item-section>
                  <q-item-section>{{
                    capsFirstLetters(doc.name)
                  }}</q-item-section>
                  <q-item-section class="text-subtitle1 text-grey-8" side>
                    <div
                      class="q-ml-sm flex items-center"
                      :class="`text-${documentItemStyles['not submitted'].color}`"
                    >
                      {{ documentItemStyles['not submitted'].actionLabel
                      }}<q-icon
                        v-if="documentItemStyles['not submitted'].actionIcon"
                        :name="(documentItemStyles['not submitted'].actionIcon as string)"
                        class="q-ml-md"
                        size="sm"
                      />
                    </div>
                  </q-item-section>
                </q-item>
                <q-separator />
              </q-list>

              <q-btn
                @click="openDialogAddDocument"
                class="q-mt-lg"
                icon="fas fa-plus"
                label="Add document"
                color="primary"
                outline
              >
              </q-btn>
            </q-card-section>
          </q-step>

          <q-step
            :name="2"
            title="Add applicants"
            icon="fas fa-person"
            :done="step > 2"
          >
            <BaseAddEmails
              :saved-emails="savedEmails"
              ref="emailsRef"
              title="Add Applicants"
              :action-button="false"
            />
          </q-step>

          <q-step
            :name="3"
            title="Confirm Message"
            icon="fas fa-comment"
            :done="step > 3"
          >
            <div class="text-h5">Confirm email message to applicants</div>
            <q-input
              class="q-mt-md"
              v-model="message"
              autogrow
              input-style="white-space: pre-line"
              type="textarea"
              filled
            />
            <div class="text-caption text-negative q-mt-sm">
              *This information will be sent to each applicant. You can edit it.
            </div>
          </q-step>
          <template v-slot:navigation v-if="hasDocs">
            <div class="flex">
              <q-btn
                v-if="step > 1"
                @click="stepperRef?.previous()"
                label="Back"
                color="primary"
              />
              <q-btn
                :loading="isLoading"
                @click="onNext()"
                class="q-ml-auto"
                :label="step === 3 ? 'Send Emails' : 'Next'"
                color="primary"
              />
            </div>
          </template>
        </q-stepper>
      </q-card>
      <q-spinner-pie v-else size="80px" color="primary" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { QInput, QStepper, useQuasar } from 'quasar';
import {
  ref,
  onMounted,
  onUnmounted,
  onBeforeUnmount,
  computed,
  watch,
} from 'vue';
import { dbDocRefs } from 'src/utils/db';
import { DraftDashboard } from 'src/utils/types';
import { useUserStore } from 'src/stores/user-store';
import {
  getDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  updateDoc,
} from '@firebase/firestore';
import { capsFirstLetters } from './helpers';
import DialogTemplateDocument from 'src/components/create-dashboard/DialogTemplateDocument.vue';
import DialogDashboardAddDocument from 'src/components/create-dashboard/DialogDashboardDocumentForm.vue';
import BaseAddEmails from '../BaseAddEmails.vue';
import { useRouter } from 'vue-router';
import { storageRefs } from 'src/utils/storage';
import { getDownloadURL } from '@firebase/storage';
import { DateTime } from 'luxon';

const props = defineProps<{
  dashboardId: string;
}>();
const isReady = ref(false);
const logoURL = ref('');
const router = useRouter();
const { user } = useUserStore();
const stepperRef = ref<QStepper | null>(null);
const step = ref(1);
const companyId = user?.company.id as string;
const dashboard = ref<(DraftDashboard & { id: string }) | null>(null);
const unsubDashboard = ref<Unsubscribe | null>(null);
const deadline = computed<string>(() => {
  if (dashboard.value) {
    const deadlineTimestamp = dashboard.value.deadline;
    const dateTime = DateTime.fromMillis(deadlineTimestamp.toMillis());
    return dateTime.toLocaleString({
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    });
  } else {
    return '';
  }
});
const header = ref('Submit the documents below');
const editHeader = ref(false);
const caption = ref('(You can submit documents one at a time)');
const editCaption = ref(false);
const sortedDocs = computed(() => {
  if (dashboard.value) {
    return Object.keys(dashboard.value.docs)
      .map((key) => ({
        name: key,
        ...(dashboard.value as DraftDashboard).docs[key],
      }))
      .sort((a, b) => a.docNumber - b.docNumber);
  } else {
    return null;
  }
});
const hasDocs = computed<boolean>(() => {
  if (dashboard.value && Object.keys(dashboard.value.docs).length > 0) {
    return true;
  } else {
    return false;
  }
});

const q = useQuasar();
const documentItemStyles = {
  'not submitted': {
    color: 'primary',
    actionIcon: 'fas fa-chevron-right',
    actionLabel: 'Submit now',
    clickable: true,
  },
  submitted: {
    color: 'grey-8',
    actionIcon: 'fas fa-check',
    actionLabel: 'Submitted',
    clickable: false,
  },
  accepted: {
    color: 'positive',
    actionIcon: 'fas fa-check',
    actionLabel: 'Accepted',
    clickable: false,
  },
  rejected: {
    color: 'negative',
    actionIcon: 'fas fa-times',
    actionLabel: 'Rejected',
    clickable: true,
  },
};

onMounted(async () => {
  await getLogoURL();
  await setDashboard(props.dashboardId);
});

watch(
  props,
  async (newValue) => {
    const { dashboardId } = newValue;
    await setDashboard(dashboardId);
  },
  {
    deep: true,
  }
);

onUnmounted(async () => {
  if (unsubDashboard.value) {
    unsubDashboard.value();
  }
});

onBeforeUnmount(async () => {
  await updateFormContent();
});

const setDashboard = async (dashboardId: string) => {
  const draftDashboardRef = dbDocRefs.getDraftDashboardRef(
    companyId,
    dashboardId
  );
  await new Promise((resolve, reject) => {
    let runOnlyOnce = () => {
      runOnlyOnce = () => {
        return;
      };
      isReady.value = true;
      resolve;
    };
    const unsub = onSnapshot(
      draftDashboardRef,
      (docSnap) => {
        const docData = docSnap.data();
        if (docData) {
          dashboard.value = { id: docSnap.id, ...docData };
          if (docData.formContent) {
            header.value = docData.formContent.header;
            caption.value = docData.formContent.caption;
          }
          if (docData.applicants) {
            savedEmails.value = docData.applicants;
          }
          if (docData.messages) {
            message.value = docData.messages.opening;
          }
        }
        unsubDashboard.value = unsub;
        runOnlyOnce();
      },
      reject
    );
  });
};

const getLogoURL = async () => {
  const companyRef = dbDocRefs.getCompanyRef(companyId);
  const companySnap = await getDoc(companyRef);
  const companyData = companySnap.data();
  if (companyData && companyData.logo) {
    const logoRef = storageRefs.getLogoRef(companyData.logo);
    logoURL.value = await getDownloadURL(logoRef);
  }
};

// Step One: Add Documents

const openDialogDocument = (key: string) => {
  if (!dashboard.value) return;
  q.dialog({
    component: DialogTemplateDocument,
    componentProps: {
      doc: { name: key, ...dashboard.value.docs[key] },
      dashboardId: props.dashboardId,
      lastDocNumber: Object.keys(dashboard.value.docs).length,
    },
  });
};

const openDialogAddDocument = () => {
  if (!dashboard.value) return;
  q.dialog({
    component: DialogDashboardAddDocument,
    componentProps: {
      dashboardId: props.dashboardId,
      lastDocNumber: Object.keys(dashboard.value.docs).length,
    },
  });
};

const updateFormContent = async () => {
  const dashboardRef = dbDocRefs.getDraftDashboardRef(
    companyId,
    props.dashboardId
  );
  await updateDoc(dashboardRef, {
    'formContent.header': header.value,
    'formContent.caption': caption.value,
    applicants: emails.value,
    messages: {
      opening: message.value,
    },
  });
};

// Step Two: Add Emails

const emailsRef = ref<null | InstanceType<typeof BaseAddEmails>>(null);
const savedEmails = ref<string[]>([]);
const emails = computed(() => {
  if (!emailsRef.value) return [];
  return emailsRef.value.emails;
});

// Step Three: Confirm Message
const message = ref(`Hi,

We need additional documents to process your application to work abroad.
Click on this link to view and submit the requirements ASAP:`);

// Next and Submit
const isLoading = ref(false);

const onNext = () => {
  if (step.value === 1) {
    stepperRef.value?.next();
  } else if (step.value === 2) {
    stepperRef.value?.next();
  } else if (step.value === 3) {
    onSubmit();
  }
};

const onSubmit = async () => {
  isLoading.value = true;
  await publishDashboard();
  router.push({
    name: 'DashboardPage',
    params: { dashboardId: props.dashboardId },
  });
  isLoading.value = false;
};

const publishDashboard = async () => {
  const dashboardRef = dbDocRefs.getPublishedDashboardRef(
    companyId,
    props.dashboardId
  );
  await updateDoc(dashboardRef, {
    'formContent.header': header.value,
    'formContent.caption': caption.value,
    applicants: emails.value,
    messages: {
      opening: message.value,
    },
    isPublished: true,
    publishedAt: serverTimestamp(),
  });
};
</script>

<style lang="sass" scoped>
.my-card
  min-width: 900px
  max-height: 80vh
  overflow: auto
  padding: 18px
  @media only screen and (width < $breakpoint-sm)
    min-width: 10px
    width: 100vw
    max-height: 2000px
    height: 100vh
    padding: 8px
</style>
