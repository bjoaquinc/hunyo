<template>
  <q-page>
    <q-card
      flat
      class="absolute-center"
      style="max-width: 1200px; max-height: 90vh; width: 80%"
    >
      <q-card-section horizontal class="row q-col-gutter-xl">
        <div class="col flex column justify-center">
          <q-img src="~assets/logo-icon.png" style="width: 300px" />
          <div class="text-h5 q-mt-md">Document Collection Made Easy</div>
          <q-input v-model="email" outlined class="q-mt-lg" label="Email" />
          <q-input
            v-model="password"
            outlined
            class="q-mt-md"
            :type="isPassword ? 'password' : 'text'"
            label="Password"
          >
            <template v-slot:append>
              <q-icon
                @click="isPassword = !isPassword"
                :name="isPassword ? 'fas fa-eye' : 'fas fa-eye-slash'"
                class="cursor-pointer"
              />
            </template>
          </q-input>
          <div class="q-mt-sm">
            <q-btn
              @click="resetPassword"
              label="Forgot Password?"
              color="primary"
              no-caps
              flat
              dense
            />
          </div>
          <q-btn
            :loading="isLoading"
            @click="login"
            class="q-mt-md full-width"
            label="Login"
            color="primary"
          />
        </div>
        <div class="col" v-if="!$q.platform.is.mobile">
          <q-img
            src="https://firebasestorage.googleapis.com/v0/b/hunyo-sending.appspot.com/o/homepage%2Fhomepage-image.png?alt=media&token=c1169797-957a-4e09-aa51-02f7432b9d11"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import {
  signInWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
} from '@firebase/auth';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth-store';
import { useUserStore } from 'src/stores/user-store';
import { storeToRefs } from 'pinia';

const email = ref('');
const password = ref('');
const router = useRouter();
const $q = useQuasar();
const isPassword = ref(true);
const isLoading = ref(false);
const authStore = useAuthStore();
const { userAuth } = storeToRefs(authStore);
const { getUserCompany, addUserDetails } = useUserStore();

const login = async () => {
  try {
    isLoading.value = true;
    const auth = getAuth();
    const userCred = await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );
    const user = userCred.user;
    userAuth.value = user;
    const companyId = await getUserCompany(user.uid);
    await addUserDetails(user.uid, companyId);
    router.push({ name: 'DashboardsPage' });
  } catch (error: { code: string; message: string }) {
    console.log(error);
    if (error.code === 'auth/user-not-found') {
      $q.dialog({
        message: 'User not found',
      });
    } else if (error.code === 'auth/wrong-password') {
      $q.dialog({
        message: 'Wrong password',
      });
    } else if (error.code === 'auth/invalid-email') {
      $q.dialog({
        message: 'Invalid email',
      });
    } else {
      $q.dialog({
        message: error.message,
      });
    }
  }
  isLoading.value = false;
};

const resetPassword = () => {
  $q.dialog({
    title: 'Send Reset Password Email',
    message: 'Enter your email address',
    prompt: {
      model: email.value,
      type: 'email',
    },
    ok: {
      label: 'Send Email',
      color: 'primary',
    },
    cancel: true,
  }).onOk(() => {
    const auth = getAuth();
    sendPasswordResetEmail(auth, email.value)
      .then(() => {
        $q.notify({
          message: 'Reset password email sent',
          color: 'positive',
        });
      })
      .catch((error) => {
        let message;
        if (error.code === 'auth/user-not-found') {
          message = 'User not found';
        } else if (error.code === 'auth/invalid-email') {
          message = 'Invalid email';
        } else {
          message = error.message;
        }
        $q.notify({
          message: message,
          color: 'negative',
        });
      });
  });
};
</script>

<style lang="sass" scoped>
.text-h5
  font-size: 2.5rem
  font-weight: 500
  line-height: 1.2
  letter-spacing: 0.0075em
</style>
