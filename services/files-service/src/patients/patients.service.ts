import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patient.entity';
import { FileRecord } from './file-record.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient) private readonly repo: Repository<Patient>,
    @InjectRepository(FileRecord) private readonly files: Repository<FileRecord>,
  ) {}

  getDetail(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  filesForPatient(id: number) {
    return this.files.find({ where: { patientId: id } });
  }
}
