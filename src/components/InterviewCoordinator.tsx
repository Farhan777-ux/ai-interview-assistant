import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Input, Button, Form, message, Card } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import {
  updateCandidate,
  startInterview,
  addChatMessage
} from '../store/candidatesSlice';
import { setIsInterviewActive } from '../store/appSlice';
import { generateQuestions } from '../utils/aiService';
import { ExtractedData } from '../utils/resumeProcessor';
import ChatInterface from './ChatInterface';

interface InterviewCoordinatorProps {
  candidateId: string;
  extractedData: ExtractedData;
}

const InterviewCoordinator: React.FC<InterviewCoordinatorProps> = ({
  candidateId,
  extractedData
}) => {
  const [form] = Form.useForm();
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const dispatch = useDispatch();
  
  const { candidates } = useSelector((state: RootState) => state.candidates);
  console.log('🔍 Looking for candidate with ID:', candidateId);
  console.log('🔍 Available candidates:', candidates.map(c => ({ id: c.id, name: c.name })));
  const candidate = candidates.find(c => c.id === candidateId);
  console.log('🔍 Found candidate:', candidate);
  
  const startInterviewProcess = useCallback(async () => {
    if (!candidate) {
      console.log('No candidate available for interview');
      return;
    }
    
    console.log('Starting interview for candidate:', candidate.name);
    setIsStartingInterview(true);
    
    try {
      // Generate interview questions
      const questions = generateQuestions();
      console.log('Generated questions:', questions);
      
      // Initialize first question timer
      questions[0].startedAt = Date.now();
      questions[0].timeRemaining = questions[0].timeLimit;
      
      // Start the interview
      dispatch(startInterview({
        candidateId,
        questions
      }));
      console.log('Dispatched startInterview');
      
      // Add welcome message
      dispatch(addChatMessage({
        candidateId,
        message: {
          type: 'system',
          content: `Welcome ${candidate.name}! 🎯 Your interview is about to begin.\n\nThis is a Full-Stack Developer interview with 6 questions:\n• 2 Easy questions (20 seconds each)\n• 2 Medium questions (60 seconds each)\n• 2 Hard questions (120 seconds each)\n\nYou can pause the interview at any time. Good luck! 🚀`
        }
      }));
      console.log('Added welcome message');
      
      // Add first question
      setTimeout(() => {
        console.log('Adding first question:', questions[0].text);
        dispatch(addChatMessage({
          candidateId,
          message: {
            type: 'question',
            content: questions[0].text,
            questionId: questions[0].id,
            metadata: {
              difficulty: questions[0].difficulty,
              questionNumber: 1
            }
          }
        }));
        
        dispatch(setIsInterviewActive(true));
        console.log('Interview activated');
      }, 2000);
      
    } catch (error) {
      console.error('Error starting interview:', error);
      message.error('Failed to start interview. Please try again.');
    } finally {
      setIsStartingInterview(false);
    }
  }, [candidate, candidateId, dispatch]);
  
  useEffect(() => {
    console.log('📋 InterviewCoordinator useEffect triggered');
    console.log('📋 candidateId:', candidateId);
    console.log('📋 candidate:', candidate);
    console.log('📋 candidates array:', candidates);
    
    if (!candidate) {
      console.log('❌ No candidate found with ID:', candidateId);
      return;
    }
    
    // Skip if interview already started
    if (candidate.interview) {
      console.log('Interview already exists for candidate');
      return;
    }
    
    // Check if any required fields are missing
    const missingFields = [];
    if (!candidate.name) missingFields.push('name');
    if (!candidate.email) missingFields.push('email');
    if (!candidate.phone) missingFields.push('phone');
    
    console.log('Missing fields:', missingFields);
    
    if (missingFields.length > 0) {
      setShowMissingFieldsModal(true);
      // Set initial form values
      form.setFieldsValue({
        name: candidate.name || '',
        email: candidate.email || '',
        phone: candidate.phone || ''
      });
    } else {
      // All fields present, start interview
      console.log('Starting interview process for candidate:', candidate.name);
      startInterviewProcess();
    }
  }, [candidate, candidateId, form, startInterviewProcess]);
  
  const handleMissingFieldsSubmit = async (values: any) => {
    try {
      // Update candidate with missing information
      dispatch(updateCandidate({
        id: candidateId,
        updates: {
          name: values.name || candidate?.name || '',
          email: values.email || candidate?.email || '',
          phone: values.phone || candidate?.phone || ''
        }
      }));
      
      setShowMissingFieldsModal(false);
      
      // Start interview after fields are collected
      setTimeout(() => {
        startInterviewProcess();
      }, 500);
      
    } catch (error) {
      message.error('Failed to save information. Please try again.');
    }
  };
  
  // Show loading while starting interview
  if (isStartingInterview) {
    return (
      <div style={{ 
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <Card style={{ textAlign: 'center', minWidth: 300 }}>
          <div style={{ fontSize: 18, marginBottom: 16 }}>🚀 Preparing your interview...</div>
          <div style={{ color: '#666' }}>Generating questions and setting up timers</div>
        </Card>
      </div>
    );
  }
  
  // Show chat interface if interview is started
  if (candidate?.interview) {
    return <ChatInterface candidateId={candidateId} />;
  }
  
  return (
    <>
      {/* Missing Fields Modal */}
      <Modal
        title="Complete Your Profile"
        open={showMissingFieldsModal}
        onOk={form.submit}
        onCancel={() => setShowMissingFieldsModal(false)}
        width={500}
        maskClosable={false}
        closable={false}
      >
        <div style={{ marginBottom: 16, color: '#666' }}>
          We need some additional information to personalize your interview experience.
        </div>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleMissingFieldsSubmit}
        >
          {!candidate?.name && (
            <Form.Item
              name="name"
              label="Full Name"
              rules={[{ required: true, message: 'Please enter your full name' }]}
            >
              <Input placeholder="Enter your full name" />
            </Form.Item>
          )}
          
          {!candidate?.email && (
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email address' }
              ]}
            >
              <Input placeholder="Enter your email address" />
            </Form.Item>
          )}
          
          {!candidate?.phone && (
            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[{ required: true, message: 'Please enter your phone number' }]}
            >
              <Input placeholder="Enter your phone number" />
            </Form.Item>
          )}
        </Form>
      </Modal>
      
      {/* Default loading state */}
      <div style={{ 
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center' 
      }}>
        <Card style={{ textAlign: 'center' }}>
          <div>Loading interview...</div>
        </Card>
      </div>
    </>
  );
};

export default InterviewCoordinator;
