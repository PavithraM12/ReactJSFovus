# ReactJSFovus
## Fovus Coding Challenge

### Use Case Description
As a user, you want to create an automated web application that allows you to add text input and upload files. This application processes the inputs, combines them, and stores the result using a unique ID-generated file. The management of this application is handled using AWS services such as S3, DynamoDB, Lambda, and EC2, with AWS CDK for infrastructure stack.

### Steps to Implement
#### Clone the git repository.
### Step 1: Create React JS Web Application
Follow the [official React documentation](https://legacy.reactjs.org/docs/create-a-new-react-app.html) to set up a new React JS application.

### Step 2: AWS CDK Setup
Refer to the [AWS CDK Getting Started Guide](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html) for setting up AWS CDK to manage the infrastructure for the project.

### Step 3: CDK Commands
Execute the following commands to stack the AWS services and integrate all required resources such as user, security group ID, S3 bucket name, DynamoDB table name, and VPC, providing necessary access:

```sh
#Navigate to file-cdk directory and install all dependencies needed.
cd \file-cdk

# Synthesize the CDK app
cdk synth

# Bootstrap the CDK environment
cdk bootstrap

# Deploy the CDK stack
cdk deploy
```

### Step 4: Install dependencies in dynamodbtrigger and lambdafunction directories
```sh
# Navigate to dynamodbtrigger directory and install all dependencies needed.
cd \dynamodbtrigger
npm install

# Navigate to lambdafunction directory and install all dependencies needed.
cd \lambdafunction
npm install
```

### Step 5: Run the React Application
Once the infrastructure setup is successful, run the following command to start the application front-end:

```sh
# Navigate to file-cdk directory and install all dependencies needed.
cd \file_process
npm install

# Start the React application
npm start
```

Upload the file, add the text input, and click on the "Upload" button. A new file with the filename and unique ID will be created in the S3 bucket, containing the combined text, which is the expected result.

### Results
Results are documented in the Results.docx file.
