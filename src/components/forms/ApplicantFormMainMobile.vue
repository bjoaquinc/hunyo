<template>
  <div>
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
        <!-- <q-list class="gt-xs" separator>
          <q-item
            @click="onDocumentClick(doc)"
            class="text-h6 q-py-md rounded-borders"
            :class="
              documentStatusStyles[doc.status].bgColor
                ? `bg-${documentStatusStyles[doc.status].bgColor}`
                : ''
            "
            v-for="(doc, index) in documents"
            :key="index"
            :clickable="documentStatusStyles[doc.status].clickable"
            :v-ripple="documentStatusStyles[doc.status].clickable"
          >
            <q-item-section avatar>
              <q-icon
                name="fas fa-file"
                :color="documentStatusStyles[doc.status].textColor"
              />
            </q-item-section>
            <q-item-section
              :class="`text-${documentStatusStyles[doc.status].textColor}`"
              >{{ doc.name }}
            </q-item-section>
            <q-item-section class="text-subtitle1 text-grey-8">
              <div
                class="q-ml-auto flex items-center"
                :class="`text-${documentStatusStyles[doc.status].textColor}`"
              >
                {{ documentStatusStyles[doc.status].actionLabel
                }}<q-icon
                  v-if="documentStatusStyles[doc.status].actionIcon"
                  :name="(documentStatusStyles[doc.status].actionIcon as string)"
                  class="q-ml-md"
                  size="sm"
                />
              </div>
            </q-item-section>
          </q-item>
          <q-separator />
        </q-list> -->
        <q-list v-if="requiredDocs.length > 0" class="lt-sm" separator>
          <div class="text-h6 text-grey-8">Required</div>
          <q-item
            @click="onDocumentClick(doc)"
            class="text-subtitle1 q-py-md"
            :class="
              documentStatusStyles[doc.status].bgColor
                ? `bg-${documentStatusStyles[doc.status].bgColor}`
                : ''
            "
            v-for="(doc, index) in requiredDocs"
            :key="index"
            :clickable="documentStatusStyles[doc.status].clickable"
            :v-ripple="documentStatusStyles[doc.status].clickable"
          >
            <q-item-section
              :class="`text-${documentStatusStyles[doc.status].textColor}`"
            >
              {{
                `${documentStatusStyles[doc.status].mobileLabel} ${
                  doc.alias || doc.name
                }`
              }}</q-item-section
            >
            <q-item-section avatar>
              <q-icon
                :name="documentStatusStyles[doc.status].actionIcon"
                size="xs"
                :color="documentStatusStyles[doc.status].textColor"
              />
            </q-item-section>
          </q-item>
          <q-separator />
        </q-list>
        <q-list
          v-if="ifAvailableDocs.length > 0"
          class="lt-sm q-mt-md"
          separator
        >
          <div class="text-h6 text-grey-8">If Available</div>
          <q-item
            @click="onDocumentClick(doc)"
            class="text-subtitle1 q-py-md"
            :class="
              documentStatusStyles[doc.status].bgColor
                ? `bg-${documentStatusStyles[doc.status].bgColor}`
                : ''
            "
            v-for="(doc, index) in ifAvailableDocs"
            :key="index"
            :clickable="documentStatusStyles[doc.status].clickable"
            :v-ripple="documentStatusStyles[doc.status].clickable"
          >
            <q-item-section
              :class="`text-${documentStatusStyles[doc.status].textColor}`"
            >
              {{
                `${documentStatusStyles[doc.status].mobileLabel} ${
                  doc.alias || doc.name
                }`
              }}</q-item-section
            >
            <q-item-section avatar>
              <q-icon
                :name="documentStatusStyles[doc.status].actionIcon"
                size="xs"
                :color="documentStatusStyles[doc.status].textColor"
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
import * as amplitude from '@amplitude/analytics-browser';
import { documentStatusStyles } from './styles';
import { useQuasar } from 'quasar';
import { onMounted, ref, computed } from 'vue';
import { Form } from 'src/utils/types';
import { storageRefs } from 'src/utils/storage';
import { getDownloadURL } from '@firebase/storage';
import { DateTime } from 'luxon';
import DialogFormSubmitDocImage from './mobile/DialogFormSubmitDocImage.vue';
import DialogFormDocumentAvailability from './mobile/DialogFormDocumentAvailability.vue';
import DialogFormScheduleSubmission from './mobile/DialogFormScheduleSubmission.vue';
import DialogFormDelayedUpdate from './mobile/DialogFormDelayedUpdate.vue';
import DialogFormSample from './mobile/DialogFormSample.vue';
import { ApplicantDocument } from 'src/utils/new-types';
import DialogFormRejectionInformation from './mobile/DialogFormRejectionInformation.vue';

const props = defineProps<{
  form: Form & { id: string };
  documents: (ApplicantDocument & { id: string })[];
}>();
const requiredDocs = computed(() => {
  return props.documents.filter((doc) => doc.isRequired);
});

const ifAvailableDocs = computed(() => {
  return props.documents.filter((doc) => !doc.isRequired);
});

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
const logoURL = ref('');

onMounted(async () => {
  const logo = props.form.company.logo;
  if (logo) {
    const logoRef = storageRefs.getLogoRef(logo);
    logoURL.value = await getDownloadURL(logoRef);
  }
});

const onDocumentClick = (doc: ApplicantDocument & { id: string }) => {
  const index = props.documents.findIndex((d) => d.id === doc.id);
  amplitude.track('Select Document', {
    applicantName: props.form.applicant.name,
    docId: doc.id,
    docName: doc.name,
    orderOnList: doc.docNumber,
    docStatus: doc.status,
  });
  const docStatus = doc.status;
  const rejection = doc.rejection;
  if (docStatus === 'not-submitted') {
    onNotSubmitted(index);
  }
  if (docStatus === 'rejected' && rejection) {
    onRejected(index);
  }
  // if (docStatus === 'not-applicable') {
  //   onNotApplicable(index);
  // }
  if (docStatus === 'delayed') {
    onDelayed(index);
  }

  // if (docStatus === 'accepted') {
  //   onAccepted(index);
  // }
};

const onNotSubmitted = async (index: number) => {
  await new Promise<void>((resolve) => {
    showSample(props.documents[index], resolve);
  });
  $q.dialog({
    component: DialogFormDocumentAvailability,
    componentProps: {
      form: props.form,
      doc: props.documents[index],
    },
  }).onOk((documentAvailability) => {
    if (documentAvailability === 'available') {
      $q.dialog({
        component: DialogFormSubmitDocImage,
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
          form: props.form,
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

const showSample = async (
  doc: ApplicantDocument & { id: string },
  resolve?: () => void
) => {
  if (!doc.sample || doc.sample.contentType === 'application/pdf') {
    resolve?.();
    return;
  }
  const storageRef = storageRefs.getSampleRef(
    doc.companyId,
    doc.dashboardId,
    doc.sample.file
  );
  const url = await getDownloadURL(storageRef);

  $q.dialog({
    component: DialogFormSample,
    componentProps: {
      sampleURL: url,
      doc,
      form: props.form,
    },
  }).onOk(() => {
    if (resolve) {
      resolve();
    }
  });
};

const onRejected = (index: number) => {
  // CREATE NEW FLOW FOR DOCUMENT RESUBMISSION
  $q.dialog({
    component: DialogFormRejectionInformation,
    componentProps: {
      doc: props.documents[index],
      form: props.form,
    },
  }).onOk(async () => {
    await new Promise<void>((resolve) => {
      showSample(props.documents[index], resolve);
    });
    $q.dialog({
      component: DialogFormSubmitDocImage,
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
  });
};

const onDelayed = (index: number) => {
  const dialog = $q.dialog({
    component: DialogFormDelayedUpdate,
  });
  dialog.onOk(async (payload: 'submit-now' | 'reschedule') => {
    if (payload === 'submit-now') {
      await new Promise<void>((resolve) => {
        showSample(props.documents[index], resolve);
      });
      const dialog = $q.dialog({
        component: DialogFormSubmitDocImage,
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
          form: props.form,
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

// const onAccepted = async (index: number) => {
//   const { company, dashboard, applicant } = props.form;
//   const doc = props.documents[index];
//   const storageRef = storageRefs.getFinalDocRef(
//     company.id,
//     dashboard.id,
//     applicant.id,
//     doc.updatedName || doc.name
//   );
//   const ACCEPTED_CONTENT_TYPE = 'application/pdf';
//   const imgURL = await getDownloadURL(storageRef);
//   $q.dialog({
//     component: BaseDialogViewImage,
//     componentProps: {
//       imgURL,
//       contentType: ACCEPTED_CONTENT_TYPE,
//     },
//   });
// };
</script>

<style lang="sass" scoped>
.my-card
  min-width: 10px
  width: 100vw
  min-height: 100vh
  height: auto !important
  padding: 8px
  @media only screen and (width > $breakpoint-xs)
    width: auto
    height: auto
    min-width: 900px
    max-height: 80vh
    overflow: auto
    padding: 18px
</style>
