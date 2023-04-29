<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          {{ user ? user.company.name : 'Create an Account' }}
        </q-toolbar-title>
        <q-btn @click="signOut" label="Sign out" color="white" flat />
        <!-- <q-input
          v-model="searchText"
          outlined
          type="search"
          class="q-mx-sm bg-white"
          placeholder="Search Database"
          dense
        >
          <template v-slot:append>
            <q-icon name="fas fa-search" />
          </template>
        </q-input> -->
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above v-model="leftDrawerOpen" bordered>
      <q-list>
        <div class="q-mx-md">
          <q-img style="max-width: 150px" src="~assets/logo-icon.png" />

          <q-btn
            @click="createDocumentRequestTemplate = true"
            label="New"
            class="q-my-sm full-width"
            color="primary"
            icon="fas fa-plus"
            stretch
          />
        </div>

        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-dialog
      v-model="createDocumentRequestTemplate"
      style="max-width: 600px"
      position="left"
      maximized
    >
      <q-card style="width: 600px" flat>
        <q-card-section>
          <div class="flex justify-between">
            <div class="text-h4">Document Requests</div>
            <q-btn
              @click="createDocumentRequestTemplate = false"
              flat
              icon="fas fa-times"
              dense
            />
          </div>
          <q-separator class="q-mt-md" />
          <q-btn
            @click="createNewDashboard"
            icon="fas fa-list-check"
            size="lg"
            outline
            class="full-width q-mt-lg q-py-lg"
            label="New Request for Documents"
            color="primary"
          />
          <div class="q-mt-xl text-h5 text-weight-medium">
            Copy Previous Requests
          </div>
          <q-separator class="q-mt-md" />
          <q-list separator>
            <q-item
              v-for="dashboard in publishedDashboards"
              :key="dashboard.id"
              class="q-py-md text-h6 text-weight-regular"
            >
              <q-item-section>
                {{ dashboard.title }}
              </q-item-section>
              <q-item-section avatar>
                <q-btn
                  @click="copyPreviousDashboard(dashboard)"
                  label="Copy"
                  outline
                  color="primary"
                />
              </q-item-section>
            </q-item>
          </q-list>
          <div class="q-mt-xl text-h5 text-weight-medium">
            Draft Document Requests
          </div>
          <q-separator class="q-mt-md" />
          <q-list separator>
            <q-item
              :to="{
                name: 'DocumentRequestTemplate',
                params: { dashboardId: dashboard.id },
              }"
              class="q-py-md text-h6 text-weight-regular"
              clickable
              v-ripple
              v-for="dashboard in draftDashboards"
              :key="dashboard.id"
            >
              <q-item-section>
                {{ dashboard.title }}
              </q-item-section>
              <q-item-section avatar side>
                <q-icon name="fas fa-angle-double-right" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-page-container style="min-height: inherit">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import EssentialLink from 'components/EssentialLink.vue';
import { useUserStore } from 'src/stores/user-store';
import { useAuthStore } from 'src/stores/auth-store';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import DialogCreateNewDashboard from 'src/components/create-dashboard/DialogCreateNewDashboard.vue';
import { useQuasar } from 'quasar';
import { DraftDashboard, PublishedDashboard } from 'src/utils/types';
import { dbColRefs } from 'src/utils/db';
import {
  onSnapshot,
  query,
  Unsubscribe,
  where,
  orderBy,
} from '@firebase/firestore';

const store = useUserStore();
const { user } = storeToRefs(store);
const { logOut } = useAuthStore();
const q = useQuasar();
const router = useRouter();

// const searchText = ref('');

const essentialLinks = [
  {
    title: 'Dashboards',
    caption: 'All dashboards created',
    icon: 'fas fa-table-columns',
    link: '/auth/dashboards',
  },
  {
    title: 'Team',
    caption: 'Manage team members',
    icon: 'fas fa-people-group',
    link: '/auth/team',
  },
  {
    title: 'Links',
    caption: 'All download links created',
    icon: 'fas fa-link',
    link: '/auth/links',
  },
];

const draftDashboards = ref<(DraftDashboard & { id: string })[] | null>([]);
const unsubDraftDashboards = ref<Unsubscribe | null>(null);
const publishedDashboards = ref<(PublishedDashboard & { id: string })[] | null>(
  null
);
const unsubPublishedDashboards = ref<Unsubscribe | null>(null);
const leftDrawerOpen = ref(false);
const createDocumentRequestTemplate = ref(false);

onMounted(() => {
  getDraftDashboards();
  getPublishedDashboards();
});

const getDraftDashboards = async () => {
  if (!user.value) return;
  const draftDashboardsRef = dbColRefs.getDraftDashboardsRef(
    user.value.company.id
  );
  const q = query(
    draftDashboardsRef,
    where('isPublished', '==', false),
    orderBy('createdAt')
  );
  unsubDraftDashboards.value = onSnapshot(q, (snapshot) => {
    draftDashboards.value = snapshot.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
      } as DraftDashboard & { id: string };
    });
  });
};

const getPublishedDashboards = async () => {
  if (!user.value) return;
  const publishedDashboardsRef = dbColRefs.getPublishedDashboardsRef(
    user.value.company.id
  );
  const q = query(
    publishedDashboardsRef,
    where('isPublished', '==', true),
    orderBy('createdAt', 'desc')
  );
  unsubPublishedDashboards.value = onSnapshot(q, (snapshot) => {
    publishedDashboards.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  });
};

const createNewDashboard = () => {
  q.dialog({
    component: DialogCreateNewDashboard,
  }).onOk(() => {
    createDocumentRequestTemplate.value = false;
  });
};

const copyPreviousDashboard = (
  dashboard: PublishedDashboard & { id: string }
) => {
  q.dialog({
    component: DialogCreateNewDashboard,
    componentProps: {
      dashboard,
    },
  }).onOk(() => {
    createDocumentRequestTemplate.value = false;
  });
};

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

const signOut = async () => {
  await logOut();
  router.push({ name: 'LandingPage' });
};

onUnmounted(() => {
  unsubDraftDashboards.value?.();
  unsubPublishedDashboards.value?.();
});
</script>
