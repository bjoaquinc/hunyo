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
        <q-input
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
        </q-input>
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
            @click="openDialogCreateNewDashboard"
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
            <q-item class="q-py-md text-h6 text-weight-regular">
              <q-item-section>
                Poland - Butcher - Visa Application
              </q-item-section>
              <q-item-section avatar>
                <q-btn label="Copy" outline color="primary" />
              </q-item-section>
            </q-item>
            <q-item class="q-py-md text-h6 text-weight-regular">
              <q-item-section>
                Poland - Butcher - Visa Application
              </q-item-section>
              <q-item-section avatar>
                <q-btn label="Copy" outline color="primary" />
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
import { ref } from 'vue';
import EssentialLink from 'components/EssentialLink.vue';
import { useUserStore } from 'src/stores/user-store';
import { storeToRefs } from 'pinia';
import DialogCreateNewDashboard from 'src/components/create-dashboard/DialogCreateNewDashboard.vue';
import { useQuasar } from 'quasar';

const store = useUserStore();
const { user } = storeToRefs(store);
const q = useQuasar();

const searchText = ref('');

const essentialLinks = [
  {
    title: 'Dashboards',
    caption: 'All dashboards created',
    icon: 'fas fa-table-columns',
    link: '/auth/dashboards',
  },
  {
    title: 'Links',
    caption: 'All download links created',
    icon: 'fas fa-link',
    link: 'https://github.com/quasarframework',
  },
  {
    title: 'Applicants',
    caption: 'All applicants added',
    icon: 'fas fa-users',
    link: 'https://twitter.quasar.dev',
  },
];

const leftDrawerOpen = ref(false);
const createDocumentRequestTemplate = ref(false);

const openDialogCreateNewDashboard = () => {
  q.dialog({
    component: DialogCreateNewDashboard,
  }).onOk(() => {
    createDocumentRequestTemplate.value = false;
  });
};

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>
