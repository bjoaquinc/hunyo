// import { getDoc } from 'firebase/firestore';
// import { getDownloadURL } from 'firebase/storage';
// import { defineStore } from 'pinia';
// import { dbDocRefs } from 'src/utils/db';
// import { storageRefs } from 'src/utils/storage';
// import { Form } from 'src/utils/types';
// import { ref } from 'vue';

// export const useFormStore = defineStore('form', () => {
//   const form = ref<(Form & { id: string }) | null>(null);

//   const setForm = async (formId: string) => {
//     const formRef = dbDocRefs.getFormRef(formId);
//     const formSnap = await getDoc(formRef);
//     const formData = formSnap.data();
//     if (formData) {
//       form.value = { id: formSnap.id, ...(await sampleRefsToUrls(formData)) };
//     } else {
//       new Error('No form with this id');
//     }
//   };

//   return {
//     form,
//     setForm,
//   };
// });

// const sampleRefsToUrls = async (object: Form) => {
//   if (object.company.logo || hasSamples(object.docs)) {
//     const objectClone = { ...object };
//     const docs = object.dashboard.docs;
//     for (let i = 0; i < docs.length; i++) {
//       const sample = docs[i].sample;
//       if (sample) {
//         const sampleRef = storageRefs.getSampleRef(object.company.id, sample);
//         const sampleURL = await getDownloadURL(sampleRef);
//         objectClone.dashboard.docs[i].sample = sampleURL;
//       }
//     }
//     return objectClone;
//   }
//   return object;
// };

// const hasSamples = (
//   array: { name: string; isVerified: boolean; sample?: string }[]
// ) => {
//   array.forEach((val) => {
//     if (val.sample) {
//       return true;
//     }
//   });
//   return false;
// };
