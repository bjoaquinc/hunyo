import { Timestamp } from '@firebase/firestore';

// New Models

export type RequestStatus = 'not-submitted' | 'incomplete' | 'complete';
export type DocumentStatus =
  | 'not-submitted'
  | 'submitted'
  | 'admin-checked'
  | 'accepted'
  | 'rejected'
  | 'not-applicable';
export type PageStatus =
  | 'submitted'
  | 'admin-checked'
  | 'accepted'
  | 'rejected';

export interface Request {
  createdAt: Timestamp;
  applicant: {
    id: string;
    name?: {
      first: string;
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
  requestStatus: RequestStatus;
  totalDocs: number;
  totalDocsComplete: number;
}

export interface ApplicantDocument {
  createdAt: Timestamp;
  formId: string;
  dashboardId: string;
  applicantId: string;
  companyId: string;
  name: string;
  requestedFormat: 'pdf' | 'jpeg';
  sample?: {
    contentType: string;
    file: string;
  };
  instructions?: string;
  status: DocumentStatus;
  deviceSubmitted?: 'desktop' | 'mobile';
  docNumber: number;
  totalPages: number;
  rejection?: {
    reason: string;
    message: string;
    rejectedBy: string;
    rejectedAt: Timestamp;
  };
}

export interface ApplicantPage {
  createdAt: Timestamp;
  docId: string;
  formId: string;
  dashboardId: string;
  applicantId: string;
  companyId: string;
  name: string;
  pageNumber: number;
  status: PageStatus;
  submittedFormat: string;
  submittedSize: number;
  submissionCount: number;
  systemCheckStatus?: 'accepted' | 'rejected';
  rejection?: {
    reason: string;
    message: string;
  };
}

export interface Accept {
  createdAt: Timestamp;
  docId: string;
  applicantId: string;
  acceptedBy: string;
}

export interface Reject {
  createdAt: Timestamp;
  docId: string;
  applicantId: string;
  rejectedBy: string;
  reasonForRejection: string;
  message?: string;
}

export interface Applicant {
  createdAt: Timestamp;
  email: string;
  status: 'not-submitted' | 'incomplete' | 'complete';
  name?: {
    first: string;
    middle: string;
    last: string;
  };
  latestMessage?: {
    id: string;
    status: 'pending' | 'delivered' | 'not-delivered';
    sentAt: Timestamp;
  };
  actions: {
    id: string;
    type: 'verification';
  }[];
  dashboard: {
    id: string;
  };
  docIds: string[];
}
