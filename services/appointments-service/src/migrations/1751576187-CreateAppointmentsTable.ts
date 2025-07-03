import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAppointmentsTable1751576187 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'appointments',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'patientId', type: 'int', isNullable: false },
          { name: 'datetime', type: 'timestamptz', isNullable: false },
          { name: 'serviceType', type: 'varchar', isNullable: false },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
          { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );
    await queryRunner.createIndex('appointments', new TableIndex({ columnNames: ['patientId'] }));
    await queryRunner.createIndex('appointments', new TableIndex({ columnNames: ['datetime'] }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('appointments');
  }
}
