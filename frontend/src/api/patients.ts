import axios from 'axios';

export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  upcomingAppointment?: string;
}

export interface PatientResponse {
  items: Patient[];
  total: number;
}

export const getMyPatients = async (
  therapistId: number,
  page = 0,
  limit = 10,
  search = ''
): Promise<PatientResponse> => {
  const { data } = await axios.get<PatientResponse>(
    `${process.env.THERAPIST_SERVICE_URL}/appointments-service/patients`,
    {
      params: { therapistId, page, limit, search },
    }
  );
  return data;
};
