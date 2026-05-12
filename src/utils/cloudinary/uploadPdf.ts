import cloudinary from './cloudinary'

type UploadPdfOptions = {
  pdfBuffer: Buffer | Uint8Array;
  reportId: string;
  typeOfRisk: string;
};

export const uploadPdfToCloudinary = async ({
  pdfBuffer,
  reportId,
  typeOfRisk,
}: UploadPdfOptions) => {
  return await new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "black-cat/reports",
        resource_type: "raw",
        type: "upload",
        access_mode: "public",
        public_id: `black-cat-${typeOfRisk}-report-${reportId}`,
        format: "pdf",
      }, 
      (error, result) => {
        if (error || !result) {
          return reject(error);
        }

        resolve(result);
      }
    );

    uploadStream.end(pdfBuffer);
  });
};