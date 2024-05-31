const { DynamoDBClient, SendCommandCommand } = require("@aws-sdk/client-dynamodb");
const { EC2Client, RunInstancesCommand } = require("@aws-sdk/client-ec2");
const { encode } = require('base-64');

// Environment Variables
const BUCKET_NAME=process.env.BUCKET_NAME;
const TABLE_NAME=process.env.TABLE_NAME;
const ARN=process.env.ARN;
const securityGroupId=process.env.securityGroupId;
const keypair=process.env.KeyPair;
const AWS_REGION=process.env.REGION_NAME;

// Initialize AWS SDK clients with the specified region
const ec2Client = new EC2Client({ region: AWS_REGION });
const dynamodbClient = new DynamoDBClient({ region: AWS_REGION });

exports.handler = async (event) => {
    console.log(JSON.stringify(event));

    if (event.Records[0].eventName === "INSERT") {
        const id = event.Records[0].dynamodb.Keys.id.S;
		
		 // Define the user data script to be run on the EC2 instance at startup
        const userDataScript = `#!/bin/bash
            sudo apt update
            sudo apt install -y python3-pip
            pip install boto3
            sudo apt install unzip
            curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
            unzip awscliv2.zip
            sudo ./aws/install
            aws s3 cp s3://${BUCKET_NAME}/process-file.py process-file.py
            python3 process-file.py ${id} ${BUCKET_NAME} ${TABLE_NAME} ${AWS_REGION}
            instance_id=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
            aws ec2 terminate-instances --instance-ids $instance_id --region ${AWS_REGION}`;
		
		
        // Encode the user data script in base-64 format
        const encodedUserData = encode(userDataScript);
		
		// Define the parameters for the EC2 instance to be launched
        try {
            const instanceParameters = {
                ImageId: 'image ID', // add available image ID based on region selected
                InstanceType: 'instance type', // add available instancetype based on region selected
                MinCount: 1,
                MaxCount: 1,
                UserData: encodedUserData,
                KeyName: keypair,
                securityGroupIds:[securityGroupId],
                IamInstanceProfile: { Arn: ARN }
            };

            const runInstance = new RunInstancesCommand(instanceParameters);
            const response = await ec2Client.send(runInstance);
            const instanceId = response.Instances[0].InstanceId;
            console.log("Instance ID:", instanceId);
        } catch (error) {
            console.error("EC2 instance starting error:", error);
            return {
                statusCode: 500,
                body: "EC2 instance starting error"
            };
        }
    }

    console.log("EC2 Process coompleted");

    return {
        statusCode: 200,
        body: "Completed"
    };
};
