import React, { useState, useCallback, useEffect } from 'react';
import { Upload, message, Button, Card, Progress, Alert, Form, Input } from 'antd';
import { formatPhoneIndia, normalizeTo10Digits } from '../utils/phone';
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
  const [needsInfo, setNeedsInfo] = useState(false);
  const [missing, setMissing] = useState({ name: false, email: false, phone: false });
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

      const missingNow = {
        name: !candidateInfo.name || candidateInfo.name.trim() === '',
        email: !candidateInfo.email || candidateInfo.email.trim() === '',
        phone: !candidateInfo.phone || candidateInfo.phone.trim() === '',
      };
      setMissing(missingNow);
      
      message.success('Resume processed successfully!');
      
      if (missingNow.name || missingNow.email || missingNow.phone) {
        // Ask user to provide missing details before proceeding
        setNeedsInfo(true);
        return;
      }
      
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

  const handleMissingSubmit = (values: { name?: string; email?: string; phone?: string }) => {
    if (!extractedData) return;

    const finalData: ExtractedData = {
      ...extractedData,
      name: missing.name ? values.name : extractedData.name,
      email: missing.email ? values.email : extractedData.email,
      phone: missing.phone ? normalizeTo10Digits(values.phone) : normalizeTo10Digits(extractedData.phone),
    };

    setExtractedData(finalData);

    const candidateData = {
      name: finalData.name || '',
      email: finalData.email || '',
      phone: finalData.phone || '',
      resumeText: finalData.text,
      resumeFileName: uploadedFile?.name || 'resume.txt',
    };

    dispatch(addCandidate(candidateData));
    setNeedsInfo(false);
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
                      <div>Phone: {extractedData.phone ? formatPhoneIndia(extractedData.phone) : 'Not found'}</div>
                      {(!extractedData.name || !extractedData.email || !extractedData.phone) && (
                        <div style={{ marginTop: 8, color: '#ff4d4f' }}>
                          Please provide the missing details below to continue to the interview.
                        </div>
                      )}
                    </div>
                  }
                  type="success"
                  showIcon
                />
                {needsInfo && (
                  <div style={{ marginTop: 16, padding: 16, border: '1px solid #f0f0f0', borderRadius: 8, background: '#fff' }}>
                    <div style={{ fontWeight: 600, marginBottom: 12 }}>Complete your details to proceed</div>
                    <Form layout="vertical" onFinish={handleMissingSubmit}>
                      {missing.name && (
                        <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter your name' }]}>
                          <Input placeholder="Your full name" />
                        </Form.Item>
                      )}
                      {missing.email && (
                        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
                          <Input placeholder="you@example.com" />
                        </Form.Item>
                      )}
                      {missing.phone && (
                        <Form.Item name="phone" label="Phone Number" rules={[{ required: true, message: 'Please enter your phone number' }, { pattern: /^\d{10}$/, message: 'Enter 10 digits' }]}>
                          <Input addonBefore="(+91)" placeholder="0123456789" maxLength={10} />
                        </Form.Item>
                      )}
                      <Form.Item>
                        <Button type="primary" htmlType="submit">Proceed to Interview</Button>
                      </Form.Item>
                    </Form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ResumeUpload;