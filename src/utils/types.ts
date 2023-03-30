import { FieldValue, Timestamp } from 'firebase/firestore';

// Hardcoded types

export type Formats = 'jpeg' | 'pdf';

export type FormTask = 'createDoc' | 'resubmitDoc' | 'resubmitPages';

export type ApplicantStatus = 'not-submitted' | 'incomplete' | 'complete';

export type ApplicantDashboardMessageStatus =
  | 'Pending'
  | 'Delivered'
  | 'Not Delivered';

export type DocumentStatus =
  | 'Submitted'
  | 'Accepted'
  | 'Rejected'
  | 'Not Submitted'
  | 'Not Applicable';

export type PageStatus = 'Submitted' | 'Accepted' | 'Rejected';

export type AdminCheckStatus = 'Accepted' | 'Rejected' | 'Not Checked';

export type RejectionCode = 'pages' | 'full-submission';

export type RejectionReason = 'image-quality' | 'wrong-doc' | 'other';

// Firebase models

export interface Invite {
  createdAt: Timestamp | FieldValue;
  company: {
    name: string;
    id: string;
  };
  email: string;
  resend: boolean;
}

export interface Company {
  createdAt: Timestamp | FieldValue;
  name: string;
  users: string[];
  logo?: string;
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
  actions?: {
    createdAt: Timestamp | FieldValue;
    id: string;
    type: 'verifyDocuments';
    applicant: {
      email: string;
      name?: {
        first: string;
        last: string;
      };
    };
  }[];
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
  applicants?: string[];
  messages?: {
    opening: string;
  };
  isPublished: false;
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
  applicants: string[];
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
}

export interface Dashboard {
  createdAt: Timestamp | FieldValue;
  title: string;
  options: {
    type: 'documentCollector';
    docs: {
      name: string;
      format: 'pdf' | 'jpeg';
      sample?: string;
    }[];
    messages: {
      opening: string;
      followUps: string[];
    };
  };
  users: {
    id: string;
    name: {
      first: string;
      last: string;
    };
  }[];
  company: {
    id: string;
    name: string;
  };
  applicantsCount?: number;
  incompleteApplicantsCount?: number;
  completeApplicantsCount?: number;
  actionsCount?: number;
  messagesSentCount?: number;
}

export interface Applicant {
  createdAt: Timestamp | FieldValue;
  email: string;
  name?: {
    first: string;
    middle: string;
    last: string;
  };
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
}

export interface Form {
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
}

export interface UpdatedForm extends Omit<Form, 'applicant'> {
  applicant: {
    id: string;
    status: ApplicantStatus;
    name: {
      first: string;
      last: string;
    };
  };
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
  reasonForRejection: RejectionReason;
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
  instructions?: string;
  docNumber: number;
}

export interface Message {
  createdAt: Timestamp;
  subject: string;
  recipients: {
    email: string;
    type?: 'to' | 'cc' | 'bcc';
  }[];
  body: string;
  fromName?: string;
  metadata?: MessageMetadata;
  template?: SendApplicantDocumentRequestTemplate;
  updatedAt?: Timestamp;
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

export interface SendApplicantDocumentRequestTemplate {
  name: 'Applicant Documents Request';
  data: {
    formLink: string;
    companyName: string;
    companyDeadline: string;
  };
}

export interface MessageMetadata {
  applicantId: string;
  dashboardId: string;
  companyId: string;
}

// Rejections

export interface DocRejection {
  code: RejectionCode;
  reason: RejectionReason[];
  message?: string;
  rejectedBy: string;
  rejectedAt: Timestamp;
}

export interface PageRejection {
  reason: RejectionReason;
  message?: string;
  imageProperties: {
    brightness: number;
    contrast: number;
    sharpness: number;
  };
}

export interface RejectionPages {
  createdAt: Timestamp;
  companyId: string;
  dashboardId: string;
  applicantId: string;
  formId: string;
  docId: string;
  // pages: (AdminCheckPage & {
  //   id: string;
  // })[];
  rejectionData: DocRejection;
}
