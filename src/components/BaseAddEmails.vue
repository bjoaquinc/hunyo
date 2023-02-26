<template>
  <div>
    <div v-if="title" class="text-h5">{{ title }}</div>
    <div class="row q-mt-sm">
      <q-chip
        v-for="(email, index) in emails"
        :key="email"
        removable
        @remove="removeEmail(index)"
        color="grey-6"
        text-color="white"
      >
        {{ email }}
      </q-chip>
      <q-btn
        :loading="isLoading"
        @click="emit('clickActionButton')"
        class="q-ml-auto"
        v-if="actionButton && emails.length > 0"
        :label="actionButtonTitle"
        color="primary"
        no-caps
      />
    </div>
    <div class="q-mt-sm">
      <q-input
        label="Add emails here"
        v-model="email"
        ref="emailInputRef"
        @keydown.enter.prevent="addEmail"
        @keydown.space.prevent="addEmail"
        @keydown.,.prevent="addEmail"
        type="email"
        :rules="[isValidEmail, isDuplicate, isRequired]"
        autogrow
        filled
        class="wrap"
      >
        <template v-slot:prepend>
          <q-icon name="fas fa-envelope" color="grey-8" />
        </template>
        <template v-slot:append>
          <q-btn
            outline
            no-caps
            color="primary"
            label="Add Email"
            unelevated
            v-if="
              isValidEmail(email) !== 'Invalid email' &&
              email !== '' &&
              isDuplicate(email) !== 'Email is already added'
            "
            @click="addEmail"
          />
        </template>
      </q-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { QInput } from 'quasar';
import { ref, onMounted } from 'vue';

export interface AddEmail {
  title?: string;
  actionButton?: boolean;
  actionButtonTitle?: string;
  required?: boolean;
  savedEmails?: string[];
}

export interface AddEmailsComp {
  emails: string[];
  clearEmails: () => void;
  loading: {
    show: () => void;
    hide: () => void;
  };
}

const props = withDefaults(defineProps<AddEmail>(), {
  title: '',
  actionButton: true,
  actionButtonTitle: 'Action Button',
  required: false,
});

onMounted(() => {
  if (props.savedEmails) {
    emails.value = props.savedEmails;
  }
});

const emailInputRef = ref<QInput | null>(null);

const emit = defineEmits(['clickActionButton']);

const email = ref('');
const emails = ref<string[]>([]);
const isLoading = ref(false);

function addEmail() {
  if (
    isValidEmail(email.value) === 'Invalid email' ||
    isDuplicate(email.value) === 'Email is already added' ||
    !email.value
  )
    return;
  emails.value.push(email.value);
  email.value = '';
}

function removeEmail(index: number) {
  emails.value.splice(index, 1);
}

function isValidEmail(val: string) {
  if (val === '') return true;
  const emailPattern =
    /^(?=[a-zA-Z0-9@._%+-]{6,254}$)[a-zA-Z0-9._%+-]{1,64}@(?:[a-zA-Z0-9-]{1,63}\.){1,8}[a-zA-Z]{2,63}$/;
  return emailPattern.test(val) || 'Invalid email';
}

function isDuplicate(val: string) {
  return !emails.value.includes(val) || 'Email is already added';
}

function isRequired(val: string) {
  if (props.required) {
    return !!val || 'Please add at least one email.';
  } else {
    return true;
  }
}

function clearEmails() {
  emails.value = [];
}

const loading = {
  show: () => (isLoading.value = true),
  hide: () => (isLoading.value = false),
};

defineExpose({
  emails,
  clearEmails,
  loading,
  emailInputRef,
});
</script>

<style scoped></style>
