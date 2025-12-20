import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { FileRecord } from './file-record.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client) private readonly repo: Repository<Client>,
    @InjectRepository(FileRecord) private readonly files: Repository<FileRecord>,
  ) {}

  getDetail(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  filesForPatient(id: number) {
    return this.files.find({ where: { patientId: id } });
  }
}
