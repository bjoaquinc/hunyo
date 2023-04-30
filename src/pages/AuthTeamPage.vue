<template>
  <q-page>
    <div class="q-pa-lg container">
      <AddEmails
        ref="emailsRef"
        title="Add New Team Members"
        action-button-title="Send Invites"
        @click-action-button="createInvites"
      />
      <q-list bordered class="q-mt-md">
        <q-item-label header
          >Team ({{ team.length + invites.length }})</q-item-label
        >
        <q-item v-for="contact in team" :key="contact.id" class="q-my-sm">
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white">
              {{
                `${contact.name.first[0].toUpperCase()}${contact.name.last[0].toUpperCase()}`
              }}
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label>{{
              `${contact.name.first} ${contact.name.last}`
            }}</q-item-label>
            <q-item-label caption lines="1">{{ contact.email }}</q-item-label>
          </q-item-section>

          <!-- <q-item-section side>
            <q-btn
              label="Remove"
              icon="fas fa-times"
              flat
              dense
              no-caps
              color="negative"
            />
          </q-item-section> -->
        </q-item>

        <q-item v-for="invite in invites" :key="invite.id" class="q-my-sm">
          <q-item-section avatar>
            <q-avatar color="grey-6" text-color="white">
              {{ invite.email[0].toUpperCase() }}
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ invite.email }}</q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-btn
              @click="removeInvite(invite.id)"
              label="Remove"
              icon="fas fa-times"
              flat
              dense
              no-caps
              color="negative"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
    <q-inner-loading :showing="isLoading">
      <q-spinner-pie size="80px" color="primary" />
    </q-inner-loading>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { dbColRefs, dbDocRefs } from 'src/utils/db';
import { Invite, User } from 'src/utils/types';
import AddEmails from 'components/BaseAddEmails.vue';
import { AddEmailsComp } from 'components/BaseAddEmails.vue';
import {
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Unsubscribe,
  where,
} from '@firebase/firestore';
import { useUserStore } from 'src/stores/user-store';

type InviteData = Invite & { id: string };
type UserData = User & { id: string };

const { user } = useUserStore();
const isLoading = ref(true);
const team = ref<UserData[]>([]);
const invites = ref<InviteData[]>([]);
const unsubTeam = ref<Unsubscribe | null>(null);
const unsubInvites = ref<Unsubscribe | null>(null);
const invitesRef = dbColRefs.invites;
const emailsRef = ref<AddEmailsComp | null>(null);
const emails = computed((): string[] => {
  if (emailsRef.value) {
    return emailsRef.value.emails;
  } else {
    return [];
  }
});

onMounted(async () => {
  await setTeam();
  await setInvites();
  isLoading.value = false;
});

onUnmounted(() => {
  if (unsubInvites.value) {
    unsubInvites.value();
  }
  if (unsubTeam.value) {
    unsubTeam.value();
  }
});

async function setTeam() {
  if (user) {
    const teamRef = dbColRefs.getUsersRef(user.company.id);
    const q = query(teamRef, orderBy('createdAt'));
    await new Promise<void>((resolve) => {
      let runOnce = () => {
        runOnce = () => {
          return;
        };
        resolve();
      };
      unsubTeam.value = onSnapshot(q, (snapshot) => {
        const teamMembers: UserData[] = [];
        snapshot.forEach((doc) => {
          teamMembers.push({ id: doc.id, ...doc.data() });
        });
        team.value = teamMembers;
        runOnce();
      });
    });
  } else {
    console.log('No User logged in');
  }
}

async function setInvites() {
  const q = query(invitesRef, where('company.id', '==', user?.company.id));
  await new Promise<void>((resolve) => {
    let runOnce = () => {
      runOnce = () => {
        return;
      };
      resolve();
    };
    unsubInvites.value = onSnapshot(q, (snapshot) => {
      const invitedMembers: InviteData[] = [];
      snapshot.forEach((doc) => {
        invitedMembers.push({ id: doc.id, ...doc.data() });
      });
      invites.value = invitedMembers.filter((invite) => !invite.isComplete);
      runOnce();
    });
  });
}

async function createInvites() {
  if (!emailsRef.value) return;
  emailsRef.value.loading.show();
  const promises = [];
  for (const email of emails.value) {
    const promise = createInvite(email);
    promises.push(promise);
  }
  await Promise.all(promises);
  emailsRef.value?.clearEmails();
  emailsRef.value.loading.hide();
}

async function createInvite(email: string) {
  if (!user) return;
  await addDoc(invitesRef, {
    createdAt: serverTimestamp(),
    email,
    company: user.company,
    resend: false,
    isComplete: false,
    invitedBy: user.id,
  });
}

async function removeInvite(inviteId: string) {
  const inviteRef = dbDocRefs.getInviteRef(inviteId);
  await deleteDoc(inviteRef);
}
</script>

<style lang="sass" scoped>
.container
  max-width: 100vw
  @media only screen and (width > $breakpoint-xs)
    margin-left: 100px
    max-width: 800px
</style>
