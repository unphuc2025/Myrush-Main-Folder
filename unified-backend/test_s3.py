import os
import boto3
from dotenv import load_dotenv

load_dotenv()

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-west-2")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

def test_s3():
    print(f"Testing S3 with Bucket: {S3_BUCKET_NAME}, Region: {AWS_REGION}")
    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        # Try to list objects (minimal permission check)
        response = s3.list_objects_v2(Bucket=S3_BUCKET_NAME, MaxKeys=1)
        print("SUCCESS: Connection established and objects listed.")
        print(f"Bucket contains: {len(response.get('Contents', []))} objects (polled 1)")
    except Exception as e:
        print(f"ERROR: S3 test failed: {e}")

if __name__ == "__main__":
    test_s3()
