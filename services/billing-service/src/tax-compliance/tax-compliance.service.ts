import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TaxComplianceRecord, EntityType, ComplianceStatus } from '../entities/tax-compliance-record.entity';
import { firstValueFrom } from 'rxjs';
import Decimal from 'decimal.js';

interface CTCSubmissionRequest {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  vatAmount: number;
  customerType: 'individual' | 'business';
  businessId?: string;
  customerVatId?: string;
}

interface CTCResponse {
  success: boolean;
  allocationNumber?: string;
  error?: string;
  submissionId?: string;
}

interface VATCalculation {
  baseAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  exemptionReason?: string;
}

interface ComplianceReport {
  period: string;
  totalTransactions: number;
  totalVATCollected: number;
  totalRevenue: number;
  ctcSubmissions: number;
  complianceRate: number;
  nonCompliantItems: number;
}

@Injectable()
export class TaxComplianceService {
  private readonly logger = new Logger(TaxComplianceService.name);
  private readonly VAT_RATE = 0.18; // 18% VAT for Israel (2025)
  private readonly CTC_THRESHOLD_NIS = 20000; // Current CTC threshold (2025)
  private readonly ITA_BASE_URL: string;
  private readonly ITA_API_KEY: string;

  constructor(
    @InjectRepository(TaxComplianceRecord)
    private complianceRepository: Repository<TaxComplianceRecord>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.ITA_BASE_URL = this.configService.get<string>('ITA_API_URL') || 'https://shaam.gov.il/api/v1';
    this.ITA_API_KEY = this.configService.get<string>('ITA_API_KEY') || 'test-key';
  }

  /**
   * Calculate VAT for an amount with Israeli compliance
   */
  calculateVAT(baseAmount: number, customerType: 'individual' | 'business' | 'npo' = 'individual'): VATCalculation {
    const base = new Decimal(baseAmount);
    const rate = this.VAT_RATE;
    
    // Check for VAT exemptions
    let exemptionReason: string | undefined;
    let effectiveRate = rate;

    // NPOs (Non-Profit Organizations) may be exempt
    if (customerType === 'npo') {
      effectiveRate = 0;
      exemptionReason = 'Non-profit organization exemption';
    }

    const vatAmount = base.mul(effectiveRate);
    const totalAmount = base.plus(vatAmount);

    return {
      baseAmount: base.toNumber(),
      vatRate: effectiveRate,
      vatAmount: vatAmount.toNumber(),
      totalAmount: totalAmount.toNumber(),
      exemptionReason,
    };
  }

  /**
   * Check if CTC (Continuous Transaction Controls) is required
   */
  checkCTCRequirement(amount: number, customerType: 'individual' | 'business'): boolean {
    // CTC is only required for B2B transactions above threshold
    if (customerType !== 'business') {
      return false;
    }

    return new Decimal(amount).greaterThan(this.CTC_THRESHOLD_NIS);
  }

  /**
   * Submit invoice to Israeli Tax Authority for CTC clearance
   */
  async submitForCTCClearance(request: CTCSubmissionRequest): Promise<string> {
    this.logger.log(`Submitting CTC clearance for invoice ${request.invoiceNumber}`);

    try {
      // Prepare submission data for ITA SHAAM system
      const submissionData = {
        invoice_id: request.invoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        supplier_vat_id: this.configService.get<string>('COMPANY_VAT_ID'),
        customer_type: request.customerType,
        customer_vat_id: request.customerVatId,
        customer_business_id: request.businessId,
        gross_amount: request.amount,
        vat_amount: request.vatAmount,
        net_amount: request.amount - request.vatAmount,
        currency: 'ILS',
        software_id: this.configService.get<string>('ACCOUNTING_SOFTWARE_ID'),
        submission_timestamp: new Date().toISOString(),
      };

      // Submit to ITA (simulated for development)
      const response = await this.submitToITA(submissionData);

      if (response.success && response.allocationNumber) {
        this.logger.log(`CTC approval received: ${response.allocationNumber}`);
        return response.allocationNumber;
      } else {
        throw new Error(response.error || 'CTC submission failed');
      }
    } catch (error) {
      this.logger.error(`CTC submission failed for invoice ${request.invoiceNumber}:`, error);
      throw error;
    }
  }

  /**
   * Submit data to Israeli Tax Authority (ITA) SHAAM system
   */
  private async submitToITA(data: any): Promise<CTCResponse> {
    try {
      // In production, this would be a real API call to the ITA SHAAM system
      // For development/testing, we simulate the response
      
      if (this.configService.get<string>('NODE_ENV') === 'production') {
        const response = await firstValueFrom(
          this.httpService.post(`${this.ITA_BASE_URL}/ctc/submit`, data, {
            headers: {
              'Authorization': `Bearer ${this.ITA_API_KEY}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 seconds timeout
          })
        );

        return {
          success: response.data.success,
          allocationNumber: response.data.allocation_number,
          submissionId: response.data.submission_id,
          error: response.data.error,
        };
      } else {
        // Simulate successful response for development
        const allocationNumber = this.generateMockAllocationNumber();
        
        this.logger.log(`[SIMULATION] CTC submission successful: ${allocationNumber}`);
        
        return {
          success: true,
          allocationNumber,
          submissionId: `SIM-${Date.now()}`,
        };
      }
    } catch (error) {
      this.logger.error('ITA API call failed:', error);
      return {
        success: false,
        error: error.message || 'ITA API communication failed',
      };
    }
  }

  /**
   * Generate mock allocation number for development
   */
  private generateMockAllocationNumber(): string {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 1000000);
    return `AL-${year}-${String(randomNum).padStart(6, '0')}`;
  }

  /**
   * Create compliance record for tracking
   */
  async createComplianceRecord(data: {
    entityType: EntityType;
    entityId: string;
    requiresCTC: boolean;
    vatRate: number;
    vatAmount: number;
    allocationNumber?: string;
    exemptionReason?: string;
  }): Promise<TaxComplianceRecord> {
    const record = this.complianceRepository.create({
      entityType: data.entityType,
      entityId: data.entityId,
      requiresCTC: data.requiresCTC,
      ctcThresholdNis: this.CTC_THRESHOLD_NIS,
      allocationNumber: data.allocationNumber,
      vatRate: data.vatRate,
      vatAmountNis: data.vatAmount,
      vatExemptionReason: data.exemptionReason,
      complianceStatus: data.requiresCTC && !data.allocationNumber ? 'pending' : 'compliant',
      submissionTimestamp: data.allocationNumber ? new Date() : undefined,
    });

    return this.complianceRepository.save(record);
  }

  /**
   * Update compliance record with ITA response
   */
  async updateComplianceRecord(
    entityId: string,
    updates: {
      allocationNumber?: string;
      complianceStatus?: ComplianceStatus;
      itaResponse?: any;
      verificationNotes?: string;
    }
  ): Promise<void> {
    await this.complianceRepository.update(
      { entityId },
      {
        ...updates,
        lastVerificationDate: new Date(),
      }
    );
  }

  /**
   * Get compliance status for an entity
   */
  async getComplianceStatus(entityType: EntityType, entityId: string): Promise<TaxComplianceRecord | null> {
    return this.complianceRepository.findOne({
      where: { entityType, entityId },
    });
  }

  /**
   * Generate VAT report for period
   */
  async generateVATReport(startDate: Date, endDate: Date): Promise<any> {
    const records = await this.complianceRepository
      .createQueryBuilder('record')
      .where('record.createdAt >= :startDate', { startDate })
      .andWhere('record.createdAt <= :endDate', { endDate })
      .getMany();

    const totalVAT = records.reduce((sum, record) => sum + record.vatAmountNis, 0);
    const totalRevenue = records.reduce((sum, record) => {
      // Calculate revenue from VAT amount
      return sum + (record.vatAmountNis / record.vatRate);
    }, 0);

    const ctcSubmissions = records.filter(r => r.requiresCTC && r.allocationNumber).length;
    const requiredCTCSubmissions = records.filter(r => r.requiresCTC).length;

    return {
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      summary: {
        totalTransactions: records.length,
        totalVATCollected: totalVAT,
        totalRevenue: totalRevenue,
        ctcSubmissions,
        requiredCTCSubmissions,
        complianceRate: requiredCTCSubmissions > 0 ? (ctcSubmissions / requiredCTCSubmissions) * 100 : 100,
      },
      breakdown: {
        byEntityType: this.groupByEntityType(records),
        byMonth: this.groupByMonth(records, startDate, endDate),
      },
      nonCompliantItems: records.filter(r => r.complianceStatus === 'non_compliant'),
    };
  }

  /**
   * Group records by entity type
   */
  private groupByEntityType(records: TaxComplianceRecord[]): Record<string, any> {
    const groups: Record<string, any> = {};

    for (const record of records) {
      if (!groups[record.entityType]) {
        groups[record.entityType] = {
          count: 0,
          totalVAT: 0,
          ctcSubmissions: 0,
        };
      }

      groups[record.entityType].count++;
      groups[record.entityType].totalVAT += record.vatAmountNis;
      if (record.requiresCTC && record.allocationNumber) {
        groups[record.entityType].ctcSubmissions++;
      }
    }

    return groups;
  }

  /**
   * Group records by month
   */
  private groupByMonth(records: TaxComplianceRecord[], startDate: Date, endDate: Date): Record<string, any> {
    const groups: Record<string, any> = {};

    for (const record of records) {
      const month = record.createdAt.toISOString().substring(0, 7); // YYYY-MM
      
      if (!groups[month]) {
        groups[month] = {
          count: 0,
          totalVAT: 0,
          revenue: 0,
        };
      }

      groups[month].count++;
      groups[month].totalVAT += record.vatAmountNis;
      groups[month].revenue += record.vatAmountNis / record.vatRate;
    }

    return groups;
  }

  /**
   * Get compliance dashboard data
   */
  async getComplianceDashboard(): Promise<ComplianceReport> {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(1);
    lastMonth.setHours(0, 0, 0, 0);

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const records = await this.complianceRepository
      .createQueryBuilder('record')
      .where('record.createdAt >= :startDate', { startDate: lastMonth })
      .andWhere('record.createdAt < :endDate', { endDate: currentMonth })
      .getMany();

    const totalVAT = records.reduce((sum, record) => sum + record.vatAmountNis, 0);
    const totalRevenue = records.reduce((sum, record) => {
      return sum + (record.vatAmountNis / record.vatRate);
    }, 0);

    const ctcSubmissions = records.filter(r => r.requiresCTC && r.allocationNumber).length;
    const requiredCTC = records.filter(r => r.requiresCTC).length;
    const nonCompliant = records.filter(r => r.complianceStatus === 'non_compliant').length;

    return {
      period: lastMonth.toISOString().substring(0, 7),
      totalTransactions: records.length,
      totalVATCollected: totalVAT,
      totalRevenue: totalRevenue,
      ctcSubmissions,
      complianceRate: requiredCTC > 0 ? (ctcSubmissions / requiredCTC) * 100 : 100,
      nonCompliantItems: nonCompliant,
    };
  }

  /**
   * Verify compliance for all pending records
   */
  async verifyPendingCompliance(): Promise<void> {
    const pendingRecords = await this.complianceRepository.find({
      where: { complianceStatus: 'pending' },
    });

    this.logger.log(`Verifying ${pendingRecords.length} pending compliance records`);

    for (const record of pendingRecords) {
      try {
        if (record.requiresCTC && !record.allocationNumber) {
          // CTC required but no allocation number - mark as non-compliant
          record.complianceStatus = 'non_compliant';
          record.verificationNotes = 'CTC required but allocation number missing';
        } else {
          record.complianceStatus = 'compliant';
          record.verificationNotes = 'Compliance verified';
        }

        record.lastVerificationDate = new Date();
        await this.complianceRepository.save(record);
      } catch (error) {
        this.logger.error(`Failed to verify compliance for record ${record.id}:`, error);
      }
    }
  }
}