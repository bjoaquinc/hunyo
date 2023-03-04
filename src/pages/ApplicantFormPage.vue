<template>
  <q-page>
    <ApplicantFormMain v-if="isReady && form" :form="form" />
    <div v-else class="absolute-center">
      <q-spinner-pie size="80px" color="primary" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onSnapshot, Unsubscribe } from '@firebase/firestore';
import { getDownloadURL } from '@firebase/storage';
import { useQuasar } from 'quasar';
import ApplicantFormMain from 'src/components/forms/ApplicantFormMain.vue';
import DialogFormName from 'src/components/forms/dialogs/DialogFormName.vue';
import DialogFormReminder from 'src/components/forms/dialogs/DialogFormReminder.vue';
import { dbDocRefs } from 'src/utils/db';
import { storageRefs } from 'src/utils/storage';
import { Form } from 'src/utils/types';
import { onMounted, onUnmounted, ref } from 'vue';
import { signInAnonymously, getAuth } from 'firebase/auth';
import { useAuthStore } from 'src/stores/auth-store';

const props = defineProps<{
  formId: string;
}>();
const $q = useQuasar();
const unsubForm = ref<Unsubscribe | null>(null);
const authStore = useAuthStore();
const form = ref<(Form & { id: string }) | null>(null);
const isReady = ref(false);
const logoURL = ref('');

onMounted(async () => {
  await setApplicantAuth();
  await setForm();
});

onUnmounted(() => {
  if (unsubForm.value) {
    unsubForm.value();
  }
});

const setForm = async () => {
  const formRef = dbDocRefs.getFormRef(props.formId);
  await new Promise((resolve, reject) => {
    let runOnce = () => {
      runOnce = () => {
        return;
      };
      isReady.value = true;
      showReminder();
      resolve;
    };
    unsubForm.value = onSnapshot(
      formRef,
      async (docSnap) => {
        const docData = docSnap.data();
        if (docData) {
          form.value = { id: docSnap.id, ...docData };
          if (docData.company.logo && !logoURL.value) {
            logoURL.value = await getLogoURL(docData.company.logo);
          }
          if (!docData.applicant.name) {
            $q.dialog({
              component: DialogFormName,
              componentProps: {
                formId: props.formId,
                logo: logoURL.value,
              },
            });
          }
        }
        runOnce();
      },
      reject
    );
  });
};

const setApplicantAuth = async () => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      console.log('signing in anonymously');
      await signInAnonymously(auth);
      await authStore.getValidatedUser();
    }
  } catch (error) {
    console.error(error);
  }
};

const showReminder = () => {
  $q.dialog({
    component: DialogFormReminder,
  });
};

const getLogoURL = async (logoName: string) => {
  const logoRef = storageRefs.getLogoRef(logoName);
  const url = await getDownloadURL(logoRef);
  return url;
};
</script>

<style scoped></style>
