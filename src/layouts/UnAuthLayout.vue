<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="bg-white">
        <q-img style="max-width: 150px" src="~assets/logo-icon.png" />
      </q-toolbar>
    </q-header>

    <q-page-container style="min-height: inherit">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts"></script>
