<template>
  <div></div>
</template>

<script setup lang="ts"></script>

<style scoped></style>

<!-- <template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" persistent>
    <q-card v-if="action" class="full-width">
      <q-card-section horizontal>
        <transition
          enter-active-class="animated slideInRight"
          leave-active-class="animated slideOutLeft"
        >
          <div v-if="!isIncomplete" class="full-width">
            <q-card-section>
              <div class="flex justify-between">
                <div class="text-h5">
                  Verify
                  {{
                    `${action.applicant.name?.first} ${action.applicant.name?.last}`
                  }}'s Documents
                </div>
                <q-btn icon="fas fa-times" color="grey-8" flat v-close-popup />
              </div>
            </q-card-section>
            <q-card-section>
              <div
                class="flex column"
                v-for="(doc, index) in docsWithFiles"
                :key="index"
              >
                <div class="flex items-center no-wrap q-mt-sm">
                  <div class="text-h6">{{ index + 1 }}</div>
                  <q-btn
                    class="q-ml-lg"
                    :label="doc.name"
                    :href="doc.url"
                    target="_blank"
                    color="primary"
                    size="lg"
                    no-caps
                    flat
                    dense
                  />
                  <q-btn
                    class="q-ml-auto"
                    icon="fas fa-check"
                    label="Accept"
                    color="primary"
                    :outline="doc.status === 'accepted' ? false : true"
                    @click="doc.status = 'accepted'"
                  />
                  <q-btn
                    class="q-ml-md"
                    icon="fas fa-times"
                    label="Reject"
                    color="primary"
                    :outline="doc.status === 'rejected' ? false : true"
                    @click="doc.status = 'rejected'"
                  />
                </div>
                <q-slide-transition>
                  <div v-show="doc.status === 'rejected'">
                    <q-input
                      v-model="doc.reasonForRejection"
                      type="textarea"
                      autogrow
                      outlined
                      filled
                      :label="`Why did you reject the ${doc.name}? (Required)`"
                    />
                  </div>
                </q-slide-transition>
              </div>
            </q-card-section>
            <q-card-section>
              <q-slide-transition v-show="hasCheckedAllDocs">
                <div class="flex justify-around">
                  <q-btn
                    @click="onActionComplete"
                    label="Documents Complete"
                    color="primary"
                  />
                  <q-btn
                    @click="isIncomplete = true"
                    label="Documents Incomplete"
                    color="primary"
                    outline
                  />
                </div>
              </q-slide-transition>
            </q-card-section>
          </div>
          <q-card-section
            class="flex column items-center justify-center full-width"
            v-else
          >
            <div class="flex full-width">
              <q-btn
                v-close-popup
                icon="fas fa-times"
                color="grey-8"
                class="q-ml-auto"
                flat
                dense
              />
            </div>
            <q-icon
              class="q-mt-sm"
              name="fas fa-envelope-circle-check"
              color="primary"
              size="4rem"
            />
            <div class="text-subtitle1 q-mt-sm">
              We sent {{ action.applicant.name?.first }} an email requesting to
              resubmit:
            </div>
            <div class="text-h6" v-for="(doc, index) in errorDocs" :key="index">
              {{ doc.name }}
            </div>
            <div class="text-subtitle1">
              Will inform you when the applicant replies
            </div>
            <q-btn
              v-close-popup
              class="q-mt-md"
              label="Okay, thanks"
              color="primary"
            />
          </q-card-section>
        </transition>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { getDoc, updateDoc } from '@firebase/firestore';
import { getDownloadURL } from '@firebase/storage';
import { QDialog, useDialogPluginComponent } from 'quasar';
import { useUserStore } from 'src/stores/user-store';
import { dbDocRefs } from 'src/utils/db';
import { storageRefs } from 'src/utils/storage';
import { Action } from 'src/utils/types';
import { onMounted, ref, computed } from 'vue';

const { dialogRef, onDialogHide } = useDialogPluginComponent();
const { user } = useUserStore();
const props = defineProps<{
  companyId: string;
  dashboardId: string;
  applicantDashboardItemId: string;
  actionId: string;
}>();
const action = ref<(Action & { id: string }) | null>(null);
const docsWithFiles = ref<
  {
    name: string;
    url: string;
    status: 'pending' | 'accepted' | 'rejected';
    reasonForRejection: string;
  }[]
>([]);
const hasCheckedAllDocs = computed(() => {
  if (docsWithFiles.value.length > 0) {
    for (let doc of docsWithFiles.value) {
      if (doc.status === 'pending') return false;
      if (doc.status === 'rejected' && !doc.reasonForRejection) {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
});
const isIncomplete = ref(false);
const errorDocs = computed(() => {
  return docsWithFiles.value.filter((doc) => doc.status === 'rejected');
});

const getDocs = async (docs: { file: string; name: string }[]) => {
  for (let doc of docs) {
    const docRef = storageRefs.getVerifyDocsRef(
      props.companyId,
      props.dashboardId,
      props.applicantDashboardItemId,
      doc.file
    );
    const docURL = await getDownloadURL(docRef);
    docsWithFiles.value.push({
      name: doc.name,
      url: docURL,
      status: 'pending',
      reasonForRejection: '',
    });
  }
};

onMounted(async () => {
  const actionRef = dbDocRefs.getActionRef(props.companyId, props.actionId);
  const actionSnap = await getDoc(actionRef);
  const actionData = actionSnap.data();
  if (actionData) {
    action.value = { id: actionSnap.id, ...actionData };
    await getDocs(actionData.actionInfo.docs);
  }
});

const onActionComplete = async () => {
  if (!user) return;
  const actionRef = dbDocRefs.getActionRef(props.companyId, props.actionId);
  await updateDoc(actionRef, {
    isComplete: true,
    competedBy: {
      name: user.name,
      id: user.id,
    },
  });
  dialogRef.value?.hide();
};

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);
</script> -->
