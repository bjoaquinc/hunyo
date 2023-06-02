export const getUpdatedDocName = (
  docName: string,
  applicantName: {
    first: string;
    middle: string;
    last: string;
  }
) => {
  Object.keys(applicantName).forEach((key) => {
    const typedKey = key as keyof typeof applicantName;
    applicantName[typedKey] = fixName(applicantName[typedKey]);
  });
  const { first, middle, last } = applicantName;
  const updatedName = `${first}_${middle}_${last}`;
  const cleanedDocName = docName.trim();
  return cleanedDocName + '_' + updatedName + '.pdf';
};

const fixName = (name: string) => {
  const fixedName = name
    .trim()
    .split(' ')
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join('_');
  return fixedName;
};
