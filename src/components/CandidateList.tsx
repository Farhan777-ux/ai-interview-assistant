import React, { useState, useMemo } from 'react';
import { Table, Input, Button, Tag, Space, Modal, Card, Typography, message, Popconfirm } from 'antd';
import { SearchOutlined, EyeOutlined, DeleteOutlined, TrophyOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { deleteCandidate } from '../store/candidatesSlice';
import { setCurrentCandidate, setIsInterviewActive } from '../store/appSlice';
import { Candidate } from '../types';
import dayjs from 'dayjs';
import ChatMessage from './ChatMessage';

const { Search } = Input;
const { Text, Title } = Typography;

interface CandidateListProps {
  onSelectCandidate: (candidateId: string) => void;
}

const CandidateList: React.FC<CandidateListProps> = ({ onSelectCandidate }) => {
  const [searchText, setSearchText] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const dispatch = useDispatch();
  
  const { candidates, chatMessages } = useSelector((state: RootState) => state.candidates);
  
  const filteredCandidates = useMemo(() => {
    if (!searchText) return candidates;
    
    const searchLower = searchText.toLowerCase();
    return candidates.filter(candidate => 
      candidate.name.toLowerCase().includes(searchLower) ||
      candidate.email.toLowerCase().includes(searchLower) ||
      candidate.phone.includes(searchText)
    );
  }, [candidates, searchText]);
  
  const getStatusColor = (status: Candidate['status']) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'processing';
      case 'incomplete': return 'default';
      default: return 'default';
    }
  };
  
  const getScoreColor = (score?: number) => {
    if (!score) return '#666';
    if (score >= 8) return '#52c41a';
    if (score >= 6) return '#faad14';
    if (score >= 4) return '#fa8c16';
    return '#f5222d';
  };
  
  const handleViewDetails = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowDetailModal(true);
  };
  
  const handleDeleteCandidate = (candidateId: string) => {
    try {
      console.log('🗑️ Deleting candidate:', candidateId);
      // If viewing details for this candidate, close it first to avoid stale references
      if (selectedCandidate?.id === candidateId) {
        setShowDetailModal(false);
        setSelectedCandidate(null);
      }

      // Clear any active interview state
      dispatch(setIsInterviewActive(false));
      dispatch(setCurrentCandidate(undefined));

      // Dispatch deletion
      dispatch(deleteCandidate(candidateId));

      message.success('Candidate deleted');
    } catch (e) {
      console.error('Failed to delete candidate', e);
      message.error('Failed to delete candidate');
    }
  };
  
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Candidate, b: Candidate) => a.name.localeCompare(b.name),
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Completed', value: 'completed' },
        { text: 'In Progress', value: 'in-progress' },
        { text: 'Incomplete', value: 'incomplete' },
      ],
      onFilter: (value: any, record: Candidate) => record.status === value,
      render: (status: Candidate['status']) => (
        <Tag color={getStatusColor(status)}>
          {status === 'in-progress' ? 'In Progress' : 
           status === 'completed' ? 'Completed' : 'Incomplete'}
        </Tag>
      ),
    },
    {
      title: 'Score',
      dataIndex: 'finalScore',
      key: 'finalScore',
      sorter: (a: Candidate, b: Candidate) => (a.finalScore || 0) - (b.finalScore || 0),
      render: (score?: number) => (
        score !== undefined ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrophyOutlined style={{ color: getScoreColor(score) }} />
            <Text style={{ color: getScoreColor(score), fontWeight: 'bold' }}>
              {score.toFixed(1)}/10
            </Text>
          </div>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a: Candidate, b: Candidate) => a.createdAt - b.createdAt,
      render: (timestamp: number) => dayjs(timestamp).format('MMM DD, YYYY HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, candidate: Candidate) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(candidate)}
            size="small"
          >
            View
          </Button>
          <Popconfirm
            title="Delete Candidate"
            description="Are you sure you want to delete this candidate? This action cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            placement="left"
            onConfirm={() => handleDeleteCandidate(candidate.id)}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
              size="small"
              data-testid={`delete-${candidate.id}`}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>Interview Candidates</Title>
          <Search
            placeholder="Search by name, email, or phone"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
        </div>
        
        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {candidates.length}
              </div>
              <div style={{ color: '#666' }}>Total Candidates</div>
            </div>
          </Card>
          
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {candidates.filter(c => c.status === 'completed').length}
              </div>
              <div style={{ color: '#666' }}>Completed</div>
            </div>
          </Card>
          
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                {candidates.filter(c => c.status === 'in-progress').length}
              </div>
              <div style={{ color: '#666' }}>In Progress</div>
            </div>
          </Card>
          
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>
                {candidates.filter(c => c.finalScore && c.finalScore >= 7).length}
              </div>
              <div style={{ color: '#666' }}>High Performers</div>
            </div>
          </Card>
        </div>
      </div>
      
      <Table
        columns={columns}
        dataSource={filteredCandidates}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} candidates`,
        }}
        scroll={{ x: 'max-content' }}
      />
      
      {/* Candidate Detail Modal */}
      <Modal
        title={`${selectedCandidate?.name} - Interview Details`}
        open={showDetailModal}
        onCancel={() => setShowDetailModal(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        ]}
      >
        {selectedCandidate && (
          <div>
            {/* Candidate Info */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <Text type="secondary">Email:</Text>
                  <div>{selectedCandidate.email}</div>
                </div>
                <div>
                  <Text type="secondary">Phone:</Text>
                  <div>{selectedCandidate.phone}</div>
                </div>
                <div>
                  <Text type="secondary">Status:</Text>
                  <div>
                    <Tag color={getStatusColor(selectedCandidate.status)}>
                      {selectedCandidate.status === 'in-progress' ? 'In Progress' : 
                       selectedCandidate.status === 'completed' ? 'Completed' : 'Incomplete'}
                    </Tag>
                  </div>
                </div>
                {selectedCandidate.finalScore !== undefined && (
                  <div>
                    <Text type="secondary">Final Score:</Text>
                    <div style={{ color: getScoreColor(selectedCandidate.finalScore), fontWeight: 'bold' }}>
                      {selectedCandidate.finalScore.toFixed(1)}/10
                    </div>
                  </div>
                )}
              </div>
            </Card>
            
            {/* Interview Questions & Answers */}
            {selectedCandidate.interview?.questions && (
              <Card size="small" title="Interview Questions & Answers" style={{ marginBottom: 16 }}>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {selectedCandidate.interview.questions.map((question, index) => (
                    <div key={question.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: index < selectedCandidate.interview!.questions.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ flex: 1 }}>
                          <Tag color={question.difficulty === 'Easy' ? 'green' : question.difficulty === 'Medium' ? 'orange' : 'red'}>
                            {question.difficulty}
                          </Tag>
                          <Text strong>Q{index + 1}: {question.text}</Text>
                        </div>
                        {question.score !== undefined && (
                          <Tag color={question.score >= 7 ? 'success' : question.score >= 4 ? 'warning' : 'error'}>
                            {question.score}/10
                          </Tag>
                        )}
                      </div>
                      
                      {question.answer && (
                        <div style={{ marginLeft: 16, padding: 8, backgroundColor: '#f8f8f8', borderRadius: 4 }}>
                          <Text type="secondary">Answer:</Text>
                          <div style={{ marginTop: 4 }}>{question.answer}</div>
                          {question.feedback && (
                            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>Feedback:</Text> {question.feedback}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
            
            {/* AI Summary */}
            {selectedCandidate.finalSummary && (
              <Card size="small" title="AI Assessment Summary">
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {selectedCandidate.finalSummary}
                </pre>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default CandidateList;