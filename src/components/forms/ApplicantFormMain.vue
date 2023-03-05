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
            v-for="(doc, index) in sortedDocs"
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
              {{
                doc.delayed &&
                doc.delayed.isDelayed &&
                doc.status === 'Not Submitted'
                  ? ' (Delayed)'
                  : ''
              }}
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
            v-for="(doc, index) in sortedDocs"
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
import { QSpinnerPie, useQuasar } from 'quasar';
import { onMounted, ref, computed } from 'vue';
import DialogFormSubmitDoc from 'src/components/forms/dialogs/DialogFormSubmitDoc.vue';
import { Form, RejectionCode } from 'src/utils/types';
import { storageRefs } from 'src/utils/storage';
import { getDownloadURL } from '@firebase/storage';
import { DateTime } from 'luxon';
import DialogFormDocumentAvailability from './dialogs/DialogFormDocumentAvailability.vue';
import DialogFormScheduleSubmission from './dialogs/DialogFormScheduleSubmission.vue';
import { dbDocRefs } from 'src/utils/db';
import { updateDoc } from '@firebase/firestore';

const props = defineProps<{
  form: Form & { id: string };
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
  'Not Submitted': {
    textColor: 'primary',
    actionIcon: 'fas fa-chevron-right',
    actionLabel: 'Submit now',
    mobileLabel: 'Upload',
    clickable: true,
    bgColor: null,
  },
  Submitted: {
    textColor: 'grey-8',
    actionIcon: 'fas fa-check',
    actionLabel: 'Submitted',
    mobileLabel: 'Uploaded',
    clickable: false,
    bgColor: null,
  },
  Accepted: {
    textColor: 'positive',
    actionIcon: 'fas fa-check',
    actionLabel: 'Accepted',
    mobileLabel: 'Accepted',
    clickable: false,
    bgColor: null,
  },
  Rejected: {
    bgColor: 'negative',
    textColor: 'white',
    actionIcon: 'fas fa-chevron-right',
    actionLabel: 'Rejected. Resubmit now',
    mobileLabel: 'Rejected',
    clickable: true,
  },
  'Not Applicable': {
    bgColor: null,
    textColor: 'grey-6',
    actionIcon: 'fas fa-minus',
    actionLabel: 'Not Applicable. Change?',
    mobileLabel: 'Not Applicable',
    clickable: true,
  },
};
const logoURL = ref('');
const sortedDocs = computed(() => {
  return Object.keys(props.form.docs)
    .map((key) => ({ docId: key, ...props.form.docs[key] }))
    .sort((docA, docB) => docA.docNumber - docB.docNumber);
});

onMounted(async () => {
  const logo = props.form.company.logo;
  if (logo) {
    const logoRef = storageRefs.getLogoRef(logo);
    logoURL.value = await getDownloadURL(logoRef);
  }
});

const onDocumentClick = (index: number) => {
  const docStatus = sortedDocs.value[index].status;
  const rejection = sortedDocs.value[index].rejection;
  if (docStatus === 'Not Submitted') {
    onNotSubmitted(index);
  }
  if (docStatus === 'Rejected' && rejection) {
    onRejected(index, rejection);
  }
  if (docStatus === 'Not Applicable') {
    onNotApplicable(index);
  }
};

const onNotSubmitted = (index: number) => {
  $q.dialog({
    component: DialogFormDocumentAvailability,
    componentProps: {
      formId: props.form.id,
      doc: sortedDocs.value[index],
    },
  }).onOk((documentAvailability) => {
    if (documentAvailability === 'available') {
      $q.dialog({
        component: DialogFormSubmitDoc,
        componentProps: {
          doc: sortedDocs.value[index],
          form: props.form,
          index,
        },
      }).onOk(() => {
        const docName = sortedDocs.value[index].name;
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
          doc: sortedDocs.value[index],
          formId: props.form.id,
        },
      }).onOk(() => {
        $q.notify({
          message:
            'Noted on this, we will follow up with you on this date. Thank you.',
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
    code: RejectionCode;
    message: string;
  }
) => {
  const rejectionCode = rejection.code;

  if (rejectionCode === 'replaceDoc') {
    // TODO: Add a dialog to replace the document
  }

  if (rejectionCode === 'replacePages') {
    // TODO: Add a dialog to replace the pages
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
    const formRef = dbDocRefs.getFormRef(props.form.id);
    const COMPUTED_DOC_STATUS = `docs.${sortedDocs.value[index].docId}.status`;
    await updateDoc(formRef, {
      [COMPUTED_DOC_STATUS]: 'Not Submitted',
    });
    loadingDialog.hide();
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
