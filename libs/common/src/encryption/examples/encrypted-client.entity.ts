import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { EncryptField, EncryptEntity, EncryptedEntity } from '../database-encryption.decorator';

/**
 * Example encrypted client entity demonstrating data encryption for coaching platform
 * This example shows how to properly encrypt sensitive client information
 */
@Entity('clients')
@EncryptEntity({
  keyRotationDays: 30, // Rotate encryption keys monthly
  compressionEnabled: true,
  auditEnabled: true,
  customMetadata: {
    dataClassification: 'PII',
    complianceFramework: 'GDPR',
    retentionPeriod: '7_years'
  }
})
export class EncryptedClientEntity extends EncryptedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Basic client information - encrypted
  @Column()
  @EncryptField({
    dataType: 'client_name',
    required: true,
    searchable: true, // Creates hash for searching
    customMetadata: { fieldType: 'pii' }
  })
  fullName: string;

  @Column()
  @EncryptField({
    dataType: 'email',
    required: true,
    searchable: true,
    customMetadata: { fieldType: 'contact_info' }
  })
  email: string;

  @Column()
  @EncryptField({
    dataType: 'phone_number',
    searchable: true,
    customMetadata: { fieldType: 'contact_info' }
  })
  phoneNumber: string;

  @Column()
  @EncryptField({
    dataType: 'address',
    searchable: false,
    customMetadata: { fieldType: 'pii' }
  })
  address: string;

  // Coaching-specific information - encrypted
  @Column('text')
  @EncryptField({
    dataType: 'coaching_goals',
    compressionEnabled: true,
    customMetadata: {
      fieldType: 'coaching_data',
      sensitivityLevel: 'medium'
    }
  })
  coachingGoals: string;

  @Column('text')
  @EncryptField({
    dataType: 'session_notes',
    compressionEnabled: true,
    customMetadata: {
      fieldType: 'coaching_data',
      sensitivityLevel: 'high'
    }
  })
  sessionNotes: string;

  @Column()
  @EncryptField({
    dataType: 'emergency_contact',
    searchable: true,
    customMetadata: { fieldType: 'contact_info' }
  })
  emergencyContactName: string;

  @Column()
  @EncryptField({
    dataType: 'emergency_phone',
    searchable: true,
    customMetadata: { fieldType: 'contact_info' }
  })
  emergencyContactPhone: string;

  // Search hashes (automatically created by @EncryptField with searchable: true)
  @Column({ nullable: true })
  fullName_hash: string;

  @Column({ nullable: true })
  email_hash: string;

  @Column({ nullable: true })
  phoneNumber_hash: string;

  @Column({ nullable: true })
  emergencyContactName_hash: string;

  @Column({ nullable: true })
  emergencyContactPhone_hash: string;

  // Non-encrypted fields
  @Column()
  dateOfBirth: Date;

  @Column({
    type: 'enum',
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  })
  gender: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods for searching by encrypted fields
  static createSearchQuery(field: string, value: string): any {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(value.toLowerCase()).digest('hex');

    return {
      [`${field}_hash`]: hash
    };
  }

  // Example: search by client name
  static findByName(name: string) {
    return this.createSearchQuery('fullName', name);
  }

  // Example: search by email
  static findByEmail(email: string) {
    return this.createSearchQuery('email', email);
  }

  // Example: search by phone
  static findByPhone(phone: string) {
    return this.createSearchQuery('phoneNumber', phone);
  }

  // Method to get summary without sensitive data (for logging/audit)
  getAuditSummary(): any {
    return {
      id: this.id,
      hasName: !!this.fullName,
      hasEmail: !!this.email,
      hasPhone: !!this.phoneNumber,
      hasCoachingGoals: !!this.coachingGoals,
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Method to export data (with proper consent and audit logging)
  async exportData(context: {
    requestedBy: string;
    purpose: string;
    consentId: string;
    auditService?: any;
  }): Promise<any> {
    // Log data export request
    if (context.auditService) {
      await context.auditService.logAuditEvent(
        'data_export',
        'client_data',
        'export_pii',
        'success',
        {
          clientId: this.id,
          requestedBy: context.requestedBy,
          purpose: context.purpose,
          consentId: context.consentId,
          fieldsExported: [
            'fullName', 'email', 'phoneNumber', 'address',
            'coachingGoals', 'sessionNotes',
            'emergencyContactName', 'emergencyContactPhone'
          ]
        },
        {
          userId: context.requestedBy,
          service: 'client-data-export',
          clientId: this.id
        }
      );
    }

    return {
      // Personal information
      personalInfo: {
        fullName: this.fullName,
        email: this.email,
        phoneNumber: this.phoneNumber,
        address: this.address,
        dateOfBirth: this.dateOfBirth,
        gender: this.gender
      },

      // Coaching information
      coachingInfo: {
        goals: this.coachingGoals,
        notes: this.sessionNotes
      },

      // Emergency contacts
      emergencyContact: {
        name: this.emergencyContactName,
        phone: this.emergencyContactPhone
      },

      // Metadata
      metadata: {
        clientId: this.id,
        exportedAt: new Date(),
        exportedBy: context.requestedBy,
        purpose: context.purpose,
        consentId: context.consentId
      }
    };
  }
}
