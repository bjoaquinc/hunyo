import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('src/layouts/UnAuthLayout.vue'),
    children: [
      // { path: '', component: () => import('pages/LandingHomePage.vue') },
      {
        path: 'signup',
        component: () => import('src/pages/UnAuthSignUpCompanyPage.vue'),
      },
      {
        path: 'invites/:inviteId',
        component: () => import('src/pages/UnAuthSignUpTeamPage.vue'),
        props: true,
      },
      // {
      //   path: ':companyId/new-member/',
      //   component: null,
      // },
    ],
  },
  {
    path: '/auth',
    component: () => import('src/layouts/AuthLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboards',
        children: [
          {
            path: '',
            component: () => import('src/pages/AuthDashboardsPage.vue'),
          },
          {
            path: ':dashboardId',
            name: 'DashboardPage',
            component: () => import('src/pages/AuthDashboardPage.vue'),
            props: true,
          },
        ],
      },
      {
        path: 'welcome',
        component: () => import('src/pages/AuthWelcomePage.vue'),
      },
      {
        path: 'team',
        component: () => import('src/pages/AuthTeamPage.vue'),
      },
      {
        path: 'dashboard-templates/:dashboardId',
        name: 'DocumentRequestTemplate',
        component: () =>
          import('src/components/create-dashboard/DocumentRequestTemplate.vue'),
        props: true,
      },
    ],
  },
  {
    path: '/applicant',
    component: () => import('src/layouts/ApplicantLayout.vue'),
    children: [
      {
        path: 'forms/:formId',
        component: () => import('src/pages/ApplicantFormPage.vue'),
        props: true,
      },
    ],
  },
  {
    path: '/admin',
    component: () => import('src/layouts/AdminLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('src/pages/AdminPage.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
