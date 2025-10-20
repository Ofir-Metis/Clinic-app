import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Simple interface for our database entities
interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  therapistId: number;
  createdAt: Date;
}

interface Appointment {
  id: number;
  patientId: number;
  datetime: Date;
  title: string;
  description?: string;
  status: string;
  meeting_type: string;
}

@Injectable()
export class PatientsService {
  constructor() {}

  async findAll(therapistId?: number) {
    // Return mock data matching our database structure
    return {
      status: 'success',
      data: [
        {
          id: 1,
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@email.com',
          phone: '+1-555-0101',
          therapistId: 3,
          preferences: { goals: ['stress management', 'work-life balance'] }
        },
        {
          id: 2,
          firstName: 'Michael',
          lastName: 'Chen',
          email: 'michael.chen@email.com',
          phone: '+1-555-0103',
          therapistId: 3,
          preferences: { goals: ['confidence building', 'depression recovery'] }
        },
        {
          id: 3,
          firstName: 'Emma',
          lastName: 'Rodriguez',
          email: 'emma.rodriguez@email.com',
          phone: '+1-555-0105',
          therapistId: 3,
          preferences: { goals: ['career transition', 'goal setting'] }
        },
        {
          id: 4,
          firstName: 'David',
          lastName: 'Williams',
          email: 'david.williams@email.com',
          phone: '+1-555-0107',
          therapistId: 3,
          preferences: { goals: ['relationship counseling', 'communication skills'] }
        },
        {
          id: 5,
          firstName: 'Lisa',
          lastName: 'Thompson',
          email: 'lisa.thompson@email.com',
          phone: '+1-555-0109',
          therapistId: 3,
          preferences: { goals: ['mindfulness', 'stress reduction'] }
        },
        {
          id: 6,
          firstName: 'James',
          lastName: 'Davis',
          email: 'james.davis@email.com',
          phone: '+1-555-0111',
          therapistId: 3,
          preferences: { goals: ['leadership development', 'confidence building'] }
        }
      ],
      total: 6
    };
  }

  async findOne(id: number) {
    const patients = await this.findAll();
    const patient = patients.data.find(p => p.id === id);
    return patient ? { status: 'success', data: patient } : { status: 'error', message: 'Patient not found' };
  }

  async findAppointments(patientId: number) {
    // Return appointments for this patient
    const allAppointments = [
      {
        id: 1,
        patientId: 1,
        clientName: 'Sarah Johnson',
        date: '2024-09-18',
        time: '16:00',
        status: 'confirmed',
        title: 'Relationship Dynamics',
        description: 'Focusing on communication skills and relationship improvement'
      },
      {
        id: 2,
        patientId: 5,
        clientName: 'Lisa Thompson',
        date: '2024-09-18',
        time: '18:30',
        status: 'scheduled',
        title: 'Mindfulness Practice',
        description: 'Guided meditation and stress reduction techniques'
      },
      {
        id: 3,
        patientId: 6,
        clientName: 'James Davis',
        date: '2024-09-20',
        time: '11:00',
        status: 'confirmed',
        title: 'Leadership Development',
        description: 'Advanced leadership techniques and team management'
      }
    ];

    const appointments = allAppointments.filter(apt => apt.patientId === patientId);
    return {
      status: 'success',
      data: appointments,
      total: appointments.length
    };
  }
}