import React from 'react';
import { Modal, Button, Card, Tag, Typography, message } from 'antd';
import { PlayCircleOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setShowWelcomeBack, setCurrentCandidate, setIsInterviewActive } from '../store/appSlice';
import { deleteCandidate } from '../store/candidatesSlice';
import { Candidate } from '../types';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

const { Text } = Typography;

const WelcomeBackModal: React.FC = () => {
  const dispatch = useDispatch();
  const { showWelcomeBack } = useSelector((state: RootState) => state.app);
  const { candidates } = useSelector((state: RootState) => state.candidates);
  
  // Find candidates with unfinished interviews
  const unfinishedCandidates = candidates.filter(candidate => 
    candidate.status === 'in-progress' || 
    (candidate.status === 'incomplete' && candidate.interview)
  );

  const handleResumeInterview = (candidateId: string) => {
    dispatch(setCurrentCandidate(candidateId));
    dispatch(setIsInterviewActive(true));
    dispatch(setShowWelcomeBack(false));
  };

  const handleDeleteCandidate = (candidateId: string) => {
    Modal.confirm({
      title: 'Delete Interview Session',
      content: 'Are you sure you want to delete this interview session? This action cannot be undone.',
      okButtonProps: { danger: true },
      onOk: () => {
        try {
          // Stop any active interview and clear current selection
          dispatch(setIsInterviewActive(false));
          dispatch(setCurrentCandidate(undefined));
          // Delete the candidate session
          dispatch(deleteCandidate(candidateId));
          // Close the modal (immediately) and show feedback
          dispatch(setShowWelcomeBack(false));
          message.success('Interview session deleted');
        } catch (e) {
          console.error('Failed to delete interview session', e);
          message.error('Failed to delete interview session');
        }
      },
    });
  };

  const handleStartNewInterview = () => {
    dispatch(setShowWelcomeBack(false));
  };

  const getTimeElapsed = (candidate: Candidate) => {
    if (!candidate.interview) return '';
    
    const startTime = candidate.interview.startedAt;
    const now = Date.now();
    const duration = dayjs.duration(now - startTime);
    
    if (duration.asHours() >= 1) {
      return `${Math.floor(duration.asHours())}h ${duration.minutes()}m ago`;
    }
    return `${duration.minutes()}m ago`;
  };

  const getProgressInfo = (candidate: Candidate) => {
    if (!candidate.interview) return { completed: 0, total: 6 };
    
    const completed = candidate.interview.questions.filter(q => q.answer !== undefined).length;
    return { completed, total: candidate.interview.questions.length };
  };

  if (!showWelcomeBack || unfinishedCandidates.length === 0) {
    return null;
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClockCircleOutlined style={{ color: '#1890ff' }} />
          Welcome Back!
        </div>
      }
      open={showWelcomeBack}
      onCancel={handleStartNewInterview}
      footer={[
        <Button key="new" onClick={handleStartNewInterview}>
          Start New Interview
        </Button>
      ]}
      width={600}
      maskClosable={false}
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          You have {unfinishedCandidates.length} unfinished interview{unfinishedCandidates.length > 1 ? 's' : ''}. 
          Would you like to continue where you left off?
        </Text>
      </div>

      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {unfinishedCandidates.map((candidate) => {
          const progress = getProgressInfo(candidate);
          const timeElapsed = getTimeElapsed(candidate);
          
          return (
            <Card
              key={candidate.id}
              size="small"
              style={{ marginBottom: 12 }}
              actions={[
                <Button
                  key="resume"
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleResumeInterview(candidate.id)}
                  size="small"
                >
                  Resume Interview
                </Button>,
                <Button
                  key="delete"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteCandidate(candidate.id)}
                  size="small"
                >
                  Delete
                </Button>
              ]}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <Text strong>{candidate.name}</Text>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {candidate.email}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Tag color={candidate.status === 'in-progress' ? 'processing' : 'default'}>
                      {candidate.status === 'in-progress' ? 'In Progress' : 'Paused'}
                    </Tag>
                    {candidate.interview?.isPaused && (
                      <Tag color="warning" style={{ marginLeft: 4 }}>
                        Paused
                      </Tag>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Progress: {progress.completed}/{progress.total} questions
                    </Text>
                    <div style={{ marginTop: 4 }}>
                      <div 
                        style={{ 
                          width: 200, 
                          height: 4, 
                          backgroundColor: '#f0f0f0', 
                          borderRadius: 2,
                          overflow: 'hidden'
                        }}
                      >
                        <div 
                          style={{ 
                            width: `${(progress.completed / progress.total) * 100}%`,
                            height: '100%',
                            backgroundColor: '#1890ff',
                            transition: 'width 0.3s'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {timeElapsed && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Started {timeElapsed}
                    </Text>
                  )}
                </div>

                {candidate.interview && candidate.interview.currentQuestionIndex < candidate.interview.questions.length && (
                  <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                    <Text style={{ fontSize: 12 }}>
                      <Text type="secondary">Next:</Text>{' '}
                      <Tag 
                        color={
                          candidate.interview.questions[candidate.interview.currentQuestionIndex]?.difficulty === 'Easy' ? 'green' :
                          candidate.interview.questions[candidate.interview.currentQuestionIndex]?.difficulty === 'Medium' ? 'orange' : 'red'
                        }
                      >
                        {candidate.interview.questions[candidate.interview.currentQuestionIndex]?.difficulty}
                      </Tag>
                      {candidate.interview.questions[candidate.interview.currentQuestionIndex]?.text.substring(0, 60)}
                      {candidate.interview.questions[candidate.interview.currentQuestionIndex]?.text.length > 60 ? '...' : ''}
                    </Text>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {unfinishedCandidates.length > 1 && (
        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
          <Text style={{ fontSize: 12, color: '#389e0d' }}>
            💡 Tip: You can manage all your interview sessions from the Interviewer dashboard.
          </Text>
        </div>
      )}
    </Modal>
  );
};

export default WelcomeBackModal;