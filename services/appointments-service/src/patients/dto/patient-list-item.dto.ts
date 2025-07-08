export class PatientListItemDto {
  id!: number;
  firstName!: string;
  lastName!: string;
  email!: string;
  avatarUrl?: string;
  upcomingAppointment?: string;
}
