<template>
  <div class="absolute-center">
    <q-card class="my-card text-grey-8">
      <q-card-section>
        <q-img :src="logoURL" v-if="logoURL" style="max-width: 200px" />

        <div class="flex justify-between items-end q-mt-sm">
          <div class="text-h5">
            {{ form.dashboard.formContent.header }}
          </div>
          <div class="text-h6 text-negative">
            Deadline:
            <strong>{{ deadline }}</strong>
          </div>
        </div>

        <q-separator class="q-my-md" />
        <div class="q-mt-sm text-subtitle1">
          {{ form.dashboard.formContent.caption }}
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-list class="gt-sm" separator>
          <q-item
            @click="openDialogDocument(index)"
            class="text-h6 q-py-md rounded-borders"
            :class="
              documentItemStyles[doc.status].bgColor
                ? `bg-${documentItemStyles[doc.status].bgColor}`
                : ''
            "
            v-for="(doc, index) in sortedDocs"
            :key="index"
            :clickable="documentItemStyles[doc.status].clickable"
            :v-ripple="documentItemStyles[doc.status].clickable"
          >
            <q-item-section avatar>
              <q-icon
                name="fas fa-file"
                :color="documentItemStyles[doc.status].textColor"
              />
            </q-item-section>
            <q-item-section
              :class="`text-${documentItemStyles[doc.status].textColor}`"
              >{{ doc.name }}</q-item-section
            >
            <q-item-section class="text-subtitle1 text-grey-8">
              <div
                class="q-ml-auto flex items-center"
                :class="`text-${documentItemStyles[doc.status].textColor}`"
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
            @click="openDialogDocument(index)"
            class="text-subtitle1 q-py-md"
            :class="
              documentItemStyles[doc.status].bgColor
                ? `bg-${documentItemStyles[doc.status].bgColor}`
                : ''
            "
            v-for="(doc, index) in sortedDocs"
            :key="index"
            :clickable="documentItemStyles[doc.status].clickable"
            :v-ripple="documentItemStyles[doc.status].clickable"
          >
            <q-item-section
              :class="`text-${documentItemStyles[doc.status].textColor}`"
              >Upload {{ doc.name }}</q-item-section
            >
            <q-item-section avatar>
              <q-icon
                :name="documentItemStyles[doc.status].actionIcon"
                size="xs"
                :color="documentItemStyles[doc.status].textColor"
              />
            </q-item-section>
          </q-item>
          <q-separator />
        </q-list>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { onMounted, ref, computed } from 'vue';
import DialogFormDocument from 'src/components/forms/DialogFormDocument.vue';
import { Form } from 'src/utils/types';
import { storageRefs } from 'src/utils/storage';
import { getDownloadURL } from '@firebase/storage';
import { DateTime } from 'luxon';

const props = defineProps<{
  form: Form & { id: string };
}>();

const deadline = computed(() => {
  const deadlineTimestamp = props.form.dashboard.deadline;
  const dateTime = DateTime.fromMillis(deadlineTimestamp.toMillis());
  return dateTime.toLocaleString({
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  });
});

const q = useQuasar();
const documentItemStyles = {
  'Not Submitted': {
    textColor: 'primary',
    actionIcon: 'fas fa-chevron-right',
    actionLabel: 'Submit now',
    clickable: true,
    bgColor: null,
  },
  Submitted: {
    textColor: 'grey-8',
    actionIcon: 'fas fa-check',
    actionLabel: 'Submitted',
    clickable: false,
    bgColor: null,
  },
  Accepted: {
    textColor: 'positive',
    actionIcon: 'fas fa-check',
    actionLabel: 'Accepted',
    clickable: false,
    bgColor: null,
  },
  Rejected: {
    bgColor: 'negative',
    textColor: 'white',
    actionIcon: 'fas fa-chevron-right',
    actionLabel: 'Rejected. Resubmit now',
    clickable: true,
  },
};
const logoURL = ref('');
const sortedDocs = computed(() => {
  return Object.keys(props.form.docs)
    .map((key) => ({ docId: key, ...props.form.docs[key] }))
    .sort((docA, docB) => docA.docNumber - docB.docNumber);
});

onMounted(async () => {
  const logo = props.form.company.logo;
  if (logo) {
    const logoRef = storageRefs.getLogoRef(logo);
    logoURL.value = await getDownloadURL(logoRef);
  }
});

const openDialogDocument = (index: number) => {
  q.dialog({
    component: DialogFormDocument,
    componentProps: {
      doc: sortedDocs.value[index],
      form: props.form,
      index,
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
