import { getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Unsubscribe } from 'firebase/auth';
import { dbColRefs, dbDocRefs } from 'src/utils/db';
import { User } from 'src/utils/types';

type UserData = User & { id: string };

export const useUserStore = defineStore('user', () => {
  const user = ref<UserData | null>(null);
  const unsubUser = ref<Unsubscribe | null>(null);

  const getUserCompany = async (userId: string) => {
    const companiesRef = dbColRefs.companies;
    const q = query(companiesRef, where('users', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    let companyId = '';
    querySnapshot.forEach((doc) => {
      companyId = doc.id;
    });
    return companyId;
  };

  const addUserDetails = async (userId: string, companyId: string) => {
    const docRef = dbDocRefs.getUserRef(companyId, userId);
    await new Promise<void>((resolve, reject) => {
      let resolveOnce = () => {
        resolveOnce = () => {
          return;
        };
        resolve();
      };
      const unsub = onSnapshot(
        docRef,
        (doc) => {
          if (doc.exists()) {
            user.value = { id: doc.id, ...doc.data() };
          } else {
            user.value = null;
          }
          resolveOnce();
        },
        reject
      );
      unsubUser.value = unsub;
    });
  };

  return { user, addUserDetails, getUserCompany, unsubUser };
});
