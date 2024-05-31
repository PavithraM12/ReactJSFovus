import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 as s3, aws_lambda as lambda, aws_dynamodb as dynamodb, aws_apigateway as apigateway} from 'aws-cdk-lib';
import { aws_iam as iam, aws_s3_notifications as s3_notifications,aws_lambda_event_sources as lambdaEventSources } from 'aws-cdk-lib';
import { aws_ec2 as ec2} from 'aws-cdk-lib';
import { aws_s3_deployment as s3deploy } from 'aws-cdk-lib';

export class FileCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
	// Retrieve AWS region from the stack environment
    const region=this.region;
	// Create an IAM user with administrator access
    const adminUser = new iam.User(this, 'AdminUser', {
      userName: 'awsreact'
    });

    adminUser.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'));

     // Create an access key for the IAM user
     const accessKey = new iam.CfnAccessKey(this, 'AdminUserAccessKey-${cdk.Names.uniqueId()}', {
      userName: adminUser.userName
    });
    // Create an IAM role for EC2 instances
    const ec2role = new iam.Role(this, 'MyEc2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      roleName: 'MyEc2Role', 
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'), 
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore') ,
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2FullAccess') 
      ]
    });

    // Create an instance profile for the EC2 role
	const ec2instance = new iam.CfnInstanceProfile(this, 'MyInstanceProfile', {
      roles: [ec2role.roleName]
    });

    // defining s3 bucket
    const s3bucket = new s3.Bucket(this, 'project_s3_bucket', {
      versioned: true
    });

    s3bucket.addCorsRule({
      allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.DELETE, s3.HttpMethods.POST],
      allowedOrigins: ['*'],
      allowedHeaders: ['*'],
    });

    // Deploy a script file to the S3 bucket
	new s3deploy.BucketDeployment(this, 'DeployFile', {
      sources: [s3deploy.Source.asset('../outputFile')],
      destinationBucket: s3bucket
    });
    
   // Create a DynamoDB table with 'id' as the primary key
    const dynamotable = new dynamodb.Table(this, 'dynamodb_table', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      stream: dynamodb.StreamViewType.NEW_IMAGE
    });

    // Create a Lambda function
    const lambdafn1 = new lambda.Function(this, 'insertdbfunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../lambdafuntion'),
      environment: {
        TABLE_NAME: dynamotable.tableName,
        REGION_NAME:region
      }
    });

    dynamotable.grantReadWriteData(lambdafn1);
    s3bucket.grantReadWrite(lambdafn1);

    // Create a role for API Gateway
    const apiGateway = new iam.Role(this, 'ApiGatewayRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      roleName: 'MyApiGatewayRole'
    });

    apiGateway.addToPolicy(new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [lambdafn1.functionArn]
    }));

    const api = new apigateway.RestApi(this, 'MyApi',
    {
      restApiName: "MyApi",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS
      },
    }
    );
    
    // Integrate Lambda function with the API Gateway
	const integrateLambda = new apigateway.LambdaIntegration(lambdafn1);

    api.root.addMethod('POST', integrateLambda);

	const keyPair = new ec2.KeyPair(this, 'MyKeyPair', {
      keyPairName: 'key-pair'
    });

    const vpc = new ec2.Vpc(this, 'MyVpc', {
      maxAzs: 2
    });

    const securityGroup = new ec2.SecurityGroup(this, 'MySecurityGroup', {
      vpc,  
      allowAllOutbound: true,
      securityGroupName: 'MySecurityGroup',
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH from anywhere');

    // Create a Lambda role for trigger function
	const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('IAMFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ]
    });

	lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['iam:PassRole'],
      resources: [ec2role.roleArn]
    }));

    const lambdafn2 = new lambda.Function(this, 'triggerfunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../dynamodbtrigger'),
      environment: {
        TABLE_NAME: dynamotable.tableName,
        securityGroupId:securityGroup.securityGroupId,
        keyPair:keyPair.keyPairName,
        BUCKET_NAME:s3bucket.bucketName,
        ARN: ec2instance.attrArn,
        REGION_NAME:region
      },
      role:lambdaRole
    });

    lambdafn2.addEventSource(new lambdaEventSources.DynamoEventSource(dynamotable, {
      startingPosition: lambda.StartingPosition.LATEST
    }));

    new cdk.CfnOutput(this, 'AdminUserAccessKey', { value: accessKey.ref });
    new cdk.CfnOutput(this, 'AdminUserSecretAccessKey', { value: accessKey.attrSecretAccessKey });
    new cdk.CfnOutput(this, 'region', { value: region });
    new cdk.CfnOutput(this, 's3 bucket name', { value: s3bucket.bucketName });
    new cdk.CfnOutput(this, 'Dynamo db name', { value: dynamotable.tableName});
    new cdk.CfnOutput(this, 'api path', { value: api.url});
    
  }
}
