import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export interface PatientAppointmentQuery {
  patientId: number;
  therapistId?: number;
  start?: string;
  end?: string;
  page?: number;
  limit?: number;
}

export const getPatientAppointments = async (params: PatientAppointmentQuery) => {
  const { data } = await api.get('/patient/appointments', { params });
  return data;
};

export const getPatientAppointment = async (id: number) => {
  const { data } = await api.get(`/patient/appointments/${id}`);
  return data;
};
