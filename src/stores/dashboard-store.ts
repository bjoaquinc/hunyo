import { defineStore } from 'pinia';
import { useUserStore } from './user-store';
import {
  DocumentReference,
  onSnapshot,
  Unsubscribe,
  query,
  orderBy,
} from 'firebase/firestore';
import { computed, ref } from 'vue';
import { Applicant, PublishedDashboard } from 'src/utils/types';
import { dbColRefs } from 'src/utils/db';

type DashboardData = PublishedDashboard & { id: string };
type ApplicantData = Applicant & { id: string };

export const useDashboardStore = defineStore('dashboard', () => {
  const userStore = useUserStore();

  const dashboard = ref<null | DashboardData>(null);
  const unsubDashboard = ref<Unsubscribe | null>(null);
  const applicants = ref<ApplicantData[]>([]);
  const unsubApplicants = ref<Unsubscribe | null>(null);
  const applicantIds = computed(() => applicants.value.map((a) => a.id));

  const setDashboard = async (
    dashboardRef: DocumentReference<PublishedDashboard>
  ) => {
    const { user } = userStore;
    if (!user) return;
    const docRef = dashboardRef;
    await new Promise<void>((resolve, reject) => {
      let runOnce = () => {
        runOnce = () => {
          return;
        };
        resolve();
      };
      const unsub = onSnapshot(
        docRef,
        (doc) => {
          if (doc.exists()) {
            dashboard.value = { id: doc.id, ...doc.data() };
          } else {
            dashboard.value = null;
          }
          runOnce();
        },
        reject
      );
      unsubDashboard.value = unsub;
    });
  };

  const setApplicants = async (companyId: string, dashboardId: string) => {
    const { user } = userStore;
    const applicantsRef = dbColRefs.getApplicantsRef(companyId, dashboardId);
    const q = query(applicantsRef, orderBy('createdAt', 'desc'));
    if (!user) return;
    await new Promise<void>((resolve, reject) => {
      let resolveOnce = () => {
        resolveOnce = () => {
          return;
        };
        resolve();
      };
      unsubApplicants.value = onSnapshot(
        q,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const id = change.doc.id;
            if (change.type === 'added') {
              console.log(change.newIndex);
              if (applicantIds.value.includes(id)) return;
              const applicant = {
                id,
                ...change.doc.data(),
              };
              if (change.newIndex === 0) {
                applicants.value.unshift(applicant);
              } else {
                applicants.value.push(applicant);
              }
            }
            if (change.type === 'modified') {
              applicants.value.splice(change.newIndex, 1, {
                id,
                ...change.doc.data(),
              });
            }
            if (change.type === 'removed') {
              applicants.value.splice(change.oldIndex, 1);
            }
          });
          resolveOnce();
        },
        reject
      );
    });
  };

  const clearDashboard = () => {
    dashboard.value = null;
    unsubDashboard.value = null;
    applicants.value = [];
    unsubApplicants.value = null;
  };

  return {
    setDashboard,
    unsubDashboard,
    setApplicants,
    unsubApplicants,
    dashboard,
    applicants,
    clearDashboard,
  };
});
