
import os
import boto3
from fastapi import UploadFile, HTTPException
import uuid
import logging
from botocore.exceptions import NoCredentialsError, ClientError
from dotenv import load_dotenv

# Load environment variables explicitly
load_dotenv()

# Configure logger
logger = logging.getLogger(__name__)

# AWS Configuration from Environment Variables
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-west-2")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

def get_s3_client():
    """Creates and returns a boto3 S3 client."""
    if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
        # For development/local testing without S3 keys, we might want to fallback or warn
        # But for this implementation, we assume keys are present if we're calling this.
        logger.warning("AWS Credentials not found in environment variables.")
        return None

    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        return s3_client
    except Exception as e:
        logger.error(f"Failed to create S3 client: {e}")
        return None

async def upload_file_to_s3(file: UploadFile, folder: str = "uploads") -> str:
    """
    Uploads a file to AWS S3 and returns the public URL.
    
    Args:
        file: The file object from FastAPI UploadFile.
        folder: The folder path in the bucket (e.g., "venues", "profiles").
        
    Returns:
        str: The S3 URL of the uploaded file.
        
    Raises:
        HTTPException: If upload fails.
    """
    s3_client = get_s3_client()
    
    if not s3_client:
        # Fallback for when S3 is not configured? 
        # Or raise error to force configuration. 
        # Let's raise error for now as we want to enforce S3 usage.
        raise HTTPException(status_code=500, detail="AWS S3 configuration missing.")

    if not S3_BUCKET_NAME:
        raise HTTPException(status_code=500, detail="S3 Bucket name not configured.")

    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    s3_key = f"{folder}/{unique_filename}"
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Upload to S3
        # Upload to S3
        # Note: ACL='public-read' is removed because many buckets enforce "Bucket Owner Enforced"
        # which disables ACLs. The bucket policy should handle public access if needed.
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=s3_key,
            Body=file_content,
            ContentType=file.content_type
        )
        
        # Reset file cursor for further use if needed (standard practice)
        await file.seek(0)
        
        # Construct URL
        # Construct URL based on region
        # Construct Proxy URL instead of direct S3 URL
        # This solves issues with private buckets and CORS
        url = f"/api/media/{s3_key}"
             
        # Log the URL for debugging
        logger.info(f"File uploaded successfully. Proxy URL: {url}")
             
        return url

    except NoCredentialsError:
        logger.error("AWS Credentials not available.")
        raise HTTPException(status_code=500, detail="AWS authentication failed.")
    except ClientError as e:
        logger.error(f"AWS ClientError: {e}")
        raise HTTPException(status_code=500, detail=f"S3 upload failed: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error during S3 upload: {e}")
        raise HTTPException(status_code=500, detail="File upload failed.")
