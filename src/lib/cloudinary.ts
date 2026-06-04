const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

export async function uploadToCloudinary(file: File): Promise<string> {
  // If credentials are not set, fallback to converting the file to base64 Data URL
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    return convertFileToBase64(file);
  }

  try {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new Error(err.error?.message ?? "Upload ảnh thất bại");
    }
    return ((await res.json()) as { secure_url: string }).secure_url;
  } catch (error) {
    console.warn("Cloudinary upload failed, falling back to base64 local conversion:", error);
    return convertFileToBase64(file);
  }
}

function convertFileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new Error("Không thể chuyển đổi file ảnh sang định dạng base64"));
    };
    reader.readAsDataURL(file);
  });
}
