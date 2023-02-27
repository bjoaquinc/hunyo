<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" persistent>
    <q-card v-if="action" class="full-width">
      <q-card-section>
        <div class="full-width">
          <q-card-section>
            <div class="flex justify-between">
              <div class="text-h5">
                Verify
                {{
                  `${action.applicant.name?.first} ${action.applicant.name?.last}`
                }}'s Documents
              </div>
              <q-btn icon="fas fa-times" color="grey-8" flat v-close-popup />
            </div>
          </q-card-section>
          <q-card-section>
            <q-list separator>
              <q-separator />
              <q-item
                @click="openDialogActionVerifyDocument(index)"
                class="flex column"
                v-for="(doc, index) in docsWithFiles"
                :key="index"
                clickable
                v-ripple
              >
                <q-item-section>
                  <div class="flex justify-between">
                    <div class="text-h6">{{ doc.name }}</div>
                    <div class="flex text-grey-8 text-subtitle2 items-center">
                      <div>VIEW DOCUMENT</div>
                      <q-icon class="q-ml-sm" name="fas fa-chevron-right" />
                    </div>
                  </div>
                </q-item-section>
              </q-item>
              <q-separator />
            </q-list>
          </q-card-section>
          <q-card-section>
            <q-slide-transition v-show="hasCheckedAllDocs">
              <div class="flex justify-around">
                <q-btn label="Documents Complete" color="primary" />
                <q-btn label="Documents Incomplete" color="primary" outline />
              </div>
            </q-slide-transition>
          </q-card-section>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { QDialog, useDialogPluginComponent, useQuasar } from 'quasar';
import { ref } from 'vue';
import DialogActionVerifyDocument from './DialogActionVerifyDocument.vue';

const { dialogRef, onDialogHide } = useDialogPluginComponent();
const hasCheckedAllDocs = ref(false);
const $q = useQuasar();

const docsWithFiles = [
  {
    name: 'Passport',
    url: 'https://www.google.com',
    status: 'accepted',
    reasonForRejection: '',
  },
  {
    name: 'Proof of Address',
    url: 'https://www.google.com',
    status: 'accepted',
    reasonForRejection: '',
  },
  {
    name: 'Proof of Income',
    url: 'https://www.google.com',
    status: 'accepted',
    reasonForRejection: '',
  },
];
const action = {
  applicant: {
    name: {
      first: 'Joaquin',
      last: 'Coromina',
    },
  },
};

const openDialogActionVerifyDocument = (index: number) => {
  console.log('running');
  $q.dialog({
    component: DialogActionVerifyDocument,
    componentProps: {
      doc: docsWithFiles[index],
    },
  });
};

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);
</script>
