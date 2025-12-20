import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCoachProfileTable1751737140 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'coach_profile',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'userId', type: 'int' },
          { name: 'name', type: 'varchar' },
          { name: 'title', type: 'varchar' },
          { name: 'bio', type: 'text' },
          { name: 'services', type: 'jsonb', default: "'[]'" },
          { name: 'media', type: 'jsonb', default: "'[]'" },
          { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('coach_profile');
  }
}
