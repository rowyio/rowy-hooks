import { fileTypeFromBuffer } from "file-type";
import { storage } from "../firebaseConfig.js";
import * as uuid from "uuid";
import { getProjectId } from "../metadataService.js";
import fetch from 'node-fetch';
export const url2storage = async (url: string, folderPath: string) => {
  const response = await fetch(url);
  if (response.ok) {
    const projectId = await getProjectId()
    const bucket = storage.bucket(`${projectId}.appspot.com`);
    const dataBuffer = await response.buffer();
    const fileName = url.split("/").pop();
    if (!fileName) throw new Error("file name not found");
    const fileType = await fileTypeFromBuffer(dataBuffer);
    if (!fileType) throw new Error("File type not supported");
    const file = bucket.file(
      `${folderPath}/${fileName}${
        fileName.includes(".") ? "" : `.${fileType.ext}`
      }`
    );
    const token = uuid.v4();
    await file.save(dataBuffer, {
      metadata: {
        contentType: fileType.mime,
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });
    return {
      downloadURL: `https://firebasestorage.googleapis.com/v0/b/${
        bucket.name
      }/o/${encodeURIComponent(file.name)}?alt=media&token=${token}`,
      name: fileName,
      type: fileType.mime,
      lastModifiedTS: new Date(),
    };

  } else {
    return null;
  }
};