<template>
  <div class="absolute-center">
    <q-card class="my-card text-grey-8">
      <q-card-section>
        <q-img
          :src="logoURL"
          :class="$q.platform.is.mobile ? 'q-mt-lg' : ''"
          v-if="logoURL"
          style="max-width: 200px"
        />

        <div class="flex justify-between items-end q-mt-sm">
          <div class="text-h5">
            {{ form.dashboard.formContent.header }}
          </div>
          <div class="text-h6 text-negative">
            Deadline:
            <strong>{{ deadline }}</strong>
          </div>
        </div>

        <q-separator class="q-my-md" />
        <div class="q-mt-sm text-subtitle1">
          {{ form.dashboard.formContent.caption }}
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-list class="gt-xs" separator>
          <q-item
            @click="onDocumentClick(index)"
            class="text-h6 q-py-md rounded-borders"
            :class="
              documentItemStyles[doc.status].bgColor
                ? `bg-${documentItemStyles[doc.status].bgColor}`
                : ''
            "
            v-for="(doc, index) in documents"
            :key="index"
            :clickable="documentItemStyles[doc.status].clickable"
            :v-ripple="documentItemStyles[doc.status].clickable"
          >
            <q-item-section avatar>
              <q-icon
                name="fas fa-file"
                :color="documentItemStyles[doc.status].textColor"
              />
            </q-item-section>
            <q-item-section
              :class="`text-${documentItemStyles[doc.status].textColor}`"
              >{{ doc.name }}
            </q-item-section>
            <q-item-section class="text-subtitle1 text-grey-8">
              <div
                class="q-ml-auto flex items-center"
                :class="`text-${documentItemStyles[doc.status].textColor}`"
              >
                {{ documentItemStyles[doc.status].actionLabel
                }}<q-icon
                  v-if="documentItemStyles[doc.status].actionIcon"
                  :name="(documentItemStyles[doc.status].actionIcon as string)"
                  class="q-ml-md"
                  size="sm"
                />
              </div>
            </q-item-section>
          </q-item>
          <q-separator />
        </q-list>
        <q-list class="lt-sm" separator>
          <q-item
            @click="onDocumentClick(index)"
            class="text-subtitle1 q-py-md"
            :class="
              documentItemStyles[doc.status].bgColor
                ? `bg-${documentItemStyles[doc.status].bgColor}`
                : ''
            "
            v-for="(doc, index) in documents"
            :key="index"
            :clickable="documentItemStyles[doc.status].clickable"
            :v-ripple="documentItemStyles[doc.status].clickable"
          >
            <q-item-section
              :class="`text-${documentItemStyles[doc.status].textColor}`"
            >
              {{
                `${documentItemStyles[doc.status].mobileLabel} ${doc.name}`
              }}</q-item-section
            >
            <q-item-section avatar>
              <q-icon
                :name="documentItemStyles[doc.status].actionIcon"
                size="xs"
                :color="documentItemStyles[doc.status].textColor"
              />
            </q-item-section>
          </q-item>
          <q-separator />
        </q-list>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { useQuasar, QSpinnerPie } from 'quasar';
import { onMounted, ref, computed } from 'vue';
import DialogFormSubmitDoc from 'src/components/forms/dialogs/DialogFormSubmitDoc.vue';
import { Form } from 'src/utils/types';
import { storageRefs } from 'src/utils/storage';
import { getDownloadURL } from '@firebase/storage';
import { DateTime } from 'luxon';
import DialogFormDocumentAvailability from './dialogs/DialogFormDocumentAvailability.vue';
import DialogFormScheduleSubmission from './dialogs/DialogFormScheduleSubmission.vue';
import DialogFormResubmitPages from './dialogs/DialogFormResubmitPages.vue';
import DialogFormResubmitFull from './dialogs/DialogFormResubmitFull.vue';
import DialogFormDelayedUpdate from './dialogs/DialogFormDelayedUpdate.vue';
import { dbDocRefs } from 'src/utils/db';
import { Timestamp, updateDoc } from '@firebase/firestore';
import { ApplicantDocument } from 'src/utils/new-types';

const props = defineProps<{
  form: Form & { id: string };
  documents: (ApplicantDocument & { id: string })[];
}>();

const deadline = computed(() => {
  const deadlineTimestamp = props.form.dashboard.deadline;
  const dateTime = DateTime.fromMillis(deadlineTimestamp.toMillis());
  return dateTime.toLocaleString({
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  });
});

const $q = useQuasar();
const documentItemStyles = {
  'not-submitted': {
    textColor: 'primary',
    actionIcon: 'fas fa-chevron-right',
    actionLabel: 'Submit now',
    mobileLabel: 'Upload',
    clickable: true,
    bgColor: null,
  },
  delayed: {
    textColor: 'orange-8',
    actionIcon: 'fas fa-clock',
    actionLabel: 'Delayed. Update?',
    mobileLabel: 'Delayed',
    clickable: true,
    bgColor: null,
  },
  submitted: {
    textColor: 'grey-8',
    actionIcon: 'fas fa-check',
    actionLabel: 'Submitted',
    mobileLabel: 'Uploaded',
    clickable: false,
    bgColor: null,
  },
  accepted: {
    textColor: 'positive',
    actionIcon: 'fas fa-check',
    actionLabel: 'Accepted',
    mobileLabel: 'Accepted',
    clickable: false,
    bgColor: null,
  },
  rejected: {
    bgColor: 'negative',
    textColor: 'white',
    actionIcon: 'fas fa-chevron-right',
    actionLabel: 'Rejected. Resubmit now',
    mobileLabel: 'Rejected',
    clickable: true,
  },
  'not-applicable': {
    bgColor: null,
    textColor: 'grey-6',
    actionIcon: 'fas fa-minus',
    actionLabel: 'Not Applicable. Change?',
    mobileLabel: 'Not Applicable',
    clickable: true,
  },
  'admin-checked': {
    textColor: 'grey-8',
    actionIcon: 'fas fa-check',
    actionLabel: 'Submitted',
    mobileLabel: 'Uploaded',
    clickable: false,
    bgColor: null,
  },
};
const logoURL = ref('');

onMounted(async () => {
  const logo = props.form.company.logo;
  if (logo) {
    const logoRef = storageRefs.getLogoRef(logo);
    logoURL.value = await getDownloadURL(logoRef);
  }
});

const onDocumentClick = (index: number) => {
  const docStatus = props.documents[index].status;
  const rejection = props.documents[index].rejection;
  if (docStatus === 'not-submitted') {
    onNotSubmitted(index);
  }
  if (docStatus === 'rejected' && rejection) {
    onRejected(index, rejection);
  }
  if (docStatus === 'not-applicable') {
    onNotApplicable(index);
  }
  if (docStatus === 'delayed') {
    onDelayed(index);
  }
};

const onNotSubmitted = (index: number) => {
  $q.dialog({
    component: DialogFormDocumentAvailability,
    componentProps: {
      formId: props.form.id,
      doc: props.documents[index],
    },
  }).onOk((documentAvailability) => {
    if (documentAvailability === 'available') {
      $q.dialog({
        component: DialogFormSubmitDoc,
        componentProps: {
          doc: props.documents[index],
          form: props.form,
          index,
        },
      }).onOk(() => {
        const docName = props.documents[index].name;
        $q.notify({
          message: `${docName} submitted. Thank you.`,
          type: 'positive',
        });
      });
    }

    if (documentAvailability === 'not-available') {
      $q.dialog({
        component: DialogFormScheduleSubmission,
        componentProps: {
          doc: props.documents[index],
          formId: props.form.id,
        },
      }).onOk(() => {
        $q.notify({
          message: 'Submission scheduled successfully',
          type: 'positive',
        });
      });
    }

    if (documentAvailability === 'not-applicable') {
      $q.notify({
        message: 'Document changed to Not Applicable.',
        type: 'grey-8',
      });
    }
  });
};

const onRejected = (
  index: number,
  rejection: {
    type: 'pages' | 'full-submission';
    reasons: string[];
    rejectedBy: string;
    rejectedAt: Timestamp;
    pageIds?: string[] | undefined;
  }
) => {
  if (rejection.type === 'full-submission') {
    $q.dialog({
      component: DialogFormResubmitFull,
      componentProps: {
        doc: props.documents[index],
        form: props.form,
      },
    });
    console.log('Full Submission');
  }

  if (rejection.type === 'pages') {
    $q.dialog({
      component: DialogFormResubmitPages,
      componentProps: {
        doc: props.documents[index],
        form: props.form,
      },
    }).onOk(() => {
      $q.notify({
        message: 'Document resubmitted. Thank you.',
        type: 'positive',
      });
    });
  }
};

const onNotApplicable = (index: number) => {
  $q.dialog({
    title: 'Change to Applicable?',
    ok: 'Yes',
    cancel: 'No',
  }).onOk(async () => {
    const loadingDialog = $q.dialog({
      title: 'Changing document to Applicable...',
      progress: {
        spinner: QSpinnerPie,
      },
      persistent: true,
      ok: false,
    });
    const selectedDoc = props.documents[index];
    const documentRef = dbDocRefs.getDocumentRef(
      selectedDoc.companyId,
      selectedDoc.id
    );
    await updateDoc(documentRef, {
      status: 'not-submitted',
    });
    loadingDialog.hide();
  });
};

const onDelayed = (index: number) => {
  const dialog = $q.dialog({
    component: DialogFormDelayedUpdate,
  });
  dialog.onOk((payload: 'submit-now' | 'reschedule') => {
    if (payload === 'submit-now') {
      const dialog = $q.dialog({
        component: DialogFormSubmitDoc,
        componentProps: {
          doc: props.documents[index],
          form: props.form,
          index,
        },
      });
      dialog.onOk(() => {
        const docName = props.documents[index].name;
        $q.notify({
          message: `${docName} submitted. Thank you.`,
          type: 'positive',
        });
      });
    }
    if (payload === 'reschedule') {
      const dialog = $q.dialog({
        component: DialogFormScheduleSubmission,
        componentProps: {
          doc: props.documents[index],
          formId: props.form.id,
        },
      });
      dialog.onOk(() => {
        $q.notify({
          message: 'Successfully rescheduled.',
          type: 'positive',
        });
      });
    }
  });
};
</script>

<style lang="sass" scoped>
.my-card
  min-width: 10px
  width: 100vw
  max-height: 2000px
  height: 100vh
  padding: 8px
  @media only screen and (width > $breakpoint-xs)
    width: auto
    height: auto
    min-width: 900px
    max-height: 80vh
    overflow: auto
    padding: 18px
</style>
