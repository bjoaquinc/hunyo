import { boot } from 'quasar/wrappers';
import { useAuthStore } from 'src/stores/auth-store';
import { useUserStore } from 'src/stores/user-store';
import { Loading, QSpinnerPie } from 'quasar';

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async (/* { app, router, ... } */) => {
  const { getValidatedUser, updateAuth } = useAuthStore();
  const { addUserDetails, getUserCompany } = useUserStore();
  Loading.show({
    spinner: QSpinnerPie,
    backgroundColor: 'primary',
  });
  const user = await getValidatedUser();
  if (user) {
    updateAuth(user);
    const companyId = await getUserCompany(user.uid);
    if (!companyId) {
      Loading.hide();
      return;
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
