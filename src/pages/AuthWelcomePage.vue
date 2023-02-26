<template>
  <q-page class="row items-center justify-evenly">
    <div class="flex column q-mx-xl" style="max-width: 800px">
      <div class="text-h1 text-center">Welcome to Hunyo!</div>
      <q-btn
        @click="openDialogCreateNewDashboard"
        class="q-mx-auto q-mt-lg"
        label="Collect Documents"
        size="xl"
        color="primary"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import DialogCreateNewDashboard from 'src/components/create-dashboard/DialogCreateNewDashboard.vue';

const q = useQuasar();

const openDialogCreateNewDashboard = () => {
  q.dialog({
    component: DialogCreateNewDashboard,
  });
};
</script>

<style scoped></style>
