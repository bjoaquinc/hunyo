<template>
  <q-page>
    <div class="absolute-center">
      <q-card class="my-card text-grey-8">
        <q-card-section>
          <q-img src="~assets/hrd.png" style="max-width: 200px" />

          <div class="flex justify-between items-end q-mt-sm">
            <div @click="editTitle = true" v-if="!editTitle" class="text-h5">
              {{ title }}
            </div>
            <q-input
              v-else
              @keyDown.enter="editTitle = false"
              @blur="editTitle = false"
              autofocus
              autogrow
              outlined
              color="primary"
              class="text-h5"
              input-class="text-h5"
              input-style="line-height: 27px"
              v-model="title"
            />
            <div class="text-h6">Deadline: <strong>March 03, 2023</strong></div>
          </div>

          <q-separator class="q-my-md" />
          <div class="q-mt-sm text-subtitle1">
            (You can submit documents one at a time)
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-list class="gt-sm" separator>
            <q-item
              @click="openDocumentDialog(index)"
              class="text-h6 q-py-md rounded-borders"
              v-for="(doc, index) in docs"
              :key="index"
              :clickable="documentItemStyles[doc.status].clickable"
              :v-ripple="documentItemStyles[doc.status].clickable"
            >
              <q-item-section avatar>
                <q-icon
                  name="fas fa-file"
                  :color="documentItemStyles[doc.status].color"
                />
              </q-item-section>
              <q-item-section>{{ doc.name }}</q-item-section>
              <q-item-section class="text-subtitle1 text-grey-8">
                <div
                  class="q-ml-auto flex items-center"
                  :class="`text-${documentItemStyles[doc.status].color}`"
                >
                  {{ documentItemStyles[doc.status].actionLabel
                  }}<q-icon
                    v-if="documentItemStyles[doc.status].actionIcon"
                    :name="(documentItemStyles[doc.status].actionIcon as string)"
                    class="q-ml-md"
                    size="sm"
                  />
                </div>
              </q-item-section>
            </q-item>
            <q-separator />
          </q-list>
          <q-list class="lt-md" separator>
            <q-item
              @click="openDocumentDialog(index)"
              class="text-subtitle1 q-py-md"
              v-for="(doc, index) in docs"
              :key="index"
              :clickable="documentItemStyles[doc.status].clickable"
              :v-ripple="documentItemStyles[doc.status].clickable"
            >
              <q-item-section
                :class="`text-${documentItemStyles[doc.status].color}`"
                >Upload {{ doc.name }}</q-item-section
              >
              <q-item-section avatar>
                <q-icon
                  :name="documentItemStyles[doc.status].actionIcon"
                  size="xs"
                  :color="documentItemStyles[doc.status].color"
                />
              </q-item-section>
            </q-item>
            <q-separator />
          </q-list>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { ref } from 'vue';
import DialogFormDocument from 'src/components/forms/DialogFormDocument.vue';

const title = ref('Submit the documents below');
const editTitle = ref(false);

const q = useQuasar();
const documentItemStyles = {
  'not submitted': {
    color: 'primary',
    actionIcon: 'fas fa-chevron-right',
    actionLabel: 'Submit now',
    clickable: true,
  },
  submitted: {
    color: 'grey-8',
    actionIcon: 'fas fa-check',
    actionLabel: 'Submitted',
    clickable: false,
  },
  accepted: {
    color: 'positive',
    actionIcon: 'fas fa-check',
    actionLabel: 'Accepted',
    clickable: false,
  },
  rejected: {
    color: 'negative',
    actionIcon: 'fas fa-times',
    actionLabel: 'Rejected',
    clickable: true,
  },
};
const docs: {
  name: string;
  status: 'not submitted' | 'submitted' | 'accepted' | 'rejected';
}[] = [
  { name: 'Passport', status: 'not submitted' },
  { status: 'not submitted', name: 'PRC Card' },
  { status: 'accepted', name: 'Birth Certificate' },
  { status: 'not submitted', name: 'Marriage Certificate' },
  { status: 'not submitted', name: 'CENMAR / CENOMAR' },
  { status: 'not submitted', name: 'Official Transcript of Records (TOR)' },
  {
    status: 'not submitted',
    name: 'Summary of Related Learning Experience (RLE)',
  },
  { status: 'rejected', name: 'Certificate of Passing' },
  { status: 'not submitted', name: 'Certificate of Rating' },
  { status: 'not submitted', name: 'Certificate of good Standing' },
  { status: 'submitted', name: 'Board Certificate / PRC Certificate' },
  { status: 'not submitted', name: 'Foreign Employment Certificate' },
  { status: 'not submitted', name: 'Local Employment Certificate' },
  { status: 'not submitted', name: 'Language Certificate' },
  { status: 'not submitted', name: 'Police Clearance' },
  { status: 'not submitted', name: 'NBI Clearance' },
  { status: 'not submitted', name: 'Diploma' },
];

const openDocumentDialog = (index: number) => {
  q.dialog({
    component: DialogFormDocument,
    componentProps: {
      doc: docs[index],
    },
  });
};
</script>

<style lang="sass" scoped>
.my-card
  min-width: 900px
  max-height: 80vh
  overflow: auto
  padding: 18px
  @media only screen and (width < $breakpoint-sm)
    min-width: 10px
    width: 100vw
    max-height: 2000px
    height: 100vh
    padding: 8px
</style>
