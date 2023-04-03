import { onAuthStateChanged, User, signOut, getAuth } from 'firebase/auth';
import { defineStore, storeToRefs } from 'pinia';
import { useUserStore } from './user-store';
import { auth } from 'src/boot/firebase';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const userStore = useUserStore();
  const userAuth = ref<User | null>(null);

  const getValidatedUser = async (): Promise<User | null> => {
    return await new Promise((resolve, reject) => {
      let runOnce = (user: User | null) => {
        runOnce = () => {
          return;
        };
        resolve(user);
      };
      onAuthStateChanged(
        auth,
        (user) => {
          if (user) {
            runOnce(user);
          } else {
            const { clearUser } = userStore;
            clearUser();
            userAuth.value = null;
            runOnce(null);
          }
        },
        (error) => reject(error)
      );
    });
  };

  const updateAuth = (user: User | null) => {
    if (user) {
      userAuth.value = user;
    } else {
      userAuth.value = null;
    }
  };

  const logOut = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (error) {
      console.log(error);
    }
  };

  const authObserver = async () => {
    await new Promise<void>((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        const { getUserCompany, addUserDetails, user: userData } = userStore;
        const { unsubUser } = storeToRefs(userStore);
        if (user) {
          userAuth.value = user;
          if (!userData) {
            const companyId = await getUserCompany(user.uid);
            await addUserDetails(user.uid, companyId);
          }
          resolve();
        } else {
          userAuth.value = null;
          if (unsubUser.value) {
            unsubUser.value();
          }

          resolve();
        }
      });
    });
  };

  return { userAuth, authObserver, getValidatedUser, updateAuth, logOut };
});
