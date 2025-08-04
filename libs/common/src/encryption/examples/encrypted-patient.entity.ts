import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { EncryptField, EncryptEntity, EncryptedEntity } from '../database-encryption.decorator';

/**
 * Example encrypted patient entity demonstrating healthcare data encryption
 */
@Entity('patients')
@EncryptEntity({
  keyRotationDays: 30, // Healthcare compliance: rotate keys monthly
  compressionEnabled: true,
  auditEnabled: true,
  customMetadata: {
    dataClassification: 'PHI',
    complianceFramework: 'HIPAA',
    retentionPeriod: '7_years'
  }
})
export class EncryptedPatientEntity extends EncryptedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Basic patient information - encrypted
  @Column()
  @EncryptField({
    dataType: 'patient_name',
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
    dataType: 'ssn',
    compressionEnabled: false, // Don't compress SSN
    customMetadata: { 
      fieldType: 'sensitive_identifier',
      encryptionStrength: 'maximum'
    }
  })
  socialSecurityNumber: string;

  @Column()
  @EncryptField({
    dataType: 'address',
    searchable: false, // Full address not searchable for privacy
    customMetadata: { fieldType: 'pii' }
  })
  address: string;

  // Medical information - highly sensitive
  @Column('text')
  @EncryptField({
    dataType: 'medical_history',
    compressionEnabled: true, // Medical text can be long
    customMetadata: { 
      fieldType: 'phi',
      sensitivityLevel: 'high'
    }
  })
  medicalHistory: string;

  @Column('text')
  @EncryptField({
    dataType: 'current_medications',
    compressionEnabled: true,
    customMetadata: { 
      fieldType: 'phi',
      sensitivityLevel: 'high'
    }
  })
  currentMedications: string;

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

  // Insurance information - financial PHI
  @Column()
  @EncryptField({
    dataType: 'insurance_id',
    compressionEnabled: false,
    customMetadata: { 
      fieldType: 'financial_phi',
      sensitivityLevel: 'high'
    }
  })
  insuranceId: string;

  @Column()
  @EncryptField({
    dataType: 'insurance_provider',
    searchable: true,
    customMetadata: { fieldType: 'financial_phi' }
  })
  insuranceProvider: string;

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

  @Column({ nullable: true })
  insuranceProvider_hash: string;

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

  // Example: search by patient name
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

  // Method to get decrypted summary (for logging/audit without sensitive data)
  getAuditSummary(): any {
    return {
      id: this.id,
      hasName: !!this.fullName,
      hasEmail: !!this.email,
      hasPhone: !!this.phoneNumber,
      hasMedicalHistory: !!this.medicalHistory,
      hasInsurance: !!this.insuranceId,
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
        'patient_data',
        'export_phi',
        'success',
        {
          patientId: this.id,
          requestedBy: context.requestedBy,
          purpose: context.purpose,
          consentId: context.consentId,
          fieldsExported: [
            'fullName', 'email', 'phoneNumber', 'address',
            'medicalHistory', 'currentMedications',
            'emergencyContactName', 'emergencyContactPhone',
            'insuranceId', 'insuranceProvider'
          ]
        },
        {
          userId: context.requestedBy,
          service: 'patient-data-export',
          hipaaRelevant: true,
          patientId: this.id
        }
      );
    }

    return {
      // Demographic information
      personalInfo: {
        fullName: this.fullName,
        email: this.email,
        phoneNumber: this.phoneNumber,
        address: this.address,
        dateOfBirth: this.dateOfBirth,
        gender: this.gender
      },
      
      // Medical information
      medicalInfo: {
        medicalHistory: this.medicalHistory,
        currentMedications: this.currentMedications
      },
      
      // Emergency contacts
      emergencyContact: {
        name: this.emergencyContactName,
        phone: this.emergencyContactPhone
      },
      
      // Insurance information
      insurance: {
        id: this.insuranceId,
        provider: this.insuranceProvider
      },
      
      // Metadata
      metadata: {
        patientId: this.id,
        exportedAt: new Date(),
        exportedBy: context.requestedBy,
        purpose: context.purpose,
        consentId: context.consentId
      }
    };
  }
}