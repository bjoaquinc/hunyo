<template>
  <div class="q-pa-lg">
    <Header v-bind="dashboard" ref="headerRef" />
    <q-table
      class="q-mt-xl"
      :rows="filteredApplicants"
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

              <q-item clickable v-close-popup>
                <q-item-section avatar>
                  <q-icon color="grey-8" name="fas fa-envelope" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>SEND MESSAGE</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable v-close-popup>
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
                <q-item-section>
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
              :label="
                props.row.name
                  ? `${props.row.name.first} ${props.row.name.last}`
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
              v-if="props.row.adminAcceptedDocs > props.row.acceptedDocs"
              label="Check Documents"
              color="negative"
              class="full-width"
              no-caps
            />
            <div v-else class="text-h5">-</div>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, computed } from 'vue';
import { QTableProps, useQuasar } from 'quasar';
import Header from './headers/DashboardCollectorHeader.vue';
import { Applicant, PublishedDashboard, User } from 'src/utils/types';
import { useUserStore } from 'src/stores/user-store';
import { DateTime } from 'luxon';

const headerRef = ref<InstanceType<typeof Header> | null>(null);

const props = defineProps<{
  dashboard: PublishedDashboard & { id: string };
  applicants: (Applicant & { id: string })[];
}>();

const { user } = useUserStore();
const companyId = (user as User & { id: string }).company.id;

const incompleteApplicants = computed(() =>
  props.applicants.filter(
    (applicant) =>
      applicant.status === 'incomplete' || applicant.status === 'not-submitted'
  )
);
const completeApplicants = computed(() =>
  props.applicants.filter((applicant) => applicant.status === 'complete')
);
const actionApplicants = computed(() =>
  props.applicants.filter(
    (applicant) => applicant.adminAcceptedDocs > applicant.acceptedDocs
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
    props.applicants,
    incompleteApplicants.value,
    completeApplicants.value,
    actionApplicants.value,
  ];
  return applicantsFilters[activeHeader.value];
});

const q = useQuasar();
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
];

const selected = ref([]);

const openDialogAction = (applicantId: string) => {
  q.dialog({
    component: defineAsyncComponent(
      () =>
        import('src/components/dashboards/dialogs/DialogActionDocuments.vue')
    ),
    componentProps: {
      companyId,
      applicantId,
      applicantName: props.applicants.find(
        (applicant) => applicant.id === applicantId
      )?.name,
    },
  });
};
</script>

<style scoped></style>
