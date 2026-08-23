import os
import io
import logging
from typing import Dict, Any, Optional
from PIL import Image, UnidentifiedImageError
import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url
from django.conf import settings

logger = logging.getLogger(__name__)

# Max upload size: 10 MB (safe server protection limit)
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
ALLOWED_IMAGE_FORMATS = {"JPEG", "JPG", "PNG", "WEBP"}
MAX_DIMENSION = 10000


class CloudinaryService:
    def __init__(self):
        self._configured = False

    def ensure_configured(self) -> None:
        if self._configured:
            return

        cloudinary_url_env = getattr(settings, "CLOUDINARY_URL", "") or os.environ.get("CLOUDINARY_URL", "")
        if cloudinary_url_env:
            cloudinary.config(cloudinary_url=cloudinary_url_env, secure=True)
            self._configured = True
            return

        cloud_name = getattr(settings, "CLOUDINARY_CLOUD_NAME", "") or os.environ.get("CLOUD_NAME", "")
        api_key = getattr(settings, "CLOUDINARY_API_KEY", "") or os.environ.get("API_KEY", "")
        api_secret = getattr(settings, "CLOUDINARY_API_SECRET", "") or os.environ.get("API_SECRET", "")

        if cloud_name and api_key and api_secret:
            cloudinary.config(
                cloud_name=cloud_name,
                api_key=api_key,
                api_secret=api_secret,
                secure=True,
            )
            self._configured = True
        else:
            logger.warning("[CloudinaryService] Cloudinary credentials not fully configured.")

    def validate_image(self, file) -> None:
        if not file:
            raise ValueError("No file provided.")

        # 1. Size check
        file_size = getattr(file, "size", None)
        if file_size is not None and file_size > MAX_FILE_SIZE_BYTES:
            raise ValueError(f"File size exceeds safety limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB.")

        # 2. Content / format verification using Pillow
        try:
            # Read first chunk or full stream
            file.seek(0)
            img = Image.open(file)
            img_format = (img.format or "").upper()

            if img_format not in ALLOWED_IMAGE_FORMATS:
                raise ValueError(
                    f"Unsupported image format: {img_format or 'Unknown'}. Please upload a JPEG, PNG, or WebP image."
                )

            # Check dimensions against decompression bomb / excessive sizes
            width, height = img.size
            if width > MAX_DIMENSION or height > MAX_DIMENSION:
                raise ValueError("Image dimensions exceed the maximum allowed limits (10,000px).")

            # Verify integrity
            img.verify()
        except UnidentifiedImageError:
            raise ValueError("The uploaded file is not a valid or supported image.")
        except Exception as exc:
            if isinstance(exc, ValueError):
                raise exc
            raise ValueError(f"Invalid image file: {str(exc)}")
        finally:
            file.seek(0)

    def upload_profile_image(self, user_id: int, file) -> Dict[str, str]:
        self.ensure_configured()
        self.validate_image(file)

        # Deterministic public_id enforces: 1 user = 1 active Cloudinary profile asset
        public_id = f"sb-chat/profiles/user_{user_id}"

        try:
            file.seek(0)
            upload_result = cloudinary.uploader.upload(
                file,
                public_id=public_id,
                overwrite=True,
                invalidate=True,
                resource_type="image",
                transformation=[
                    {
                        "width": 512,
                        "height": 512,
                        "crop": "fill",
                        "gravity": "face",
                    },
                    {
                        "fetch_format": "auto",
                        "quality": "auto",
                    },
                ],
            )

            secure_url = upload_result.get("secure_url")
            returned_public_id = upload_result.get("public_id", public_id)

            if not secure_url:
                raise ValueError("Cloudinary upload failed: No secure URL returned.")

            return {
                "profile_image_url": secure_url,
                "profile_image_public_id": returned_public_id,
            }
        except Exception as exc:
            logger.error(f"[CloudinaryService] Failed to upload image for user {user_id}: {exc}")
            raise ValueError(f"Failed to upload profile picture: {str(exc)}")

    def delete_image(self, public_id: Optional[str]) -> bool:
        if not public_id:
            return False

        self.ensure_configured()
        try:
            result = cloudinary.uploader.destroy(public_id, invalidate=True)
            return result.get("result") == "ok"
        except Exception as exc:
            logger.error(f"[CloudinaryService] Failed to delete Cloudinary asset {public_id}: {exc}")
            return False
