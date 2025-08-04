import { TherapistData, ClientData, AdminData } from './test-data-manager';

export interface UserCredentials {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'therapist' | 'client';
  id?: string;
  additionalData?: any;
}

export class UserCredentials {
  private adminCredentials: AdminData | null = null;
  private therapistCredentials: TherapistData[] = [];
  private clientCredentials: ClientData[] = [];

  /**
   * Sets admin credentials
   */
  setAdminCredentials(email: string, password: string): void {
    this.adminCredentials = {
      email,
      password,
      role: 'super_admin'
    };
  }

  /**
   * Sets therapist credentials
   */
  setTherapistCredentials(therapists: TherapistData[]): void {
    this.therapistCredentials = therapists;
  }

  /**
   * Sets client credentials
   */
  setClientCredentials(clients: ClientData[]): void {
    this.clientCredentials = clients;
  }

  /**
   * Gets admin credentials
   */
  getAdminCredentials(): UserCredentials {
    if (!this.adminCredentials) {
      throw new Error('Admin credentials not set');
    }
    
    return {
      email: this.adminCredentials.email,
      password: this.adminCredentials.password,
      name: 'Admin User',
      role: 'admin',
      id: this.adminCredentials.id,
      additionalData: this.adminCredentials
    };
  }

  /**
   * Gets a random therapist
   */
  getRandomTherapist(): UserCredentials {
    if (this.therapistCredentials.length === 0) {
      throw new Error('No therapist credentials available');
    }
    
    const therapist = this.therapistCredentials[
      Math.floor(Math.random() * this.therapistCredentials.length)
    ];
    
    return {
      email: therapist.email,
      password: therapist.password,
      name: therapist.name,
      role: 'therapist',
      id: therapist.id,
      additionalData: therapist
    };
  }

  /**
   * Gets a random client
   */
  getRandomClient(): UserCredentials {
    if (this.clientCredentials.length === 0) {
      throw new Error('No client credentials available');
    }
    
    const client = this.clientCredentials[
      Math.floor(Math.random() * this.clientCredentials.length)
    ];
    
    return {
      email: client.email,
      password: client.password,
      name: client.name,
      role: 'client',
      id: client.id,
      additionalData: client
    };
  }

  /**
   * Gets a specific therapist by email
   */
  getTherapistByEmail(email: string): UserCredentials {
    const therapist = this.therapistCredentials.find(t => t.email === email);
    if (!therapist) {
      throw new Error(`Therapist with email ${email} not found`);
    }
    
    return {
      email: therapist.email,
      password: therapist.password,
      name: therapist.name,
      role: 'therapist',
      id: therapist.id,
      additionalData: therapist
    };
  }

  /**
   * Gets a specific client by email
   */
  getClientByEmail(email: string): UserCredentials {
    const client = this.clientCredentials.find(c => c.email === email);
    if (!client) {
      throw new Error(`Client with email ${email} not found`);
    }
    
    return {
      email: client.email,
      password: client.password,
      name: client.name,
      role: 'client',
      id: client.id,
      additionalData: client
    };
  }

  /**
   * Gets a random client for a specific therapist
   */
  getRandomClientForTherapist(therapistEmail: string): UserCredentials {
    const clientsForTherapist = this.clientCredentials.filter(
      client => client.therapistEmails.includes(therapistEmail)
    );
    
    if (clientsForTherapist.length === 0) {
      throw new Error(`No clients found for therapist ${therapistEmail}`);
    }
    
    const client = clientsForTherapist[
      Math.floor(Math.random() * clientsForTherapist.length)
    ];
    
    return {
      email: client.email,
      password: client.password,
      name: client.name,
      role: 'client',
      id: client.id,
      additionalData: client
    };
  }

  /**
   * Gets all clients for a specific therapist
   */
  getClientsForTherapist(therapistEmail: string): UserCredentials[] {
    return this.clientCredentials
      .filter(client => client.therapistEmails.includes(therapistEmail))
      .map(client => ({
        email: client.email,
        password: client.password,
        name: client.name,
        role: 'client' as const,
        id: client.id,
        additionalData: client
      }));
  }

  /**
   * Gets shared clients (clients with multiple therapists)
   */
  getSharedClients(): UserCredentials[] {
    return this.clientCredentials
      .filter(client => client.therapistEmails.length > 1)
      .map(client => ({
        email: client.email,
        password: client.password,
        name: client.name,
        role: 'client' as const,
        id: client.id,
        additionalData: client
      }));
  }

  /**
   * Gets all therapist credentials
   */
  getAllTherapists(): UserCredentials[] {
    return this.therapistCredentials.map(therapist => ({
      email: therapist.email,
      password: therapist.password,
      name: therapist.name,
      role: 'therapist' as const,
      id: therapist.id,
      additionalData: therapist
    }));
  }

  /**
   * Gets all client credentials
   */
  getAllClients(): UserCredentials[] {
    return this.clientCredentials.map(client => ({
      email: client.email,
      password: client.password,
      name: client.name,
      role: 'client' as const,
      id: client.id,
      additionalData: client
    }));
  }

  /**
   * Gets new client credentials for testing registration
   */
  getNewClientCredentials(): UserCredentials {
    const timestamp = Date.now();
    return {
      email: `newclient_${timestamp}@clinic-test.com`,
      password: `newClient${timestamp}Pass123!`,
      name: `New Client ${timestamp}`,
      role: 'client'
    };
  }

  /**
   * Gets new therapist credentials for testing registration
   */
  getNewTherapistCredentials(): UserCredentials {
    const timestamp = Date.now();
    return {
      email: `newtherapist_${timestamp}@clinic-test.com`,
      password: `newTherapist${timestamp}Pass123!`,
      name: `New Therapist ${timestamp}`,
      role: 'therapist'
    };
  }

  /**
   * Gets all credentials in a structured format for reporting
   */
  getAllCredentials(): any {
    return {
      admin: this.adminCredentials ? {
        email: this.adminCredentials.email,
        password: this.adminCredentials.password,
        role: this.adminCredentials.role
      } : null,
      therapists: this.therapistCredentials.map(t => ({
        email: t.email,
        password: t.password,
        name: t.name,
        specializations: t.specializations,
        experience: t.experience
      })),
      clients: this.clientCredentials.map(c => ({
        email: c.email,
        password: c.password,
        name: c.name,
        age: c.age,
        therapists: c.therapistEmails,
        goals: c.goals,
        subscriptionTier: c.subscriptionTier
      })),
      statistics: {
        totalUsers: 1 + this.therapistCredentials.length + this.clientCredentials.length,
        adminCount: this.adminCredentials ? 1 : 0,
        therapistCount: this.therapistCredentials.length,
        clientCount: this.clientCredentials.length,
        sharedClientCount: this.clientCredentials.filter(c => c.therapistEmails.length > 1).length,
        averageClientsPerTherapist: this.therapistCredentials.length > 0 
          ? (this.clientCredentials.length / this.therapistCredentials.length).toFixed(2)
          : 0
      }
    };
  }

  /**
   * Generates a comprehensive credentials report
   */
  generateCredentialsReport(): string {
    const allCreds = this.getAllCredentials();
    
    let report = `
# 🏥 Clinic Management System - Test Credentials Report
Generated: ${new Date().toISOString()}

## 📊 Test Data Summary
- **Total Users**: ${allCreds.statistics.totalUsers}
- **Therapists**: ${allCreds.statistics.therapistCount}
- **Clients**: ${allCreds.statistics.clientCount}
- **Shared Clients**: ${allCreds.statistics.sharedClientCount}
- **Average Clients per Therapist**: ${allCreds.statistics.averageClientsPerTherapist}

## 👑 Admin Account
- **Email**: ${allCreds.admin?.email || 'Not set'}
- **Password**: ${allCreds.admin?.password || 'Not set'}
- **Role**: ${allCreds.admin?.role || 'Not set'}

## 👨‍⚕️ Therapist Accounts (${allCreds.therapists.length})
`;

    allCreds.therapists.forEach((therapist: any, index: number) => {
      report += `
### Therapist ${index + 1}
- **Name**: ${therapist.name}
- **Email**: ${therapist.email}
- **Password**: ${therapist.password}
- **Specializations**: ${therapist.specializations.join(', ')}
- **Experience**: ${therapist.experience} years
`;
    });

    report += `
## 👤 Client Accounts (${allCreds.clients.length})
`;

    allCreds.clients.forEach((client: any, index: number) => {
      report += `
### Client ${index + 1}
- **Name**: ${client.name}
- **Email**: ${client.email}
- **Password**: ${client.password}
- **Age**: ${client.age}
- **Therapists**: ${client.therapists.join(', ')}
- **Goals**: ${client.goals.join(', ')}
- **Subscription**: ${client.subscriptionTier}
`;
    });

    return report;
  }

  /**
   * Saves credentials to file
   */
  saveCredentialsToFile(filename: string = 'test-credentials.json'): void {
    const fs = require('fs');
    const path = require('path');
    
    // Ensure test-results directory exists
    const resultsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const filepath = path.join(resultsDir, filename);
    const credentials = this.getAllCredentials();
    
    fs.writeFileSync(filepath, JSON.stringify(credentials, null, 2));
    console.log(`📄 Credentials saved to: ${filepath}`);
    
    // Also save human-readable report
    const reportPath = path.join(resultsDir, 'credentials-report.md');
    fs.writeFileSync(reportPath, this.generateCredentialsReport());
    console.log(`📄 Credentials report saved to: ${reportPath}`);
  }

  /**
   * Gets credentials by role
   */
  getCredentialsByRole(role: 'admin' | 'therapist' | 'client'): UserCredentials[] {
    switch (role) {
      case 'admin':
        return this.adminCredentials ? [this.getAdminCredentials()] : [];
      case 'therapist':
        return this.getAllTherapists();
      case 'client':
        return this.getAllClients();
      default:
        return [];
    }
  }

  /**
   * Gets user statistics
   */
  getUserStatistics(): any {
    return {
      total: 1 + this.therapistCredentials.length + this.clientCredentials.length,
      admin: this.adminCredentials ? 1 : 0,
      therapists: this.therapistCredentials.length,
      clients: this.clientCredentials.length,
      sharedClients: this.clientCredentials.filter(c => c.therapistEmails.length > 1).length,
      averageClientsPerTherapist: this.therapistCredentials.length > 0 
        ? this.clientCredentials.length / this.therapistCredentials.length 
        : 0,
      languages: [...new Set(this.therapistCredentials.flatMap(t => t.languages))],
      subscriptionTiers: [...new Set(this.clientCredentials.map(c => c.subscriptionTier))]
    };
  }
}