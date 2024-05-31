import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import { useState } from "react";
import { nanoid } from "nanoid";
import './App.css';
function App() {
  const [file, setFileInput] = useState(null);
  const [inputText, setInputText] = useState('')

  const handleTextInput = (event) => {
      setInputText(event.target.value);
      };
    
const handleFileChange = (e) => {
  const file = e.target.files[0];
  setFileInput(file);
};

// Add the values to environment variables once the CDK deployment completed
  const submitFile = async () => {
     
	// Environment Variables
    const S3_BUCKET = "S3 Bucket Value";
	const AWS_REGION = "AWS Region";
    const AWS_CREDENTIALS = {
        accessKeyId: "acess key generation",
        secretAccessKey: "secret access key"
    }
    const s3Client = new S3Client({
        region: AWS_REGION,
        credentials: AWS_CREDENTIALS
    });
		// Send a POST request to save data to DynamoDB
    const response = await fetch(API_PATH, {
      method: "POST",
      headers: {
        "Content-Type":"application/json",
      },
      body: JSON.stringify(dynamoDbData),
    });
	try {
		  // Send the command to upload the file to S3
          const response = await s3Client.send(command);
          console.log(response);
          alert("File uploaded successfully.");
      } catch (err) {
          console.error(err);
          alert("Error uploading file.");
      }
	  const command = new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: file.name,
          Body: file
      });
	const API_PATH='api path'
    const dynamoDbData = {
      id: nanoid(),
      inputValue: inputText,
      input_path: `${S3_BUCKET}/${file.name}`,
    };
	if (!response.ok) {
      throw new Error("Error saving data to DB");
    }
    alert("File uploaded and data saved successfully!");
    
  };
  
  return (
    <div className="container">
    <form className="form">
      <div className="form-group">
        <label htmlFor="inputText">Text input:</label>
        <input
          type="text"
          id="inputText"
          value={inputText}
          onChange={handleTextInput}
        />
      </div>
      <div className="form-group">
        <label htmlFor="fileInput">File input:</label>
        <input
          type="file"
          id="fileInput"
          onChange={handleFileChange}
        />
      </div>
      <div className="form-group">
        <button
          type="button"
          onClick={submitFile}
        >
          Submit
        </button>
      </div>
    </form>
  </div>

  );
}

export default App;