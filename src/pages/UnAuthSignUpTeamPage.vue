<template>
  <q-page>
    <q-form
      @submit.prevent="onSubmit"
      class="container"
      v-if="$q.platform.is.desktop"
    >
      <q-card v-if="invite">
        <q-card-section>
          <q-img style="max-width: 150px" src="~assets/logo-icon.png" />
          <div class="text-h5 q-mt-md">Create an account now</div>
        </q-card-section>
        <q-stepper
          style="max-width: 600px"
          v-model="step"
          header-nav
          ref="stepper"
          color="primary"
          animated
          flat
        >
          <q-step
            :name="1"
            title="Step 1"
            icon="settings"
            :done="step > 1"
            :header-nav="step > 1"
          >
            <div class="row q-col-gutter-sm">
              <q-input
                v-model="companyName"
                label="Company Name"
                class="col-12"
                filled
                readonly
              />
              <div class="col">
                <q-input
                  v-model="name.first"
                  label="First Name"
                  class="full-width"
                  filled
                />
              </div>
              <div class="col">
                <q-input
                  v-model="name.last"
                  label="Last Name"
                  class="full-width"
                  filled
                />
              </div>
              <q-input
                v-model="email"
                label="Email"
                class="col-12"
                filled
                readonly
              />
            </div>

            <q-stepper-navigation class="flex">
              <q-btn
                @click="
                  () => {
                    step = 2;
                  }
                "
                color="primary"
                label="Next"
                class="q-ml-auto"
              />
            </q-stepper-navigation>
          </q-step>

          <q-step
            :name="2"
            title="Step 2"
            icon="create_new_folder"
            :done="step > 2"
            :header-nav="step > 2"
          >
            <q-input
              v-model="password"
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
              <q-btn @click="step = 1" color="primary" label="Back" outline />
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
import { ref, onMounted } from 'vue';
import {
  updateDoc,
  getDoc,
  serverTimestamp,
  setDoc,
} from '@firebase/firestore';
import { createUserWithEmailAndPassword } from '@firebase/auth';
import { auth } from 'src/boot/firebase';
import { useUserStore } from 'src/stores/user-store';
import { useRouter } from 'vue-router';
import { dbDocRefs } from 'src/utils/db';
import { Invite } from 'src/utils/types';

type InviteData = Invite & { id: string };

const store = useUserStore();
const router = useRouter();
const invite = ref<InviteData | null>(null);
const step = ref(1);
const isPassword = ref(true);
const companyName = ref('');
const name = ref({
  first: '',
  last: '',
});
const email = ref('');
const password = ref('');
const isLoading = ref(false);

const props = defineProps(['inviteId']);

onMounted(async () => {
  try {
    const inviteRef = dbDocRefs.getInviteRef(props.inviteId);
    const inviteDoc = await getDoc(inviteRef);
    if (inviteDoc.exists() && !inviteDoc.data().isComplete) {
      invite.value = { id: inviteDoc.id, ...inviteDoc.data() };
      companyName.value = invite.value.company.name;
      email.value = invite.value.email;
    } else {
      throw new Error('No invite with this id...');
    }
  } catch (error) {
    console.log(error);
  }
});

async function onSubmit() {
  if (!invite.value) return;
  const { company } = invite.value;
  try {
    isLoading.value = true;
    const userId = await createUserAuth();
    await createUser(userId, company);
    await store.addUserDetails(userId, company.id);
    await updateInvite();
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
  console.log('Successfully created user!');
  const userId = UserCredentials.user.uid;
  return userId;
};

const createUser = async (
  userId: string,
  company: { name: string; id: string }
) => {
  const userRef = dbDocRefs.getUserRef(company.id, userId);
  await setDoc(userRef, {
    createdAt: serverTimestamp(),
    name: name.value,
    email: email.value,
    company,
    dashboards: [],
  });
};

const updateInvite = async () => {
  const inviteRef = dbDocRefs.getInviteRef(props.inviteId);
  await updateDoc(inviteRef, {
    isComplete: true,
  });
};
</script>

<style lang="sass" scoped>
.container
  width: 100vw
  @media only screen and (width > $breakpoint-xs)
    max-width: 650px
    min-width: 600px
    position: absolute
    top: 50%
    left: 50%
    transform: translate(-50%, -50%)
</style>
