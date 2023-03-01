<template>
  <q-page>
    <div class="q-pa-lg container">
      <div class="text-h5">Links</div>
      <q-list bordered class="q-mt-md">
        <q-item-label header>Active Links (0)</q-item-label>
        <q-item>
          <q-item-section>
            <q-item-label class="text-subtitle1 text-weight-bold text-grey-8"
              >No active links</q-item-label
            >
          </q-item-section>
        </q-item>
        <!-- <q-item
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
        </q-item> -->

        <q-separator />

        <q-item-label header>Inactive Links (0)</q-item-label>
        <q-item>
          <q-item-section>
            <q-item-label class="text-subtitle1 text-weight-bold text-grey-7"
              >No inactive links</q-item-label
            >
          </q-item-section>
        </q-item>

        <!-- <q-item
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
        </q-item> -->
      </q-list>
    </div>
  </q-page>
</template>

<script setup lang="ts"></script>

<style lang="sass" scoped>
.container
  max-width: 800px
  @media only screen and (width > $breakpoint-md)
    margin-left: 100px
    max-width: 1000px
</style>
