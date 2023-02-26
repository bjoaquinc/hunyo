<template>
  <q-page>
    <div
      class="row q-gutter-md q-py-md"
      v-if="selectedPage && selectedDoc && isReady"
    >
      <q-img class="col" style="width: 100%; height: auto" :src="originalPage">
        <div class="full-width flex transparent">
          <q-btn
            :href="originalPage"
            target="_blank"
            class="q-ml-auto bg-black"
            style="opacity: 0.7"
            round
            icon="fas fa-arrow-down"
            size="lg"
            flat
          />
        </div>
      </q-img>
      <embed
        v-if="selectedDoc.format === 'pdf'"
        :src="fixedPage"
        type="application/pdf"
        style="width: 100%; height: auto"
        class="col"
        inline
      />
      <q-img
        v-else
        class="col"
        style="width: 100%; height: auto"
        :src="fixedPage"
      >
        <div class="full-width flex transparent">
          <q-btn
            :href="fixedPage"
            target="_blank"
            class="q-ml-auto bg-black"
            style="opacity: 0.7"
            round
            icon="fas fa-arrow-down"
            size="lg"
            flat
          />
        </div>
      </q-img>
      <div
        class="col-12 flex justify-around q-py-md"
        v-if="!selectedPage.adminCheckStatus"
      >
        <q-btn
          @click="onAccept"
          :loading="acceptIsLoading"
          label="Accept"
          color="positive"
          size="lg"
        />
        <q-btn label="Reject" color="negative" size="lg" />
        <q-btn label="Replace" color="primary" size="lg" />
      </div>
      <div
        v-else
        class="col-12 text-h3 text-center q-mb-lg q-mt-xl text-positive"
      >
        {{ selectedPage.adminCheckStatus }}
      </div>
    </div>
    <div v-else class="absolute-center text-h3">Select a page...</div>
  </q-page>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue';
import { AdminCheck, AdminCheckDoc, AdminCheckPage } from 'src/utils/types';
import { storageRefs } from 'src/utils/storage';
import { getDownloadURL } from '@firebase/storage';
import { dbDocRefs } from 'src/utils/db';
import { updateDoc } from '@firebase/firestore';

const props = defineProps<{
  selectedPage: (AdminCheckPage & { id: string }) | null;
  selectedDoc: (AdminCheckDoc & { id: string }) | null;
  selectedAdminCheck: (AdminCheck & { id: string }) | null;
}>();

const originalPage = ref('');
const fixedPage = ref('');
const isReady = ref(false);
const acceptIsLoading = ref(false);

watch(
  props,
  async (newValue) => {
    if (
      newValue.selectedPage &&
      newValue.selectedAdminCheck &&
      newValue.selectedDoc
    ) {
      console.log(props.selectedAdminCheck);
      isReady.value = false;
      const originalPageRef = storageRefs.getOriginalDocRef(
        newValue.selectedAdminCheck.companyId,
        newValue.selectedAdminCheck.dashboard.id,
        newValue.selectedAdminCheck.applicant.id,
        `${newValue.selectedPage.name}.jpeg`
      );
      originalPage.value = await getDownloadURL(originalPageRef);
      const fixedPageRef = storageRefs.getFixedDocRef(
        newValue.selectedAdminCheck.companyId,
        newValue.selectedAdminCheck.dashboard.id,
        newValue.selectedAdminCheck.applicant.id,
        `${newValue.selectedPage.name}.${newValue.selectedDoc.format}`
      );
      fixedPage.value = await getDownloadURL(fixedPageRef);
      isReady.value = true;
    }
  },
  { deep: true }
);

const onAccept = async () => {
  acceptIsLoading.value = true;
  if (props.selectedAdminCheck && props.selectedDoc && props.selectedPage) {
    const DOC_COMPUTED_KEY = `docs.${props.selectedDoc.id}`;
    const PAGE_COMPUTED_KEY = `${DOC_COMPUTED_KEY}.pages.${props.selectedPage.id}`;
    const adminCheckRef = dbDocRefs.getAdminCheckRef(
      props.selectedAdminCheck.id
    );
    const updatedAdminCheckData = {
      [`${PAGE_COMPUTED_KEY}.adminCheckStatus`]: 'Accepted',
    };
    await updateDoc(adminCheckRef, {
      ...updatedAdminCheckData,
    });
    acceptIsLoading.value = false;
  }
};
</script>

<style scoped></style>
