import React, { useEffect, useState } from 'react';
import { Layout, Tabs, ConfigProvider } from 'antd';
import { UserOutlined, DashboardOutlined } from '@ant-design/icons';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { setCurrentView, setShowWelcomeBack } from './store/appSlice';
import ResumeUpload from './components/ResumeUpload';
import InterviewCoordinator from './components/InterviewCoordinator';
import CandidateList from './components/CandidateList';
import WelcomeBackModal from './components/WelcomeBackModal';
import ErrorBoundary from './components/ErrorBoundary';
import { ExtractedData } from './utils/resumeProcessor';
import './App.css';

const { Content, Header } = Layout;
const { TabPane } = Tabs;

const AppContent: React.FC = () => {
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [checkedWelcomeBack, setCheckedWelcomeBack] = useState(false);
  const dispatch = useDispatch();
  
  const { currentView, currentCandidate, isInterviewActive, showWelcomeBack } = useSelector((state: RootState) => state.app);
  const { candidates } = useSelector((state: RootState) => state.candidates);
  
  // Show the Welcome Back modal once on initial load if there are unfinished interviews,
  // but do not show it while an interview is active or a candidate is already selected.
  useEffect(() => {
    if (checkedWelcomeBack) return;

    const unfinishedInterviews = candidates.filter(c => 
      c.status === 'in-progress' || 
      (c.status === 'incomplete' && c.interview)
    );

    if (
      unfinishedInterviews.length > 0 &&
      !isInterviewActive &&
      !currentCandidate &&
      !showWelcomeBack
    ) {
      dispatch(setShowWelcomeBack(true));
    }

    setCheckedWelcomeBack(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedWelcomeBack]);
  
  // Clear extracted data when candidate changes
  useEffect(() => {
    console.log('🔄 Current candidate changed:', currentCandidate);
    if (!currentCandidate) {
      setExtractedData(null);
    }
  }, [currentCandidate]);
  
  const handleUploadComplete = (candidateId: string, data: ExtractedData) => {
    console.log('📋 App handleUploadComplete called with:', { candidateId, data });
    setExtractedData(data);
  };
  
  const handleSelectCandidate = (candidateId: string) => {
    // Logic for viewing candidate details from interviewer dashboard
    console.log('Selected candidate:', candidateId);
  };
  
  const renderIntervieweeTab = () => {
    console.log('🎭 renderIntervieweeTab called:', { currentCandidate, extractedData });
    
    if (currentCandidate) {
      // Find the candidate to get their data
      const candidate = candidates.find(c => c.id === currentCandidate);
      console.log('🎭 Found candidate for rendering:', candidate);
      
      if (candidate) {
        // Use extracted data if available, otherwise create mock data from candidate
        const dataToUse = extractedData || {
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          text: candidate.resumeText || 'Resume text not available'
        };
        
        return (
          <InterviewCoordinator 
            candidateId={currentCandidate} 
            extractedData={dataToUse} 
          />
        );
      }
    }
    
    return (
      <div style={{ padding: '20px' }}>
        <ResumeUpload onUploadComplete={handleUploadComplete} />
      </div>
    );
  };
  
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          background: '#fff', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#1890ff'
          }}>
            🎯 AI Interview Assistant
          </div>
          
          <div style={{ fontSize: '14px', color: '#666' }}>
            Full-Stack Developer Interview Platform
          </div>
        </Header>
        
        <Content style={{ padding: 0 }}>
          <Tabs
            activeKey={currentView}
            onChange={(key) => dispatch(setCurrentView(key as 'interviewee' | 'interviewer'))}
            style={{ height: 'calc(100vh - 64px)' }}
            tabBarStyle={{ 
              margin: 0, 
              padding: '0 24px',
              background: '#fff',
              borderBottom: '1px solid #f0f0f0'
            }}
          >
            <TabPane
              tab={
                <span>
                  <UserOutlined />
                  Interviewee
                </span>
              }
              key="interviewee"
            >
              {renderIntervieweeTab()}
            </TabPane>
            
            <TabPane
              tab={
                <span>
                  <DashboardOutlined />
                  Interviewer Dashboard
                </span>
              }
              key="interviewer"
            >
              <div style={{ padding: '24px' }}>
                <CandidateList onSelectCandidate={handleSelectCandidate} />
              </div>
            </TabPane>
          </Tabs>
        </Content>
        
        <WelcomeBackModal />
      </Layout>
    </ConfigProvider>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <AppContent />
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
