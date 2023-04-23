<template>
  <div>
    <div class="text-h4 q-mt-sm">{{ title }}</div>
    <div class="row q-col-gutter-lg q-mt-sm">
      <div class="col">
        <q-btn
          @click="clickFilter(0)"
          size="lg"
          class="full-width q-py-lg full-height"
          :class="active === 0 ? 'active' : ''"
          style="border-left: 3px solid grey"
          stack
        >
          <div class="text-h2">{{ applicantsCount }}</div>
          <div class="text-body2 q-mt-md">Total Applicants</div>
        </q-btn>
      </div>
      <div class="col">
        <q-btn
          @click="clickFilter(1)"
          size="lg"
          class="full-width q-py-lg full-height"
          :class="active === 1 ? 'active' : ''"
          style="border-left: 3px solid purple"
          stack
        >
          <div class="text-h2">{{ incompleteApplicantsCount }}</div>
          <div class="text-body2 q-mt-md">Incomplete Applicants</div>
        </q-btn>
      </div>
      <div class="col">
        <q-btn
          @click="clickFilter(2)"
          size="lg"
          class="full-width q-py-lg full-height"
          :class="active === 2 ? 'active' : ''"
          style="border-left: 3px solid green"
          stack
        >
          <div class="text-h2">{{ completeApplicantsCount }}</div>
          <div class="text-body2 q-mt-md">Complete Applicants</div>
        </q-btn>
      </div>
      <div class="col">
        <q-btn
          @click="clickFilter(3)"
          size="lg"
          class="full-width q-py-lg full-height"
          :class="active === 3 ? 'active' : ''"
          style="border-left: 3px solid red"
          stack
        >
          <div class="text-h2">{{ actionsCount }}</div>
          <div class="text-body2 q-mt-md">Action Required</div>
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import * as amplitude from '@amplitude/analytics-browser';

export interface CollectorHeader {
  title?: string;
  actionsCount?: number;
  applicantsCount?: number;
  completeApplicantsCount?: number;
  incompleteApplicantsCount?: number;
}

const active = ref(0);

withDefaults(defineProps<CollectorHeader>(), {
  title: '',
  actionsCount: 0,
  applicantsCount: 0,
  completeApplicantsCount: 0,
  incompleteApplicantsCount: 0,
});

const activeIndexes = [
  'Total Applicants',
  'Incomplete Applicants',
  'Complete Applicants',
  'Action Required',
];

const clickFilter = (activeIndex: number) => {
  amplitude.track('Click Dashboard Overview', {
    filterType: activeIndexes[activeIndex],
  });
  active.value = activeIndex;
};

defineExpose({
  active,
});
</script>

<style lang="sass" scoped>
.active
  border-left-width: 8px !important
  background-color: $grey-3
</style>
