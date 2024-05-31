const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const { json } = require("stream/consumers");

// Retrieve DynamoDB table name and region from environment variables
const TABLE_NAME = process.env.TABLE_NAME;
const AWS_REGION = process.env.REGION_NAME;

// Initialize DynamoDB client
const dynamodbClient = new DynamoDBClient({ region:AWS_REGION});

// Define the Lambda handler function
exports.handler = async (event) => {
    console.log(JSON.stringify(event));
    
    const request = JSON.parse(event.body);
    try {
        const putItemParameters = {
            TableName: TABLE_NAME,
            Item: marshall(request)
        };

        const putItem = new PutItemCommand(putItemParameters);
        await dynamodbClient.send(putItem);

        console.log("Insertion into DB successfully");
    } catch (error) {
        console.error("Error inserting:", error);
        return {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Allow-Methods': 'OPTIONS,GET,PUT,POST,DELETE',
            },
            statusCode: 500,
            body: JSON.stringify("ERROR")
        };
    }

    return {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'OPTIONS,GET,PUT,POST,DELETE',
        },
        statusCode: 200,
        body: JSON.stringify("Sucessfully completed")
    };
};