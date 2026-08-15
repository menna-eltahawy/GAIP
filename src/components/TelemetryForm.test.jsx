import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import api from '../api/axiosConfig';
import TelemetryForm from './TelemetryForm';

// Mock our custom API instead of axios directly
vi.mock('../api/axiosConfig', () => ({
  default: {
    post: vi.fn()
  }
}));

describe('TelemetryForm Component', () => {
  const mockSensors = [
    { id: 'sensor-01', name: 'Delta Node A', location: [30.93, 30.56] },
    { id: 'sensor-02', name: 'Delta Node B', location: [30.95, 30.58] }
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the telemetry controls correctly', () => {
    render(<TelemetryForm sensors={mockSensors} />);
    
    expect(screen.getByText('Sensor Telemetry Controls')).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Sensor Node/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Soil Moisture/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Soil Temperature/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Soil pH Level/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Broadcast Telemetry/i })).toBeInTheDocument();
  });

  it('displays critical warning if soil moisture is below 20%', () => {
    render(<TelemetryForm sensors={mockSensors} />);
    
    const moistureInput = screen.getByPlaceholderText('e.g. 35');
    fireEvent.change(moistureInput, { target: { value: '15' } });
    
    expect(screen.getByText('⚠️ Critical Moisture Bounds')).toBeInTheDocument();
  });

  it('submits manual telemetry values successfully', async () => {
    const onTelemetryMock = vi.fn();
    api.post.mockResolvedValueOnce({ data: { success: true } });

    render(
      <TelemetryForm 
        sensors={mockSensors} 
        selectedSensorId="sensor-01" 
        onTelemetrySubmitted={onTelemetryMock} 
      />
    );

    fireEvent.change(screen.getByPlaceholderText('e.g. 35'), { target: { value: '25' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. 24.5'), { target: { value: '28.5' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. 7.2'), { target: { value: '6.8' } });

    fireEvent.click(screen.getByRole('button', { name: /Broadcast Telemetry/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining('/sensor/reading'),
        {
          sensor_id: 'sensor-01',
          soil_moisture: 25,
          soil_ph: 6.8,
          temperature: 28.5
        },
        expect.any(Object)
      );
      expect(onTelemetryMock).toHaveBeenCalled();
      expect(screen.getByText('Telemetry injection broadcasted successfully!')).toBeInTheDocument();
    });
  });
});