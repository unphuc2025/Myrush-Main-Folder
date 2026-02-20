from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
import boto3
from botocore.exceptions import ClientError
from utils.s3_utils import get_s3_client, S3_BUCKET_NAME
import mimetypes

router = APIRouter(
    tags=["Media Proxy"]
)

@router.get("/media/{file_path:path}")
async def get_media(file_path: str):
    """
    Proxy endpoint to stream files from S3.
    This allows accessing S3 files even if the bucket is private.
    """
    s3_client = get_s3_client()
    if not s3_client:
        raise HTTPException(status_code=500, detail="S3 Client unavailable")

    try:
        # Get object from S3
        # Response includes Body which is a botocore.response.StreamingBody
        s3_response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=file_path)
        
        content_type = s3_response.get('ContentType', 'application/octet-stream')
        # If S3 doesn't have content type, guess it
        if content_type == 'application/octet-stream':
            guessed_type, _ = mimetypes.guess_type(file_path)
            if guessed_type:
                content_type = guessed_type

        return StreamingResponse(
            s3_response['Body'].iter_chunks(),
            media_type=content_type
        )

    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code")
        if error_code == "NoSuchKey":
            raise HTTPException(status_code=404, detail="File not found")
        else:
            print(f"S3 Error: {e}")
            raise HTTPException(status_code=500, detail="Error fetching file from S3")
    except Exception as e:
        print(f"Error proxying media: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
