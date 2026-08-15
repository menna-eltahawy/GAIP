import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import api from '../api/axiosConfig';
import AddSensorForm from './AddSensorForm';

vi.mock('../api/axiosConfig', () => ({
  default: {
    post: vi.fn()
  }
}));

describe('AddSensorForm Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the form elements correctly', () => {
    render(<AddSensorForm />);
    
    expect(screen.getByText('PostGIS Sensor Deployment')).toBeInTheDocument();
    expect(screen.getByLabelText(/Node Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Latitude/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Longitude/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Deploy Node/i })).toBeInTheDocument();
  });

  it('syncs initial coordinates from props', () => {
    const coords = [30.932401, 30.565203]; 
    render(<AddSensorForm initialCoordinates={coords} />);

    expect(screen.getByPlaceholderText('e.g. 30.565203')).toHaveValue('30.565203');
    expect(screen.getByPlaceholderText('e.g. 30.932401')).toHaveValue('30.932401');
  });

  it('displays validation error if required fields are missing', async () => {
    render(<AddSensorForm />);
    
    const submitButton = screen.getByRole('button', { name: /Deploy Node/i });
    fireEvent.click(submitButton);

    const nameInput = screen.getByPlaceholderText('e.g. Delta-North-Sensor-01');
    fireEvent.change(nameInput, { target: { value: 'Delta Node 01' } });
    
    fireEvent.click(submitButton);
    expect(screen.getByText('Please fill in all required fields.')).toBeInTheDocument();
  });

  it('validates coordinate range limits', async () => {
    render(<AddSensorForm />);
    
    const nameInput = screen.getByPlaceholderText('e.g. Delta-North-Sensor-01');
    const latInput = screen.getByPlaceholderText('e.g. 30.565203');
    const lngInput = screen.getByPlaceholderText('e.g. 30.932401');
    const submitButton = screen.getByRole('button', { name: /Deploy Node/i });

    fireEvent.change(nameInput, { target: { value: 'Delta Node 01' } });
    
  
    fireEvent.change(latInput, { target: { value: '120.5' } });
    fireEvent.change(lngInput, { target: { value: '30.2' } });
    fireEvent.click(submitButton);
    expect(screen.getByText('Invalid latitude. Must be between -90 and 90.')).toBeInTheDocument();

  
    fireEvent.change(latInput, { target: { value: '30.5' } });
    fireEvent.change(lngInput, { target: { value: '-220.0' } });
    fireEvent.click(submitButton);
    expect(screen.getByText('Invalid longitude. Must be between -180 and 180.')).toBeInTheDocument();
  });

  it('submits successfully and calls onSensorAdded callback', async () => {
    const onSensorAddedMock = vi.fn();
    api.post.mockResolvedValueOnce({ data: { sensor_id: '123', name: 'Delta Node 01' } });

    render(<AddSensorForm onSensorAdded={onSensorAddedMock} />);
    
    fireEvent.change(screen.getByPlaceholderText('e.g. Delta-North-Sensor-01'), { target: { value: 'Delta Node 01' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. 30.565203'), { target: { value: '30.565203' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. 30.932401'), { target: { value: '30.932401' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Deploy Node/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
      expect(onSensorAddedMock).toHaveBeenCalledWith({ sensor_id: '123', name: 'Delta Node 01' });
      expect(screen.getByText('Sensor node registered successfully!')).toBeInTheDocument();
    });
  });
});
