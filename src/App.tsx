import React, { useEffect, useState } from 'react';
import { Layout, Tabs, ConfigProvider, Modal, theme as antdTheme } from 'antd';
import { UserOutlined, DashboardOutlined } from '@ant-design/icons';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { setCurrentView, setShowWelcomeBack, setEndModal } from './store/appSlice';
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
  
  const { currentView, currentCandidate, isInterviewActive, showWelcomeBack, showEndModal, endModalMessage } = useSelector((state: RootState) => state.app);
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
        algorithm: antdTheme.darkAlgorithm,
        token: {
          colorPrimary: '#3fa9ff',
          colorText: '#e6f4ff',
          fontFamily: "Inter, 'Segoe UI', Roboto, Arial, sans-serif",
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', background: '#0b0f14' }}>
        <Header style={{ 
          background: '#0f172a',
          borderBottom: '1px solid #1f2937',
          padding: '16px 24px',
          height: 96,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className="app-header-title" style={{ lineHeight: 1.2 }}>
              🎯 AI Interview Assistant
            </div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>
              Full-Stack Developer Interview Platform
            </div>
          </div>
        </Header>
        
        <Content style={{ padding: 0, background: '#0b0f14' }}>
          <Tabs
            activeKey={currentView}
            onChange={(key) => dispatch(setCurrentView(key as 'interviewee' | 'interviewer'))}
            style={{ height: 'calc(100vh - 96px)' }}
            tabBarStyle={{ 
              margin: 0, 
              padding: '0 24px',
              background: '#0f172a',
              borderBottom: '1px solid #1f2937'
            }}
          >
            <TabPane
              tab={
                <span>
                  <UserOutlined style={{ color: '#3fa9ff' }} />
                  <span style={{ marginLeft: 6 }}>Interviewee</span>
                </span>
              }
              key="interviewee"
            >
              <>
                {renderIntervieweeTab()}
                <footer style={{
                  textAlign: 'center',
                  padding: '16px 24px',
                  color: '#9ca3af',
                  borderTop: '1px solid #1f2937',
                  background: '#0f172a',
                  width: '100%',
                  marginTop: 24,
                  fontSize: 13
                }}>
                  Interviewee — Good luck! © {new Date().getFullYear()}
                </footer>
              </>
            </TabPane>
            
            <TabPane
              tab={
                <span>
                  <DashboardOutlined style={{ color: '#3fa9ff' }} />
                  <span style={{ marginLeft: 6 }}>Interviewer Dashboard</span>
                </span>
              }
              key="interviewer"
            >
              <div style={{ padding: '24px', background: '#0b0f14' }}>
                <CandidateList onSelectCandidate={handleSelectCandidate} />
              </div>
            </TabPane>
          </Tabs>
        </Content>
        
        <WelcomeBackModal />

        {/* Global End Modal (e.g., tab switch) */}
        <Modal
          title={<div style={{ fontWeight: 800 }}>Interview Ended</div>}
          open={!!showEndModal}
onOk={() => dispatch(setEndModal({ visible: false }))}
          onCancel={() => dispatch(setEndModal({ visible: false }))}
          maskClosable={false}
          okText="OK"
        >
          <div style={{ fontSize: 16 }}>
            <b>{endModalMessage || 'The interview has ended.'}</b>
          </div>
        </Modal>
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
