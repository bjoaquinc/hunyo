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
          <q-btn
            :loading="isLoading"
            @click="login"
            class="q-mt-lg full-width"
            label="Login"
            color="primary"
          />
        </div>
        <div class="col">
          <q-img
            src="https://firebasestorage.googleapis.com/v0/b/hunyo-sending.appspot.com/o/homepage%2Fhomepage-image.png?alt=media&token=6a5b3a13-0b5a-4b4b-b144-50ad63b139aa"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { signInWithEmailAndPassword, getAuth } from '@firebase/auth';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const router = useRouter();
const isPassword = ref(true);
const isLoading = ref(false);

const login = async () => {
  try {
    isLoading.value = true;
    const auth = getAuth();
    await signInWithEmailAndPassword(auth, email.value, password.value);
    router.push({ name: 'DashboardsPage' });
  } catch (error) {
    console.log(error);
  }
  isLoading.value = false;
};
</script>

<style lang="sass" scoped>
.text-h5
  font-size: 2.5rem
  font-weight: 500
  line-height: 1.2
  letter-spacing: 0.0075em
</style>
