<template>
  <q-page>
    <div class="q-pa-lg container">
      <div class="text-h5">Dashboards</div>
      <q-list bordered class="q-mt-md">
        <q-item-label header
          >Your Dashboards ({{ yourDashboards.length }})</q-item-label
        >
        <q-item
          v-for="(dashboard, index) in yourDashboards"
          :key="index"
          :to="{ name: 'DashboardPage', params: { dashboardId: dashboard.id } }"
          class="q-my-sm"
          clickable
          v-ripple
        >
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white">{{
              dashboard.title[0].toUpperCase()
            }}</q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label
              class="text-subtitle1 text-weight-bold text-primary"
              >{{ dashboard.title }}</q-item-label
            >
          </q-item-section>

          <q-item-section side>
            <q-icon name="fas fa-arrow-right" color="primary" />
          </q-item-section>
        </q-item>

        <q-separator />

        <q-item-label header
          >Company Dashboards ({{ companyDashboards.length }})</q-item-label
        >

        <q-item
          v-for="(dashboard, index) in companyDashboards"
          :key="index"
          :to="{ name: 'DashboardPage', params: { dashboardId: dashboard.id } }"
          class="q-my-sm"
          clickable
          v-ripple
        >
          <q-item-section avatar>
            <q-avatar color="grey-7" text-color="white">{{
              dashboard.title[0].toUpperCase()
            }}</q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-subtitle1 text-weight-bold text-grey-7">{{
              dashboard.title
            }}</q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-icon name="fas fa-arrow-right" color="grey-7" />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onSnapshot, query, Unsubscribe, where } from '@firebase/firestore';
import { useUserStore } from 'src/stores/user-store';
import { dbColRefs } from 'src/utils/db';
import { PublishedDashboard } from 'src/utils/types';
import { onMounted, onUnmounted, ref, computed } from 'vue';

const { user } = useUserStore();
const dashboards = ref<(PublishedDashboard & { id: string })[]>([]);
const unsubDashboards = ref<Unsubscribe | null>(null);
const yourDashboards = computed(() => {
  if (!user) return [];
  return dashboards.value.filter(
    (dashboard) => dashboard.createdBy === user.id
  );
});
const companyDashboards = computed(() => {
  if (!user) return [];
  return dashboards.value.filter(
    (dashboard) => dashboard.createdBy !== user.id
  );
});

onMounted(async () => {
  if (!user) return;
  const dashboardsRef = dbColRefs.getPublishedDashboardsRef(user.company.id);
  const q = query(dashboardsRef, where('isPublished', '==', true));
  await new Promise((resolve) => {
    let resolveOnce = () => {
      resolveOnce = () => {
        return;
      };
      resolve;
    };
    unsubDashboards.value = onSnapshot(q, (dashboardSnap) => {
      const dasboardDocs: (PublishedDashboard & { id: string })[] = [];
      dashboardSnap.forEach((dashboardDoc) => {
        dasboardDocs.push({ id: dashboardDoc.id, ...dashboardDoc.data() });
      });
      dashboards.value = dasboardDocs;
      resolveOnce();
    });
  });
});

onUnmounted(() => {
  if (unsubDashboards.value) {
    unsubDashboards.value();
  }
});
</script>

<style lang="sass" scoped>
.container
  max-width: 800px
  @media only screen and (width > $breakpoint-md)
    margin-left: 100px
    max-width: 1000px
</style>
