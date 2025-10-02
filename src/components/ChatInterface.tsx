import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input, Button, Card, Progress, Tag, Space, Alert } from 'antd';
import { SendOutlined, PauseOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import {
  addChatMessage,
  updateQuestion,
  moveToNextQuestion,
  completeInterview,
  pauseInterview,
  resumeInterview
} from '../store/candidatesSlice';
import { setIsInterviewActive, setEndModal } from '../store/appSlice';
import ChatMessage from './ChatMessage';
import { scoreAnswer, generateFinalSummary } from '../utils/aiService';
import { TOTAL_QUESTIONS } from '../types';

const { TextArea } = Input;

interface ChatInterfaceProps {
  candidateId: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ candidateId }) => {
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tabEndRef = useRef(false);
  const dispatch = useDispatch();
  
  const { candidates, chatMessages } = useSelector((state: RootState) => state.candidates);
  const { isInterviewActive } = useSelector((state: RootState) => state.app);
  
  const candidate = candidates.find(c => c.id === candidateId);
  const messages = chatMessages[candidateId] || [];
  const interview = candidate?.interview;
  const currentQuestion = interview?.questions[interview.currentQuestionIndex];
  
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // End interview immediately if user switches browser tabs
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && interview && !interview.completedAt && !tabEndRef.current) {
        tabEndRef.current = true;
        // Show bold global modal via app state when user returns
        dispatch(setEndModal({ visible: true, message: "You've switched tabs. The interview is now ended." }));

        // Compute score so far (average of answered), keep it friendly
        const answered = interview.questions.filter(q => q.score !== undefined);
        const avg = answered.length > 0 ? (answered.reduce((s, q) => s + (q.score || 0), 0) / answered.length) : 3;
        const summary = 'Interview terminated due to browser tab switch. Please avoid switching tabs during timed assessments.';
        dispatch(completeInterview({ candidateId, finalScore: avg, summary }));
        dispatch(setIsInterviewActive(false));
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [candidateId, dispatch, interview]);

  // Timer logic
  useEffect(() => {
    console.log('Timer effect triggered:', {
      hasInterview: !!interview,
      isPaused: interview?.isPaused,
      isInterviewActive,
      hasCurrentQuestion: !!currentQuestion,
      hasAnswer: currentQuestion?.answer !== undefined,
      timeRemaining: currentQuestion?.timeRemaining
    });
    
    if (
      !interview ||
      interview.isPaused ||
      !isInterviewActive ||
      !currentQuestion ||
      currentQuestion.answer !== undefined
    ) {
      if (timerRef.current) {
        console.log('Clearing timer');
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Start timer
    console.log('Starting timer for question:', currentQuestion.text);
    timerRef.current = setInterval(() => {
      const timeRemaining = currentQuestion.timeRemaining - 1;
      console.log('Timer tick:', timeRemaining);
      
      dispatch(updateQuestion({
        candidateId,
        questionIndex: interview.currentQuestionIndex,
        updates: { timeRemaining }
      }));

      if (timeRemaining <= 0) {
        console.log('Time up!');
        handleTimeUp();
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        console.log('Cleanup timer');
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [interview, currentQuestion, candidateId, dispatch, isInterviewActive]);

  const handleSubmitAnswer = useCallback(async (answer: string, isTimeUp = false) => {
    if (!interview || !currentQuestion || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Score the answer
      const { score, feedback } = scoreAnswer(currentQuestion, answer);
      
      // Update question with answer and score
      dispatch(updateQuestion({
        candidateId,
        questionIndex: interview.currentQuestionIndex,
        updates: {
          answer,
          score,
          feedback,
          answeredAt: Date.now(),
          timeRemaining: 0
        }
      }));

      // Add user answer message
      if (answer && answer !== 'No answer provided (time expired)') {
        dispatch(addChatMessage({
          candidateId,
          message: {
            type: 'user',
            content: answer
          }
        }));
      }

      // Add score message
      dispatch(addChatMessage({
        candidateId,
        message: {
          type: 'score',
          content: `Your answer scored ${score}/10. ${feedback}`,
          metadata: { score, feedback }
        }
      }));

      setCurrentAnswer('');

      // Move to next question or complete interview
      if (interview.currentQuestionIndex < TOTAL_QUESTIONS - 1) {
        setTimeout(() => {
          dispatch(moveToNextQuestion(candidateId));
          
          const nextQuestion = interview.questions[interview.currentQuestionIndex + 1];
          if (nextQuestion) {
            // Reset timer for next question
            dispatch(updateQuestion({
              candidateId,
              questionIndex: interview.currentQuestionIndex + 1,
              updates: {
                startedAt: Date.now(),
                timeRemaining: nextQuestion.timeLimit
              }
            }));

            // Add next question message
            dispatch(addChatMessage({
              candidateId,
              message: {
                type: 'question',
                content: nextQuestion.text,
                questionId: nextQuestion.id,
                metadata: {
                  difficulty: nextQuestion.difficulty,
                  questionNumber: interview.currentQuestionIndex + 2
                }
              }
            }));
          }
        }, 2000);
      } else {
        // Complete interview
        setTimeout(() => {
          const totalScore = interview.questions.reduce((sum, q) => sum + (q.score || 0), 0) / TOTAL_QUESTIONS;
          const summary = generateFinalSummary(interview.questions, totalScore, candidate?.name || 'Candidate');
          
          dispatch(completeInterview({
            candidateId,
            finalScore: totalScore,
            summary
          }));

          dispatch(addChatMessage({
            candidateId,
            message: {
              type: 'system',
              content: `🎉 Interview completed! Your final score is ${totalScore.toFixed(1)}/10.\n\n${summary}`
            }
          }));

          dispatch(setIsInterviewActive(false));
        }, 2000);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [interview, currentQuestion, isSubmitting, candidateId, dispatch, candidate]);

  const handleTimeUp = useCallback(() => {
    if (!interview || !currentQuestion) return;
    
    const answer = currentAnswer.trim() || 'No answer provided (time expired)';
    handleSubmitAnswer(answer, true);
  }, [currentAnswer, interview, currentQuestion, handleSubmitAnswer]);

  const handlePauseResume = () => {
    if (!interview) return;
    
    if (interview.isPaused) {
      dispatch(resumeInterview(candidateId));
      dispatch(setIsInterviewActive(true));
      dispatch(addChatMessage({
        candidateId,
        message: {
          type: 'system',
          content: '▶️ Interview resumed. Timer continues...'
        }
      }));
    } else {
      dispatch(pauseInterview(candidateId));
      dispatch(setIsInterviewActive(false));
      dispatch(addChatMessage({
        candidateId,
        message: {
          type: 'system',
          content: '⏸️ Interview paused. Click resume when ready to continue.'
        }
      }));
    }
  };

  const canSubmit = currentAnswer.trim().length > 0 && !isSubmitting && currentQuestion && !currentQuestion.answer;
  const isInterviewCompleted = interview?.completedAt;
  const isPaused = interview?.isPaused;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Card size="small" style={{ marginBottom: 0, borderRadius: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 'bold' }}>{candidate?.name || 'Interview'}</span>
            {interview && (
              <Tag color="blue" style={{ marginLeft: 8 }}>
                {interview.currentQuestionIndex + 1} / {TOTAL_QUESTIONS}
              </Tag>
            )}
          </div>
          
          <Space>
            {interview && !isInterviewCompleted && (
              <Button
                type={isPaused ? 'primary' : 'default'}
                icon={isPaused ? <PlayCircleOutlined /> : <PauseOutlined />}
                onClick={handlePauseResume}
                size="small"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
            )}
            
            {currentQuestion && !currentQuestion.answer && !isPaused && (
              <Tag color={currentQuestion.timeRemaining <= 10 ? 'red' : 'blue'}>
                ⏱️ {Math.max(0, currentQuestion.timeRemaining)}s
              </Tag>
            )}
          </Space>
        </div>
        
        {interview && (
          <Progress
            percent={(interview.currentQuestionIndex / TOTAL_QUESTIONS) * 100}
            showInfo={false}
            size="small"
            style={{ marginTop: 8 }}
          />
        )}
      </Card>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          backgroundColor: '#fafafa',
        }}
      >
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isPaused && (
          <Alert
            message="Interview Paused"
            description="Click Resume to continue with the interview."
            type="warning"
            showIcon
            style={{ margin: '16px 0' }}
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isInterviewCompleted && currentQuestion && !currentQuestion.answer && (
        <Card size="small" style={{ marginTop: 0, borderRadius: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <TextArea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer here..."
              disabled={isPaused || isSubmitting}
              autoSize={{ minRows: 2, maxRows: 4 }}
              onPressEnter={(e) => {
                if (e.shiftKey) return; // Allow shift+enter for new line
                e.preventDefault();
                if (canSubmit) {
                  handleSubmitAnswer(currentAnswer.trim());
                }
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleSubmitAnswer(currentAnswer.trim())}
              disabled={!canSubmit || isPaused}
              loading={isSubmitting}
              style={{ alignSelf: 'flex-end' }}
            >
              Submit
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ChatInterface;
