import { boot } from 'quasar/wrappers';
import { useAuthStore } from 'src/stores/auth-store';
import { useUserStore } from 'src/stores/user-store';
import { Loading, QSpinnerPie } from 'quasar';

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async (/* { app, router, ... } */) => {
  const { getValidatedUser, updateAuth } = useAuthStore();
  const { addUserDetails, getUserCompany } = useUserStore();

  const user = await getValidatedUser();
  // console.log(user);
  Loading.show({
    spinner: QSpinnerPie,
    backgroundColor: 'primary',
  });
  if (user) {
    updateAuth(user);
    const companyId = await getUserCompany(user.uid);
    if (!companyId) {
      console.log('No company Id');
    }
    // console.log(companyId);
    await addUserDetails(user.uid, companyId);
    Loading.hide();
    return;
  } else {
    Loading.hide();
    return;
  }
});
