import boto3
import sys

def process_file(unique_fileID,bucket_name,table_name,region):
    
	# Initialize Boto3 clients for DynamoDB and S3
    dynamodb = boto3.resource('dynamodb',region_name=region)
    s3 = boto3.client('s3')

	# Retrieve item from DynamoDB table
    table = dynamodb.Table(table_name)
    try:
        response = table.get_item(
            Key={'id': unique_fileID}
        )
        item = response.get('Item')

    except Exception as e:
        print(f"Error GETTING item from DynamoDB: {e}")
        return None
    # Extract input text and input file path from DynamoDB item
    input_text=item['inputValue']
    items=item['input_path'].split('/')
    input_filepath=items[1]
    output_filepath=input_filepath.split('.')[0]+"-"+unique_fileID+".txt"
    # Retrieve input file content from S3
    try:
        response = s3.get_object(Bucket=bucket_name, Key=input_filepath)
        input_file_content = response['Body'].read().decode('utf-8')
    except Exception as e:
        print(f"Error getting file from S3: {e}")
        return
    # Combine input file content and input text
    output_content = f"{input_file_content} {input_text}"
    # Upload combined output content to S3
    try:
        s3.put_object(Bucket=bucket_name, Key=output_filepath, Body=output_content)
    except Exception as e:
        print(f"Error adding output file to s3: {e}")
        return
    
    table = dynamodb.Table(table_name)
	# Update DynamoDB item with output file path
    try:
        full_output__path=bucket_name+"/"+output_filepath
        table.update_item(
            Key={'id': unique_fileID},
            UpdateExpression='SET output_filepath = :val1',
            ExpressionAttributeValues={':val1': full_output__path}
        )
    except Exception as e:
        print(f"Error adding dynamo DB {e}")
        return
    
    print("Successfully completed.")

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python script.py <unique_fileID> <input_text> <input_filepath> <output_filepath>")
        sys.exit(1)
    
	# Extract command-line arguments
    unique_fileID = sys.argv[1]
    bucket_name=sys.argv[2]
    table_name=sys.argv[3]
    region=sys.argv[4]
    
	# Call the process_file function with extracted arguments
    process_file(unique_fileID,bucket_name,table_name,region)
