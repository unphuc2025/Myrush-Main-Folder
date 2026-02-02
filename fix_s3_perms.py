import boto3
import json
import os
from botocore.exceptions import ClientError

AWS_ACCESS_KEY_ID=os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY=os.environ.get("AWS_SECRET_ACCESS_KEY")
AWS_REGION="us-west-1"
S3_BUCKET_NAME="clouddot-sample"

s3 = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

print(f"Fixing permissions for bucket: {S3_BUCKET_NAME}")

try:
    print("Disabling Block Public Access...")
    s3.delete_public_access_block(Bucket=S3_BUCKET_NAME)
    print("Success: Block Public Access disabled.")
except ClientError as e:
    print(f"Error disabling block public access: {e}")

policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": f"arn:aws:s3:::{S3_BUCKET_NAME}/*"
        }
    ]
}

try:
    print("Applying Bucket Policy...")
    s3.put_bucket_policy(Bucket=S3_BUCKET_NAME, Policy=json.dumps(policy))
    print("Success: Bucket Policy applied.")
except ClientError as e:
    print(f"Error applying bucket policy: {e}")
