import { ref } from 'firebase/storage';
import { storage } from 'src/boot/firebase';

const getRef = (...ids: string[]) => {
  let fullPath = '';
  for (const id of ids) {
    fullPath += fullPath ? `/${id}` : id;
  }
  return ref(storage, fullPath);
};

export const storageRefs = {
  getLogoRef: (logoName: string) => getRef('logos', logoName),
  getNewSampleRef: (
    companyId: string,
    dashboardId: string,
    sampleName: string
  ) =>
    getRef(
      'companies',
      companyId,
      'dashboards',
      dashboardId,
      'new-samples',
      sampleName
    ),
  getSampleRef: (companyId: string, dashboardId: string, sampleName: string) =>
    getRef(
      'companies',
      companyId,
      'dashboards',
      dashboardId,
      'samples',
      sampleName
    ),
  getTemporaryDocsRef: (docName: string) => getRef('temporary-docs', docName),
  getFixedDocRef: (
    companyId: string,
    dashboardId: string,
    applicantId: string,
    docName: string
  ) =>
    getRef(
      'companies',
      companyId,
      'dashboards',
      dashboardId,
      'fixed',
      applicantId,
      docName
    ),
  getOriginalDocRef: (
    companyId: string,
    dashboardId: string,
    applicantId: string,
    docName: string
  ) =>
    getRef(
      'companies',
      companyId,
      'dashboards',
      dashboardId,
      'originals',
      applicantId,
      docName
    ),
  getReplacedDocRef: (
    companyId: string,
    dashboardId: string,
    applicantId: string,
    docName: string
  ) =>
    getRef(
      'companies',
      companyId,
      'dashboards',
      dashboardId,
      'replaced',
      applicantId,
      docName
    ),
};
