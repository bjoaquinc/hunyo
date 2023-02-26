export const getFileNameWithContentTypeSuffix = (
  contentType: string,
  fileName: string
) => {
  let suffix = '';
  switch (contentType) {
    // Images
    case 'image/jpeg':
      suffix = '.jpg';
      break;
    case 'image/png':
      suffix = '.png';
      break;
    case 'image/gif':
      suffix = '.gif';
      break;
    case 'image/bmp':
      suffix = '.bmp';
      break;
    case 'image/webp':
      suffix = '.webp';
      break;
    case 'image/svg+xml':
      suffix = '.svg';
      break;

    // Documents
    case 'application/pdf':
      suffix = '.pdf';
      break;
    case 'application/msword':
      suffix = '.doc';
      break;
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      suffix = '.docx';
      break;
    case 'application/vnd.ms-excel':
      suffix = '.xls';
      break;
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      suffix = '.xlsx';
      break;
    case 'application/vnd.ms-powerpoint':
      suffix = '.ppt';
      break;
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      suffix = '.pptx';
      break;
    default:
      break;
  }
  return fileName + suffix;
};
