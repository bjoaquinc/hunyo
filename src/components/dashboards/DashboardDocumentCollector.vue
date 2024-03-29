<template>
  <div class="q-pa-lg">
    <Header v-bind="dashboard" ref="headerRef" />
    <q-table
      class="q-mt-xl"
      :rows="filteredApplicants"
      :rows-per-page-options="[0]"
      :columns="columns"
      :row-key="(row) => row.id"
      selection="multiple"
      v-model:selected="selected"
    >
      <template v-slot:top>
        <div class="flex full-width">
          <q-btn-dropdown icon="fas fa-list" color="primary" label="Options">
            <q-list>
              <q-item clickable v-close-popup>
                <q-item-section avatar>
                  <q-icon color="grey-8" name="fas fa-file-arrow-down" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>EXPORT DOCUMENTS</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable @click="addApplicant" v-close-popup>
                <q-item-section avatar>
                  <q-icon color="grey-8" name="fas fa-plus" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>ADD APPLICANTS</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable v-close-popup>
                <q-item-section avatar>
                  <q-icon color="grey-8" name="fas fa-times" />
                </q-item-section>
                <q-item-section @click="deleteApplicants">
                  <q-item-label>DELETE APPLICANTS</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <q-input
            outlined
            type="search"
            class="q-mx-sm"
            placeholder="Search Applicants"
            dense
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <!-- Check Box -->
          <q-td>
            <q-checkbox v-model="props.selected" />
          </q-td>
          <!-- Index -->
          <q-td key="index" :props="props">
            <div class="text-body 2">{{ props.rowIndex + 1 }}</div>
          </q-td>
          <!-- Latest Message Status -->
          <q-td key="status" :props="props">
            <div class="flex column">
              <div class="flex items-center no-wrap">
                <q-icon
                  name="fas fa-dot-circle"
                  :color="
                    (props.row as Applicant).latestMessage?.status
                      ? props.row.latestMessage.status ===
                        'Delivered'
                        ? 'positive'
                        : 'negative'
                      : 'grey-8'
                  "
                />
                <q-btn
                  class="text-body2 q-ml-sm"
                  :class="
                    props.row.latestMessage
                      ? props.row.latestMessage.status === 'Delivered'
                        ? 'text-positive'
                        : 'text-negative'
                      : 'grey-8'
                  "
                  no-caps
                  flat
                  dense
                >
                  {{
                    props.row.latestMessage
                      ? props.row.latestMessage.status
                      : 'Sending'
                  }}
                </q-btn>
              </div>
              <div
                v-if="props.row.latestMessage"
                style="font-size: 10px"
                class="text-weight-bold text-grey-7"
              >
                {{
                  DateTime.fromMillis(
                    props.row.latestMessage.sentAt.toMillis()
                  ).toLocaleString({
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                }}
              </div>
            </div>
          </q-td>
          <!-- Applicant -->
          <q-td key="applicant" :props="props">
            <q-btn
              @click="openDialogApplicantDocuments(props.row.id)"
              :label="
                props.row.name
                  ? `${props.row.name.first} ${props.row.name.middle} ${props.row.name.last}`
                  : props.row.email
              "
              color="primary"
              flat
              dense
              no-caps
            />
          </q-td>
          <!-- Docs Status -->
          <q-td key="document" :props="props">
            <q-btn
              @click="null"
              v-if="props.row.status === 'complete'"
              class="text-body2 text-positive"
              no-caps
              flat
              dense
              icon="fas fa-check"
              label="Complete"
            />
            <q-btn
              @click="null"
              v-else-if="props.row.status === 'incomplete'"
              class="text-body2 text-purple"
              no-caps
              flat
              dense
              icon="far fa-dot-circle"
              label="Incomplete"
            />
            <div v-else class="text-grey-7 text-body2">Not Submitted</div>
          </q-td>
          <!-- Action Button -->
          <q-td key="action" :props="props">
            <q-btn
              @click="openDialogAction(props.row.id)"
              v-if="
                props.row.adminAcceptedDocs > props.row.acceptedDocs ||
                props.row.unCheckedOptionalDocs > 0
              "
              label="Check Documents"
              color="negative"
              class="full-width"
              no-caps
            />
            <div v-else class="text-h5">-</div>
          </q-td>
          <!-- Resend button -->
          <q-td key="resend" :props="props">
            <q-btn
              v-if="
                !applicantsResendControl[props.row.id].isResent ||
                props.row.resendLink
              "
              @click="resendLink(props.row.id)"
              :loading="
                props.row.resendLink ||
                applicantsResendControl[props.row.id].isLoading
              "
              label="Resend"
              color="primary"
              class="full-width"
              outline
              no-caps
            />
            <q-btn
              v-else
              label="Sent"
              icon="fas fa-check"
              color="positive"
              class="full-width"
              outline
              no-caps
            />
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, computed, watch } from 'vue';
import { QTableProps, useQuasar } from 'quasar';
import Header from './headers/DashboardCollectorHeader.vue';
import { Applicant, PublishedDashboard, User } from 'src/utils/types';
import { useUserStore } from 'src/stores/user-store';
import { DateTime } from 'luxon';
import DialogDashboardApplicantForm from './dialogs/DialogDashboardApplicantForm.vue';
import * as amplitude from '@amplitude/analytics-browser';
import { dbDocRefs } from 'src/utils/db';
import { updateDoc, deleteField } from '@firebase/firestore';
import { useDashboardStore } from 'src/stores/dashboard-store';
import { storeToRefs } from 'pinia';

type ApplicantWithLoader = Applicant & { id: string; isResent?: boolean };

const headerRef = ref<InstanceType<typeof Header> | null>(null);

const props = defineProps<{
  dashboard: PublishedDashboard & { id: string };
}>();

const { user } = useUserStore();
const dashboardStore = useDashboardStore();
const { applicants, applicantsResendControl } = storeToRefs(dashboardStore);

const companyId = (user as User & { id: string }).company.id;

const activeApplicants = computed(() =>
  applicants.value.filter((applicant) => !applicant.isDeleted)
);

const incompleteApplicants = computed(() =>
  activeApplicants.value.filter(
    (applicant) =>
      applicant.status === 'incomplete' || applicant.status === 'not-submitted'
  )
);
const completeApplicants = computed(() =>
  activeApplicants.value.filter((applicant) => applicant.status === 'complete')
);
const actionApplicants = computed(() =>
  activeApplicants.value.filter(
    (applicant) =>
      applicant.adminAcceptedDocs > applicant.acceptedDocs ||
      applicant.unCheckedOptionalDocs > 0
  )
);

const activeHeader = computed(() => {
  if (headerRef.value) {
    return headerRef.value.active;
  } else {
    return 0;
  }
});

const filteredApplicants = computed(() => {
  const applicantsFilters = [
    activeApplicants.value,
    incompleteApplicants.value,
    completeApplicants.value,
    actionApplicants.value,
  ];
  return applicantsFilters[activeHeader.value];
});

const $q = useQuasar();
const columns: QTableProps['columns'] = [
  {
    name: 'index',
    required: true,
    label: '#',
    align: 'left',
    field: 'index',
    sortable: true,
  },
  {
    name: 'status',
    required: true,
    label: 'Message Status',
    align: 'left',
    field: 'status',
    sortable: true,
  },
  {
    name: 'applicant',
    align: 'left',
    label: 'Applicant',
    field: 'applicant',
    sortable: true,
  },
  {
    name: 'document',
    label: 'Documents',
    align: 'left',
    field: 'document',
    sortable: true,
  },
  {
    name: 'action',
    label: 'Action Required',
    align: 'center',
    field: 'action',
    sortable: true,
  },
  {
    name: 'resend',
    label: 'Resend Link',
    align: 'center',
    field: 'resend',
    sortable: false,
  },
];

const selected = ref<ApplicantWithLoader[]>([]);

const addApplicant = () => {
  $q.dialog({
    component: DialogDashboardApplicantForm,
    componentProps: {
      dashboardId: props.dashboard.id,
    },
  });
};

const openDialogAction = (applicantId: string) => {
  const applicant = applicants.value.find(
    (applicant) => applicant.id === applicantId
  );
  if (!applicant) return;
  const NUM_OF_UNCHECKED_DOCS =
    applicant.adminAcceptedDocs - applicant.acceptedDocs;
  amplitude.track('Check - Click Red Check Documents Button', {
    applicantId: applicant.id,
    applicantStatus: applicant.status,
    numOfUncheckedDocs: NUM_OF_UNCHECKED_DOCS,
  });
  $q.dialog({
    component: defineAsyncComponent(
      () =>
        import('src/components/dashboards/dialogs/DialogActionDocuments.vue')
    ),
    componentProps: {
      companyId,
      applicantId,
      applicantName: applicant.name,
    },
  });
};

const openDialogApplicantDocuments = (applicantId: string) => {
  const applicantIndex = applicants.value.findIndex(
    (applicant) => applicant.id === applicantId
  );
  const applicant = applicants.value[applicantIndex];
  if (!applicant) return;
  const NUM_OF_UNCHECKED_DOCS =
    applicant.adminAcceptedDocs - applicant.acceptedDocs;
  amplitude.track('Click Applicant on Dashboard', {
    applicantId: applicant.id,
    applicantStatus: applicant.status,
    numOfUncheckedDocs: NUM_OF_UNCHECKED_DOCS,
    numOfAcceptedDocs: applicant.acceptedDocs,
  });
  $q.dialog({
    component: defineAsyncComponent(
      () =>
        import('src/components/dashboards/dialogs/DialogApplicantDocuments.vue')
    ),
    componentProps: {
      companyId,
      applicantId: applicant.id,
    },
  });
};

const deleteApplicants = async () => {
  if (selected.value.length > 0 && user) {
    $q.dialog({
      title: `Are you sure you want to delete ${selected.value.length} ${
        selected.value.length === 1 ? 'applicant' : 'applicants'
      }?`,
      ok: {
        outline: true,
        label: 'Yes',
        color: 'primary',
      },
      cancel: {
        label: 'No',
        color: 'primary',
      },
    })
      .onOk(async () => {
        const promises: Promise<void>[] = [];
        selected.value.forEach((applicant) => {
          const COMPANY_ID = user.company.id;
          const DASHBOARD_ID = props.dashboard.id;
          const APPLICANT_ID = applicant.id;
          const applicantRef = dbDocRefs.getApplicantRef(
            COMPANY_ID,
            DASHBOARD_ID,
            APPLICANT_ID
          );
          const promise = updateDoc(applicantRef, {
            isDeleted: true,
          });
          promises.push(promise);
        });
        await Promise.all(promises);
        selected.value = []; // Clear the selected deleted applicants
      })
      .onCancel(() => {
        return;
      });
  } else {
    console.log('No applicants have been selected');
    $q.notify({
      message: 'No applicants have been selected',
      type: 'negative',
    });
  }
};

const resendLink = async (applicantId: string) => {
  const index = applicants.value.findIndex(
    (applicantInList) => applicantInList.id === applicantId
  );
  const applicant = applicants.value[index];
  const resendControl = applicantsResendControl.value[applicantId];
  if (!user || !applicant) return;
  try {
    resendControl.isLoading = true;
    const companyId = user.company.id;
    const { dashboard, id } = applicant;
    const applicantRef = dbDocRefs.getApplicantRef(companyId, dashboard.id, id);
    await updateDoc(applicantRef, {
      resendLink: true,
      latestMessage: deleteField(),
    });
    resendControl.isResent = true;
  } catch (error) {
    console.log(error);
    $q.notify({
      message: 'Failed to resend link',
      type: 'negative',
    });
  } finally {
    resendControl.isLoading = false;
  }
};

watch(
  applicants,
  (newVal) => {
    console.log(newVal);
  },
  { deep: true }
);
</script>

<style scoped></style>
