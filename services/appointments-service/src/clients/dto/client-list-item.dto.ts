export class PatientListItemDto {
  id!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  avatarUrl?: string;
  upcomingAppointment?: string;
}
