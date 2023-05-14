import { FieldValue, Timestamp } from 'firebase/firestore';

// Hardcoded types

export type Formats = 'jpeg' | 'pdf';

export type ApplicantStatus = 'not-submitted' | 'incomplete' | 'complete';

export type ApplicantDashboardMessageStatus =
  | 'Pending'
  | 'Delivered'
  | 'Not Delivered';

// Firebase models

export interface Invite {
  createdAt: Timestamp | FieldValue;
  company: {
    name: string;
    id: string;
  };
  email: string;
  resend: boolean;
  isComplete: boolean;
  invitedBy: string;
}

export interface Company {
  createdAt: Timestamp | FieldValue;
  name: string;
  users: string[];
  logo?: string;
  messageTypes: MessageType[];
  options: {
    adminCheck: boolean;
    mobileOnly: boolean;
    imageOnly: boolean;
  };
}

export interface User {
  createdAt: Timestamp | FieldValue;
  company: {
    id: string;
    name: string;
  };
  email: string;
  name: {
    first: string;
    last: string;
  };
  dashboards: {
    id: string;
    title: string;
    type: string;
  }[];
  hunyoAdmin?: boolean;
}

export interface ApplicantItem {
  email: string;
  name?: {
    first: string;
    middle: string;
    last: string;
  };
  phoneNumbers?: {
    primary: string;
    secondary: string;
  };
  address?: string;
}

export interface DraftDashboard {
  createdAt: Timestamp;
  createdBy: string;
  country: string;
  job: string;
  title: string;
  deadline: Timestamp;
  formContent?: {
    header: string;
    caption: string;
  };
  docs: { [key: string]: DashboardDoc };
  newApplicants: ApplicantItem[];
  messages?: {
    opening: string;
  };
  isPublished: false;
  copiedDashboard?: string;
}

export interface PublishedDashboard {
  createdAt: Timestamp;
  createdBy: string;
  country: string;
  job: string;
  title: string;
  deadline: Timestamp;
  formContent: {
    header: string;
    caption: string;
  };
  docs: { [key: string]: DashboardDoc };
  newApplicants: ApplicantItem[];
  messages: {
    opening: string;
  };
  isPublished: true;
  publishedAt: Timestamp;
  applicantsCount?: number;
  incompleteApplicantsCount?: number;
  completeApplicantsCount?: number;
  actionsCount?: number;
  messagesSentCount?: number;
  copiedDashboard?: string;
}

export interface Applicant {
  createdAt: Timestamp | FieldValue;
  email: string;
  name?: {
    first: string;
    middle: string;
    last: string;
  };
  phoneNumbers?: {
    primary: string;
    secondary: string;
  };
  address?: string;
  latestMessage?: {
    id: string;
    status: ApplicantDashboardMessageStatus;
    sentAt: Timestamp;
  };
  dashboard: {
    id: string;
    submittedAt?: Timestamp | FieldValue;
  };
  status: ApplicantStatus;
  totalDocs: number;
  adminAcceptedDocs: number;
  acceptedDocs: number;
  unCheckedOptionalDocs: number;
  resendLink?: boolean;
  isDeleted?: boolean;
}

export interface ApplicantWithFormId extends Applicant {
  formId: string;
}

export interface Form {
  createdAt: Timestamp;
  applicant: {
    id: string;
    status: ApplicantStatus;
    name?: {
      first: string;
      middle: string;
      last: string;
    };
    email: string;
  };
  company: {
    id: string;
    logo?: string;
    name: string;
  };
  dashboard: {
    id: string;
    formContent: {
      header: string;
      caption: string;
    };
    deadline: Timestamp;
    job: string;
    country: string;
    messages: {
      opening: string;
    };
  };
  adminCheckDocs: number;
  isDeleted?: boolean;
}

export interface AcceptedPage {
  createdAt: Timestamp;
  applicantId: string;
  dashboardId: string;
  companyId: string;
  formId: string;
  docId: string;
  pageId: string;
  name: string;
  acceptedBy: string;
  docName: string;
  contentType: string;
}

export interface RejectedPage {
  createdAt: Timestamp;
  applicantId: string;
  dashboardId: string;
  companyId: string;
  formId: string;
  docId: string;
  pageId: string;
  name: string;
  rejectedBy: string;
  reasonForRejection: string;
  otherReason?: string;
  docName: string;
  contentType: string;
}

export interface DashboardDoc {
  format: Formats;
  isRequired: boolean;
  sample?: {
    file: string;
    contentType: string;
  };
  alias?: string;
  instructions?: string;
  docNumber: number;
}

type MessageType = 'sms' | 'email';

export interface Message {
  createdAt: Timestamp;
  messageTypes: MessageType[];
  emailData?: EmailData | null;
  smsData?: SMSData | null;
  updatedAt?: Timestamp;
}

type SMSStatus = 'Pending' | 'Sent' | 'Failed' | 'Refunded';

export interface SMSData {
  phoneNumber: string;
  message: string;
  senderName?: string;
  status?: SMSStatus;
}

export interface EmailData {
  subject: string;
  recipients: {
    email: string;
    type?: 'to' | 'cc' | 'bcc';
  }[];
  body: string;
  fromName?: string;
  metadata?: MessageMetadata;
  template?: EmailTemplate;
  messageResponseData?: {
    id: string;
    status: string;
    rejectReason: string;
    analytics?: {
      opens?: number;
      clicks?: number;
      isSpam?: boolean;
    };
  };
}

export type EmailTemplate =
  | SendApplicantDocumentRequestTemplate
  | SendTeamInvite;
// | SendApplicantDocumentRejectionTemplate;

export interface SendApplicantDocumentRequestTemplate {
  name: 'Applicant Documents Request';
  data: {
    formLink: string;
    companyName: string;
    companyDeadline: string;
    applicantName?: string;
  };
}

export interface SendTeamInvite {
  name: 'Team Invite Message';
  data: {
    teamMemberName: string;
    companyName: string;
    inviteLink: string;
  };
}
export interface MessageMetadata {
  applicantId: string;
  dashboardId: string;
  companyId: string;
}
