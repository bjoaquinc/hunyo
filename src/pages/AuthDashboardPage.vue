<template>
  <q-page>
    <DashboardDocumentCollector
      v-if="dashboard"
      :dashboard="dashboard"
      :applicants="applicants"
    />
    <!-- <q-inner-loading :showing="trackNewApplicantsBeingAdded" color="white">
      <q-spinner-pie size="80px" color="primary" />
      <div class="text-subtitle1 q-mt-sm text-grey8">Adding applicants...</div>
    </q-inner-loading> -->
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { useDashboardStore } from 'src/stores/dashboard-store';
import { dbDocRefs } from 'src/utils/db';
import { useUserStore } from 'src/stores/user-store';
import { storeToRefs } from 'pinia';
import DashboardDocumentCollector from 'src/components/dashboards/DashboardDocumentCollector.vue';

const store = useDashboardStore();
const { setDashboard, setApplicants, clearDashboard } = store;
const { dashboard, applicants, unsubDashboard, unsubApplicants } =
  storeToRefs(store);
const { user } = useUserStore();
const props = defineProps(['dashboardId']);

onMounted(async () => {
  if (!user) return;
  const dashboardRef = dbDocRefs.getPublishedDashboardRef(
    user.company.id,
    props.dashboardId
  );
  await setDashboard(dashboardRef);
  if (dashboard.value) {
    await setApplicants(user.company.id, props.dashboardId);
  }
});

onUnmounted(() => {
  if (unsubDashboard.value) {
    unsubDashboard.value();
  }
  if (unsubApplicants.value) {
    unsubApplicants.value();
  }

  clearDashboard();
});

watch(
  props,
  async (newValue) => {
    if (unsubDashboard.value) {
      unsubDashboard.value();
    }
    if (unsubApplicants.value) {
      unsubApplicants.value();
    }

    clearDashboard();

    if (!user) return;
    const dashboardRef = dbDocRefs.getPublishedDashboardRef(
      user.company.id,
      newValue.dashboardId
    );
    await setDashboard(dashboardRef);
    if (dashboard.value) {
      await setApplicants(user.company.id, newValue.dashboardId);
    }
  },
  {
    deep: true,
  }
);
</script>

<style scoped></style>
