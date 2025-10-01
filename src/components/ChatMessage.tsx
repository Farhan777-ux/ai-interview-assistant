import React from 'react';
import { Tag, Progress } from 'antd';
import { ClockCircleOutlined, RobotOutlined, UserOutlined, TrophyOutlined } from '@ant-design/icons';
import { ChatMessage as ChatMessageType } from '../types';
import dayjs from 'dayjs';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const getMessageStyle = () => {
    switch (message.type) {
      case 'user':
        return {
          backgroundColor: '#1890ff',
          color: 'white',
          marginLeft: '20%',
          borderRadius: '18px 18px 4px 18px',
        };
      case 'system':
        return {
          backgroundColor: '#f0f2f5',
          color: '#666',
          borderRadius: '18px',
          border: '1px solid #d9d9d9',
        };
      case 'question':
        return {
          backgroundColor: '#fff2e8',
          color: '#d46b08',
          borderRadius: '18px',
          border: '1px solid #ffd591',
        };
      case 'timer':
        return {
          backgroundColor: '#fff1f0',
          color: '#cf1322',
          borderRadius: '18px',
          border: '1px solid #ffaaa5',
        };
      case 'score':
        return {
          backgroundColor: '#f6ffed',
          color: '#389e0d',
          borderRadius: '18px',
          border: '1px solid #b7eb8f',
        };
      default:
        return {
          backgroundColor: '#f0f2f5',
          borderRadius: '18px',
        };
    }
  };

  const getMessageIcon = () => {
    switch (message.type) {
      case 'user':
        return <UserOutlined />;
      case 'system':
      case 'question':
        return <RobotOutlined />;
      case 'timer':
        return <ClockCircleOutlined />;
      case 'score':
        return <TrophyOutlined />;
      default:
        return <RobotOutlined />;
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'green';
      case 'Medium':
        return 'orange';
      case 'Hard':
        return 'red';
      default:
        return 'default';
    }
  };

  return (
    <div
      style={{
        marginBottom: 16,
        display: 'flex',
        flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 8,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: message.type === 'user' ? '#1890ff' : '#f0f2f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: message.type === 'user' ? 'white' : '#666',
          flexShrink: 0,
        }}
      >
        {getMessageIcon()}
      </div>
      
      <div
        style={{
          maxWidth: message.type === 'user' ? '80%' : '100%',
          minWidth: 'auto',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            ...getMessageStyle(),
            wordBreak: 'break-word',
          }}
        >
          {/* Question header with difficulty tag */}
          {message.type === 'question' && message.metadata?.difficulty && (
            <div style={{ marginBottom: 8 }}>
              <Tag color={getDifficultyColor(message.metadata.difficulty)}>
                {message.metadata.difficulty}
              </Tag>
              {message.metadata.questionNumber && (
                <Tag color="blue">
                  Question {message.metadata.questionNumber}/6
                </Tag>
              )}
            </div>
          )}
          
          {/* Timer display */}
          {message.type === 'timer' && message.metadata?.timeRemaining !== undefined && (
            <div style={{ marginBottom: 8 }}>
              <Progress
                percent={((message.metadata.timeLimit - message.metadata.timeRemaining) / message.metadata.timeLimit) * 100}
                status={message.metadata.timeRemaining <= 10 ? 'exception' : 'active'}
                showInfo={false}
                size="small"
              />
            </div>
          )}
          
          {/* Score display */}
          {message.type === 'score' && message.metadata?.score !== undefined && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                Score: {message.metadata.score}/10
              </div>
              {message.metadata.feedback && (
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                  {message.metadata.feedback}
                </div>
              )}
            </div>
          )}
          
          <div>{message.content}</div>
        </div>
        
        <div
          style={{
            fontSize: 11,
            color: '#999',
            marginTop: 4,
            textAlign: message.type === 'user' ? 'right' : 'left',
          }}
        >
          {dayjs(message.timestamp).format('HH:mm:ss')}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;