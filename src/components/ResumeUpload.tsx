import React, { useState, useCallback, useEffect } from 'react';
import { Upload, message, Button, Card, Progress, Alert } from 'antd';
import { InboxOutlined, DeleteOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { addCandidate } from '../store/candidatesSlice';
import { setCurrentCandidate } from '../store/appSlice';
import { RootState } from '../store';
import {
  validateFileType,
  formatFileSize,
  extractTextFromPDF,
  extractTextFromDOCX,
  extractCandidateInfo,
  ExtractedData
} from '../utils/resumeProcessor';

const { Dragger } = Upload;

interface ResumeUploadProps {
  onUploadComplete: (candidateId: string, extractedData: ExtractedData) => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [progress, setProgress] = useState(0);
  const [waitingForId, setWaitingForId] = useState(false);
  const dispatch = useDispatch();
  const { candidates } = useSelector((state: RootState) => state.candidates);
  
  // Watch for new candidates being added
  useEffect(() => {
    if (waitingForId && extractedData && candidates.length > 0) {
      const latestCandidate = candidates[candidates.length - 1];
      console.log('New candidate detected:', latestCandidate);
      
      dispatch(setCurrentCandidate(latestCandidate.id));
      onUploadComplete(latestCandidate.id, extractedData);
      setWaitingForId(false);
    }
  }, [candidates, waitingForId, extractedData, dispatch, onUploadComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const processFile = useCallback(async (file: File) => {
    setProgress(10);
    
    try {
      let text: string;
      
      if (file.type === 'application/pdf') {
        setProgress(30);
        text = await extractTextFromPDF(file);
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword'
      ) {
        setProgress(30);
        text = await extractTextFromDOCX(file);
      } else {
        throw new Error('Unsupported file type');
      }

      setProgress(60);
      
      const candidateInfo = extractCandidateInfo(text);
      setProgress(80);
      
      setExtractedData(candidateInfo);
      setProgress(100);
      
      message.success('Resume processed successfully!');
      
      // Create candidate and add to store
      const candidateData = {
        name: candidateInfo.name || '',
        email: candidateInfo.email || '',
        phone: candidateInfo.phone || '',
        resumeText: candidateInfo.text,
        resumeFileName: file.name,
      };
      
      // Add candidate first to get the generated ID
      dispatch(addCandidate(candidateData));
      setWaitingForId(true);
      
    } catch (error) {
      console.error('Error processing file:', error);
      message.error('Failed to process resume. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [dispatch, onUploadComplete]);

  const handleUpload = useCallback(async (file: File) => {
    if (!validateFileType(file)) {
      message.error('Please upload a PDF or DOCX file only.');
      return false;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      message.error('File size must be less than 10MB.');
      return false;
    }

    setUploading(true);
    setUploadedFile(file);
    setProgress(0);
    
    await processFile(file);
    
    return false; // Prevent default upload
  }, [processFile]);

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setExtractedData(null);
    setProgress(0);
  };

  const uploadProps = {
    name: 'resume',
    multiple: false,
    accept: '.pdf,.docx,.doc',
    beforeUpload: handleUpload,
    showUploadList: false,
  };

  const handleTestMode = () => {
    console.log('🧪 Test mode clicked!');
    
    // Create a test candidate without file upload
    const testData: ExtractedData = {
      name: 'Test Candidate',
      email: 'test@example.com',
      phone: '(555) 123-4567',
      text: 'Test candidate resume text for interview demonstration.'
    };
    
    console.log('🧪 Creating test candidate');
    
    const candidateData = {
      name: testData.name!,
      email: testData.email!,
      phone: testData.phone!,
      resumeText: testData.text,
      resumeFileName: 'test-resume.txt',
    };
    
    console.log('Dispatching addCandidate with data:', candidateData);
    
    setExtractedData(testData);
    dispatch(addCandidate(candidateData));
    setWaitingForId(true);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
      <Card title="Upload Your Resume" style={{ marginBottom: 20 }}>
        {!uploadedFile ? (
          <>
            <Dragger {...uploadProps} disabled={uploading}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag file to this area to upload
              </p>
              <p className="ant-upload-hint">
                Support for PDF and DOCX files only. Maximum file size: 10MB.
              </p>
            </Dragger>
            
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <div style={{ margin: '10px 0', color: '#999', fontSize: '14px' }}>OR</div>
              <Button 
                type="dashed" 
                onClick={handleTestMode}
                style={{ marginTop: '10px' }}
              >
                🧪 Start Test Interview (Skip Upload)
              </Button>
            </div>
          </>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold' }}>{uploadedFile.name}</div>
                <div style={{ color: '#666', fontSize: 12 }}>
                  {formatFileSize(uploadedFile.size)}
                </div>
              </div>
              <Button
                type="text"
                icon={<DeleteOutlined />}
                onClick={handleRemoveFile}
                disabled={uploading}
              />
            </div>
            
            {uploading && (
              <Progress
                percent={progress}
                status={progress === 100 ? 'success' : 'active'}
                style={{ marginBottom: 16 }}
              />
            )}
            
            {extractedData && !uploading && (
              <div style={{ marginTop: 16 }}>
                <Alert
                  message="Resume Processed Successfully!"
                  description={
                    <div style={{ marginTop: 8 }}>
                      <div><strong>Extracted Information:</strong></div>
                      <div>Name: {extractedData.name || 'Not found'}</div>
                      <div>Email: {extractedData.email || 'Not found'}</div>
                      <div>Phone: {extractedData.phone || 'Not found'}</div>
                      {(!extractedData.name || !extractedData.email || !extractedData.phone) && (
                        <div style={{ marginTop: 8, color: '#ff4d4f' }}>
                          Missing fields will be collected during the chat interview.
                        </div>
                      )}
                    </div>
                  }
                  type="success"
                  showIcon
                />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ResumeUpload;