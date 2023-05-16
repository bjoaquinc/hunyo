<template>
  <q-page>
    <ApplicantFormMainMobile
      v-if="form && company && $q.platform.is.mobile && !$q.platform.is.ipad"
      :form="form"
      :company="company"
      :documents="documents"
      :logo-url="logoURL"
    />
    <ApplicantFormMainDesktop
      v-else-if="
        form && company && !company.options.mobileOnly && documents.length > 0
      "
      :form="form"
      :company="company"
      :documents="documents"
      :logo-url="logoURL"
    />
    <q-card
      v-else-if="company && company.options.mobileOnly"
      class="card-container absolute-center bg-primary q-pa-xl"
      style="width: 600px; max-width: 100vw"
    >
      <q-card-section class="flex">
        <q-icon
          name="fas fa-mobile-screen-button"
          class="q-mx-auto"
          size="7rem"
          color="white"
        />
      </q-card-section>
      <q-card-section>
        <div class="text-h4 text-white text-center">
          Please use your mobile phone to view requirements
        </div>
      </q-card-section>
    </q-card>
    <q-inner-loading class="absolute-center transparent" :showing="!isReady">
      <q-spinner-pie size="80px" color="primary" />
    </q-inner-loading>
  </q-page>
  <!-- <q-page v-else>
    <q-card
      class="card-container absolute-center bg-primary q-pa-xl"
      style="width: 600px; max-width: 100vw"
    >
      <q-card-section class="flex">
        <q-icon
          name="fas fa-mobile-screen-button"
          class="q-mx-auto"
          size="7rem"
          color="white"
        />
      </q-card-section>
      <q-card-section>
        <div class="text-h4 text-white text-center">
          Please use your mobile phone to view requirements
        </div>
      </q-card-section>
    </q-card>
  </q-page> -->
</template>

<script setup lang="ts">
import {
  onSnapshot,
  orderBy,
  query,
  Unsubscribe,
  where,
  getDoc,
} from '@firebase/firestore';
import * as amplitude from '@amplitude/analytics-browser';
import { getDownloadURL } from '@firebase/storage';
import { useQuasar } from 'quasar';
import ApplicantFormMainMobile from 'src/components/forms/ApplicantFormMainMobile.vue';
import ApplicantFormMainDesktop from 'src/components/forms/ApplicantFormMainDesktop.vue';
import DialogFormName from 'src/components/forms/mobile/DialogFormName.vue';
// import DialogFormReminder from 'src/components/forms/mobile/DialogFormReminder.vue';
import { dbDocRefs, dbColRefs } from 'src/utils/db';
import { storageRefs } from 'src/utils/storage';
import { Company, Form } from 'src/utils/types';
import { ApplicantDocument } from 'src/utils/new-types';
import { onMounted, onUnmounted, ref } from 'vue';
import { signInAnonymously, getAuth } from 'firebase/auth';
import { useAuthStore } from 'src/stores/auth-store';
import { useRouter } from 'vue-router';

const props = defineProps<{
  formId: string;
}>();
const $q = useQuasar();
const router = useRouter();
const unsubForm = ref<Unsubscribe | null>(null);
const authStore = useAuthStore();
const form = ref<(Form & { id: string }) | null>(null);
const company = ref<Company | null>(null);
const documents = ref<(ApplicantDocument & { id: string })[]>([]);
const unsubDocs = ref<Unsubscribe | null>(null);
const isReady = ref(false);
const logoURL = ref('');

onMounted(async () => {
  try {
    await setApplicantAuth();
    await setForm();
    await setCompany();
    amplitude.setUserId(form.value?.id);
    if (form.value && form.value.company.logo) {
      logoURL.value = await getLogoURL(form.value.company.logo);
    }
    await setDocuments();
    if (form.value && !form.value.applicant.name && $q.platform.is.mobile) {
      getApplicantName();
    }
    isReady.value = true;
  } catch (error) {
    console.error(error);
  }
});

onUnmounted(() => {
  unsubForm.value?.();
});

const setForm = async () => {
  const formRef = dbDocRefs.getFormRef(props.formId);
  await new Promise<void>((resolve, reject) => {
    let runOnce = () => {
      runOnce = () => {
        return;
      };
      resolve();
    };
    unsubForm.value = onSnapshot(
      formRef,
      async (docSnap) => {
        const docData = docSnap.data();
        if (docData && !docData.isDeleted) {
          console.log(docData);
          form.value = { id: docSnap.id, ...docData };
        } else {
          console.log('Applicant does not exist');
          router.push('/404');
        }
        runOnce();
      },
      reject
    );
  });
};

const setCompany = async () => {
  if (!form.value) return;
  const { company: formCompany } = form.value;
  const companyRef = dbDocRefs.getCompanyRef(formCompany.id);
  const companySnap = await getDoc(companyRef);
  if (companySnap.exists()) {
    company.value = companySnap.data();
  }
};

const setDocuments = async () => {
  if (!form.value) return;
  const documentsRef = dbColRefs.getDocumentsRef(form.value.company.id);
  const q = query(
    documentsRef,
    where('formId', '==', props.formId),
    orderBy('docNumber', 'asc')
  );
  await new Promise<void>((resolve, reject) => {
    let runOnce = () => {
      runOnce = () => {
        return;
      };
      resolve();
    };
    unsubDocs.value = onSnapshot(
      q,
      (querySnap) => {
        documents.value = querySnap.docs.map((docSnap) => {
          return { id: docSnap.id, ...docSnap.data() };
        });
        runOnce();
      },
      reject
    );
  });
};

const getApplicantName = () => {
  $q.dialog({
    component: DialogFormName,
    componentProps: {
      formId: props.formId,
      logo: logoURL.value,
    },
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

// const showReminder = () => {
//   $q.dialog({
//     component: DialogFormReminder,
//   });
// };

const getLogoURL = async (logoName: string) => {
  const logoRef = storageRefs.getLogoRef(logoName);
  const url = await getDownloadURL(logoRef);
  return url;
};
</script>

<style scoped></style>
