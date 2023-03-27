import { boot } from 'quasar/wrappers';
import * as amplitude from '@amplitude/analytics-browser';

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async (/* { app, router, ... } */) => {
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    console.log(process.env.NODE_ENV);
    amplitude.init(process.env.AMPLITUDE_API_KEY_DEV as string, undefined, {
      defaultTracking: {
        sessions: true,
        pageViews: true,
        formInteractions: true,
        fileDownloads: true,
      },
      // logLevel: amplitude.Types.LogLevel.Debug,
    });
  } else {
    amplitude.init(process.env.AMPLITUDE_API_KEY_PROD as string, undefined, {
      defaultTracking: {
        sessions: true,
        pageViews: true,
        formInteractions: true,
        fileDownloads: true,
      },
    });
  }
});
