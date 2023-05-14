<template>
  <q-page>
    <div class="absolute-center text-h4 text-grey-7 text-center">
      <q-icon name="fas fa-file-arrow-up" color="grey-7" size="200px" />
      <div class="q-pt-lg">{{ doc.name }} submitted!</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ApplicantDocument } from 'src/utils/new-types';

defineProps<{
  doc: ApplicantDocument & { id: string };
}>();
</script>

<style lang="sass" scoped></style>
