export const documentStatusStyles = {
  'not-submitted': {
    textColor: 'primary',
    actionIcon: 'fas fa-chevron-right',
    actionLabel: 'Submit now',
    mobileLabel: 'Upload',
    clickable: true,
    bgColor: null,
  },
  delayed: {
    textColor: 'orange-8',
    actionIcon: 'fas fa-clock',
    actionLabel: 'Delayed. Update?',
    mobileLabel: 'Delayed',
    clickable: true,
    bgColor: null,
  },
  submitted: {
    textColor: 'grey-8',
    actionIcon: 'fas fa-check',
    actionLabel: 'Submitted',
    mobileLabel: 'Submitted',
    clickable: false,
    bgColor: null,
  },
  accepted: {
    textColor: 'positive',
    actionIcon: 'fas fa-check',
    actionLabel: 'Accepted',
    mobileLabel: 'Accepted',
    clickable: false,
    bgColor: null,
  },
  rejected: {
    bgColor: 'negative',
    textColor: 'white',
    actionIcon: 'fas fa-chevron-right',
    actionLabel: 'Rejected. Resubmit now',
    mobileLabel: 'Rejected',
    clickable: true,
  },
  'not-applicable': {
    bgColor: null,
    textColor: 'grey-6',
    actionIcon: 'fas fa-minus',
    actionLabel: 'Not Applicable. Change?',
    mobileLabel: 'Not Applicable',
    clickable: true,
  },
  'admin-checked': {
    textColor: 'grey-8',
    actionIcon: 'fas fa-check',
    actionLabel: 'Submitted',
    mobileLabel: 'Uploaded',
    clickable: false,
    bgColor: null,
  },
};
