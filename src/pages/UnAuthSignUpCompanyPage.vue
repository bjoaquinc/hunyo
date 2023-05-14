<template>
  <q-page>
    <q-form
      @submit.prevent="onSubmit"
      class="container"
      v-if="$q.platform.is.desktop"
    >
      <q-card>
        <q-card-section>
          <q-img style="max-width: 150px" src="~assets/logo-icon.png" />
          <div class="text-h5 q-mt-md">Create an account now</div>
        </q-card-section>
        <q-stepper
          style="max-width: 600px"
          v-model="step"
          header-nav
          keep-alive
          ref="stepperRef"
          color="primary"
          animated
          flat
        >
          <q-step
            :name="1"
            title="Information"
            icon="settings"
            :done="step > 1"
            :header-nav="step > 1"
          >
            <div class="row q-col-gutter-sm">
              <q-input
                :ref="(el) => addInformationRefs(el as QInput)"
                :rules="[(val) => !!val || 'This field is required']"
                v-model="companyName"
                label="Company Name"
                class="col-12"
                filled
              />
              <div class="col">
                <q-input
                  :ref="(el) => addInformationRefs(el as QInput)"
                  :rules="[(val) => !!val || 'This field is required']"
                  v-model="name.first"
                  label="First Name"
                  class="full-width"
                  filled
                />
              </div>
              <div class="col">
                <q-input
                  :ref="(el) => addInformationRefs(el as QInput)"
                  :rules="[(val) => !!val || 'This field is required']"
                  v-model="name.last"
                  label="Last Name"
                  class="full-width"
                  filled
                />
              </div>
              <q-input
                :ref="(el) => addInformationRefs(el as QInput)"
                :rules="[(val) => !!val || 'This field is required']"
                v-model="email"
                label="Email"
                class="col-12"
                filled
              />
            </div>

            <q-stepper-navigation class="flex">
              <q-btn
                @click="onNext"
                color="primary"
                label="Next"
                class="q-ml-auto"
              />
            </q-stepper-navigation>
          </q-step>

          <q-step
            :name="2"
            title="Logo"
            caption="Optional"
            icon="fas fa-image"
            :done="step > 2"
            :header-nav="step > 2"
          >
            <q-file
              v-model="logo"
              accept=".jpg, image/*"
              label="Upload Logo (Optional)"
              type="file"
              class="col-12"
              filled
            >
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>

            <q-stepper-navigation class="flex">
              <q-btn @click="step = 1" color="primary" label="Back" outline />
              <q-btn
                @click="onNext"
                :outline="logo ? false : true"
                class="q-ml-auto"
                color="primary"
                :label="logo ? 'Next' : 'Skip for now'"
              />
            </q-stepper-navigation>
          </q-step>

          <q-step
            :name="3"
            title="Password"
            icon="fas fa-key"
            :done="step > 3"
            :header-nav="step > 3"
          >
            <q-input
              v-model="password"
              ref="passwordRef"
              :rules="[
                (val) => !!val || 'Please add a password',
                (val) =>
                  val.length > 6 || 'Password must be more than 6 characters',
                (val) => /\d/.test(val) || 'Password must contain a number',
              ]"
              label="Password"
              :type="isPassword ? 'password' : 'text'"
              class="col-12"
              filled
            >
              <template v-slot:append>
                <q-btn
                  @click="isPassword = !isPassword"
                  :icon="isPassword ? 'fas fa-eye' : 'fas fa-eye-slash'"
                  dense
                  flat
                />
              </template>
            </q-input>

            <q-stepper-navigation class="flex">
              <q-btn
                @click="stepperRef?.previous()"
                color="primary"
                label="Back"
                outline
              />
              <q-btn
                :loading="isLoading"
                :disable="isLoading"
                class="q-ml-auto"
                type="submit"
                color="primary"
                label="Create Account"
              />
            </q-stepper-navigation>
          </q-step>
        </q-stepper>
      </q-card>
    </q-form>
    <div
      class="full-width flex column justify-center items-center"
      style="min-height: 80vh"
      v-else
    >
      <q-icon name="fas fa-computer" size="4em" color="primary" />
      <div class="text-h5 text-grey-8 text-weight-medium q-mt-md text-center">
        Please use your desktop/laptop to sign up
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { addDoc, serverTimestamp, setDoc } from '@firebase/firestore';
import { createUserWithEmailAndPassword } from '@firebase/auth';
import { auth } from 'src/boot/firebase';
import { useUserStore } from 'src/stores/user-store';
import { useRouter } from 'vue-router';
import { dbDocRefs, dbColRefs } from 'src/utils/db';
import { QInput, QStepper, uid } from 'quasar';
import { storageRefs } from 'src/utils/storage';
import { uploadBytes } from '@firebase/storage';
import { useAuthStore } from 'src/stores/auth-store';

const store = useUserStore();
const authStore = useAuthStore();
const { userAuth } = storeToRefs(authStore);
const router = useRouter();
const step = ref(1);
const stepperRef = ref<QStepper | null>(null);
const informationRefs = ref<QInput[]>([]);
const passwordRef = ref<QInput | null>(null);
const isPassword = ref(true);
const companyName = ref('');
const name = ref({
  first: '',
  last: '',
});
const email = ref('');
const logo = ref<File | null>(null);
const password = ref('');
const isLoading = ref(false);

const addInformationRefs = (el: QInput) => {
  if (informationRefs.value.length < 4) {
    informationRefs.value.push(el);
  }
};

const onNext = () => {
  if (!stepperRef.value) return;
  if (step.value === 1) {
    for (const input of informationRefs.value) {
      input.validate();
      if (input.hasError) {
        return;
      }
    }
  }
  stepperRef.value.next();
};

async function onSubmit() {
  if (!passwordRef.value) return;
  passwordRef.value.validate();
  if (passwordRef.value.hasError) {
    return;
  }
  try {
    isLoading.value = true;
    const userId = await createUserAuth();
    const logoName = await uploadLogoToStorage();
    const companyId = await createCompany(userId, logoName);
    await createUser(companyId, userId);
    await store.addUserDetails(userId, companyId);
    router.push('/auth/welcome');
  } catch (error) {
    console.log(error);
    isLoading.value = false;
  }
}

const createUserAuth = async (): Promise<string> => {
  const UserCredentials = await createUserWithEmailAndPassword(
    auth,
    email.value,
    password.value
  );
  userAuth.value = UserCredentials.user;
  console.log('Successfully created user!');
  const userId = UserCredentials.user.uid;
  return userId;
};

const uploadLogoToStorage = async () => {
  if (!logo.value) return;
  const logoName =
    companyName.value.toLowerCase().replace(' ', '-').replace(',', '') +
    '-' +
    uid() +
    '-' +
    logo.value.name;
  const logoRef = storageRefs.getLogoRef(logoName);
  const contentType = logo.value.type;
  await uploadBytes(logoRef, logo.value, {
    contentType,
  });
  return logoName;
};

const createCompany = async (
  userId: string,
  logoName?: string
): Promise<string> => {
  const companiesRef = dbColRefs.companies;
  const docRef = await addDoc(companiesRef, {
    createdAt: serverTimestamp(),
    name: companyName.value,
    users: [userId],
    logo: logoName,
    messageTypes: ['email'],
    options: {
      adminCheck: true,
      mobileOnly: true,
      imageOnly: true,
    },
  });
  const companyId = docRef.id;
  return companyId;
};

const createUser = async (companyId: string, userId: string) => {
  const userRef = dbDocRefs.getUserRef(companyId, userId);
  await setDoc(userRef, {
    createdAt: serverTimestamp(),
    name: name.value,
    email: email.value,
    company: {
      id: companyId,
      name: companyName.value,
    },
    dashboards: [],
  });
};
</script>

<style lang="sass" scoped>
.container
  max-width: 100vw
  @media only screen and (width > $breakpoint-xs)
    max-width: 650px
    min-width: 600px
    position: absolute
    top: 50%
    left: 50%
    transform: translate(-50%, -50%)
</style>
