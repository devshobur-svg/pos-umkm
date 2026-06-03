// src/utils/imageConverter.ts

/**
 * Mengubah file mentah dari gallery menjadi Base64 String asinkron
 * @param file Objek berkas dari input file HTML
 * @returns Promise string Base64 gambar
 */
export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};