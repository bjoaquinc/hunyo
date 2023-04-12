import { Timestamp } from '@firebase/firestore';

// New Models

export type RequestStatus = 'not-submitted' | 'incomplete' | 'complete';
export type DocumentStatus =
  | 'not-submitted'
  | 'delayed'
  | 'submitted'
  | 'admin-checked'
  | 'accepted'
  | 'rejected'
  | 'not-applicable';
// export type PageStatus =
//   | 'submitted'
//   | 'admin-checked'
//   | 'accepted'
//   | 'rejected';
export type RejectionReasons =
  | 'wrong-document'
  | 'edges-not-visible'
  | 'blurry'
  | 'too-dark'
  | 'other';

export interface ApplicantDocument {
  createdAt: Timestamp;
  formId: string;
  dashboardId: string;
  applicantId: string;
  companyId: string;
  name: string;
  updatedName?: string;
  requestedFormat: 'pdf' | 'jpeg';
  isRequired: boolean;
  sample?: {
    contentType: string;
    file: string;
  };
  instructions?: string;
  status: DocumentStatus; // Dictates whether document is pushed down the pipeline.
  deviceSubmitted?: 'desktop' | 'mobile';
  docNumber: number;
  totalPages: number;
  submissionCount: number;
  isUpdating: boolean;
  delayedUntil?: Timestamp;
  rejection?: {
    reasons: RejectionReasons[];
    rejectedBy: string;
    rejectedAt: Timestamp;
    message?: string;
  };
}

export interface ApplicantPage {
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  docId: string;
  formId: string;
  dashboardId: string;
  applicantId: string;
  companyId: string;
  name: string;
  pageNumber: number;
  // status: PageStatus;
  submittedFormat: string;
  submittedSize: number;
  submissionCount: number; // Mapped to document submission count
  updatingFixedImage?: boolean;
  imageProperties?: ApplicantPageImageProperties;
}

export interface ApplicantPageImageProperties {
  brightness?: string;
  contrast?: string;
  sharpness?: string;
  rotateRight: '0' | '90' | '180' | '270';
  normalise: boolean;
  clahe: boolean;
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
