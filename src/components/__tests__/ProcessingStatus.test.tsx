import { render, screen } from '@testing-library/react';
import { ProcessingStatus } from '../ProcessingStatus';

// Mock the useProcessingStatus hook
jest.mock('@/hooks/useProcessingStatus', () => ({
  useProcessingStatus: jest.fn(() => ({
    status: {
      stage: 'validation',
      progress: 0,
      message: 'Ready to start processing'
    },
    isProcessing: false,
    result: {},
    startProcessing: jest.fn(),
    cancelProcessing: jest.fn(),
    resetProcessing: jest.fn(),
    getOverallProgress: jest.fn(() => 0)
  }))
}));

describe('ProcessingStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with initial state', () => {
    render(<ProcessingStatus />);
    
    expect(screen.getByText('Processing Video')).toBeInTheDocument();
    expect(screen.getByText('Converting your YouTube video into a structured blog article')).toBeInTheDocument();
    expect(screen.getByText('Overall Progress')).toBeInTheDocument();
  });

  it('displays all processing stages', () => {
    render(<ProcessingStatus />);
    
    expect(screen.getByText('Validation')).toBeInTheDocument();
    expect(screen.getByText('Metadata')).toBeInTheDocument();
    expect(screen.getByText('Transcription')).toBeInTheDocument();
    expect(screen.getByText('Analysis')).toBeInTheDocument();
    expect(screen.getByText('Generation')).toBeInTheDocument();
  });
});