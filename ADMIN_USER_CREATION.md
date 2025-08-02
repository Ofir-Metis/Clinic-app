# 👨‍💼 Admin User Creation Guide

## 🚀 **Quick Start - Create Your First Admin User**

### **Method 1: Automated Script (Recommended)**
```bash
# Make script executable (if not already)
chmod +x scripts/create-admin.sh

# Run the script
./scripts/create-admin.sh

# Follow the prompts or provide parameters
./scripts/create-admin.sh admin@clinic-app.com your-secure-password
```

### **Method 2: API Endpoint**
```bash
curl -X POST http://localhost:4000/auth/create-admin \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: clinic-admin-secret-2024" \
  -d '{
    "email": "admin@clinic-app.com",
    "password": "your-secure-password",
    "firstName": "System",
    "lastName": "Administrator"
  }'
```

### **Method 3: Node.js Script**
```bash
node scripts/create-admin.js admin@clinic-app.com your-secure-password
```

### **Method 4: Direct SQL**
```bash
psql -d clinic -f scripts/seed-admin.sql
```

---

## 📝 **Available Methods**

### **1. 🔧 Automated Bash Script**
**File**: `scripts/create-admin.sh`

**Features**:
- ✅ Checks if admin already exists
- ✅ Tries API method first
- ✅ Falls back to SQL generation
- ✅ Interactive prompts for email/password
- ✅ Generates secure SQL if API fails

**Usage**:
```bash
# Interactive mode
./scripts/create-admin.sh

# With parameters
./scripts/create-admin.sh admin@example.com mypassword

# With environment variables
API_URL=http://localhost:4000 ADMIN_SECRET=my-secret ./scripts/create-admin.sh
```

---

### **2. 🌐 REST API Endpoint**
**Endpoint**: `POST /auth/create-admin`

**Headers**:
- `Content-Type: application/json`
- `X-Admin-Secret: clinic-admin-secret-2024`

**Request Body**:
```json
{
  "email": "admin@clinic-app.com",
  "password": "secure-password-123",
  "firstName": "System",
  "lastName": "Administrator"
}
```

**Response**:
```json
{
  "success": true,
  "userId": "admin_1234567890_abc123",
  "email": "admin@clinic-app.com",
  "message": "Admin user created successfully",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

**Security Features**:
- ✅ Requires admin secret header
- ✅ Prevents creation if admin already exists
- ✅ Returns JWT tokens for immediate login
- ✅ Logs creation for audit trail

---

### **3. 📜 Node.js Script**
**File**: `scripts/create-admin.js`

**Features**:
- ✅ Password hashing with bcrypt
- ✅ UUID generation for user IDs
- ✅ SQL generation for manual execution
- ✅ API fallback option
- ✅ Interactive password prompts

**Usage**:
```bash
# With parameters
node scripts/create-admin.js admin@example.com mypassword

# Interactive mode (prompts for password)
node scripts/create-admin.js admin@example.com

# Default email and password
node scripts/create-admin.js
```

---

### **4. 🗄️ Direct SQL Script**
**File**: `scripts/seed-admin.sql`

**Default Admin User**:
- **Email**: `admin@clinic-app.com`
- **Password**: `admin123`
- **Role**: `admin`
- **Status**: `active`

**Usage**:
```bash
# PostgreSQL
psql -d clinic -f scripts/seed-admin.sql

# With connection string
psql postgresql://user:pass@localhost:5432/clinic -f scripts/seed-admin.sql

# Docker PostgreSQL
docker exec -i postgres-container psql -U postgres -d clinic < scripts/seed-admin.sql
```

---

## 🔐 **Security Considerations**

### **Admin Secret Configuration**
Set a secure admin secret in your environment:
```bash
# .env file
ADMIN_SECRET=your-super-secure-secret-2024

# Environment variable
export ADMIN_SECRET="your-super-secure-secret-2024"
```

### **Password Requirements**
Admin passwords should meet these criteria:
- ✅ Minimum 8 characters
- ✅ At least one uppercase letter
- ✅ At least one lowercase letter  
- ✅ At least one number
- ✅ At least one special character

### **Production Security**
1. **Change Default Credentials**: Always change default admin credentials
2. **Disable Setup Endpoints**: Remove admin creation endpoints after initial setup
3. **Use Strong Secrets**: Use cryptographically secure admin secrets
4. **Enable 2FA**: Enable two-factor authentication for admin accounts
5. **Monitor Admin Activity**: Track all admin actions in audit logs

---

## 🎯 **Admin User Permissions**

### **Granted Permissions**
```javascript
[
  'admin:*',              // Full admin access
  'users:*',              // User management
  'system:*',             // System configuration
  'analytics:*',          // Analytics and reporting
  'maintenance:*',        // System maintenance
  'audit:*',              // Audit log access
  'clients:impersonate',  // View switching capability
  'appointments:*',       // Appointment management
  'notes:*',              // Notes management
  'files:*',              // File management
  'notifications:*',      // Notification management
  'recordings:*',         // Recording management
  'ai:*',                 // AI service access
  'settings:*',           // Settings management
]
```

### **Admin Capabilities**
- 🎛️ **System Administration**: Full system control and configuration
- 👥 **User Management**: Create, update, suspend, and delete users
- 📊 **Analytics Access**: View all system metrics and reports
- 🔧 **Maintenance Operations**: Execute system maintenance tasks
- 👁️ **Client View Switching**: Impersonate clients for support
- 📝 **Audit Trail Access**: View all system activity logs
- ⚙️ **Feature Flag Control**: Enable/disable system features
- 🔔 **Notification Management**: Configure system notifications

---

## 🚦 **Verification Steps**

### **1. Verify Admin Creation**
```bash
# Check via API
curl -X POST http://localhost:4000/auth/check-admin-exists \
  -H "X-Admin-Secret: clinic-admin-secret-2024"

# Check database directly
psql -d clinic -c "SELECT id, email, role, status FROM users WHERE role='admin';"
```

### **2. Test Admin Login**
```bash
# Login via API
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clinic-app.com",
    "password": "admin123"
  }'
```

### **3. Access Admin Dashboard**
1. Open browser to: `http://localhost:5173/admin`
2. Login with admin credentials
3. Verify dashboard loads with admin features

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **API Not Responding**
```bash
# Check if API Gateway is running
curl http://localhost:4000/health

# Check Docker containers
docker ps | grep api-gateway
```

#### **Database Connection Issues**
```bash
# Test database connection
psql -d clinic -c "SELECT NOW();"

# Check if tables exist
psql -d clinic -c "\dt"
```

#### **Permission Denied**
```bash
# Make scripts executable
chmod +x scripts/create-admin.sh
chmod +x scripts/create-admin.js

# Check admin secret
echo $ADMIN_SECRET
```

#### **Admin Already Exists**
```bash
# Use additional admin endpoint
curl -X POST http://localhost:4000/auth/create-additional-admin \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin2@clinic.com", "password": "secure123"}'
```

---

## 📞 **Support**

### **If Admin Creation Fails**
1. **Check API Gateway**: Ensure the API Gateway service is running
2. **Verify Database**: Confirm PostgreSQL is accessible and tables exist
3. **Check Logs**: Review application logs for error details
4. **Manual SQL**: Use the generated SQL file as a fallback
5. **Environment Variables**: Verify all required environment variables are set

### **Emergency Access**
If you're locked out, you can always:
1. Connect directly to the database
2. Execute the seed SQL script
3. Reset admin password via database

---

## ✅ **Quick Checklist**

- [ ] API Gateway running on port 4000
- [ ] PostgreSQL database accessible
- [ ] Environment variables configured
- [ ] Admin secret set securely
- [ ] Scripts are executable
- [ ] Dependencies installed (bcrypt, uuid)
- [ ] Database tables created
- [ ] Admin user created successfully
- [ ] Admin dashboard accessible
- [ ] Admin login working

---

**Your admin user is ready! 🎉**

**Default Login**: `admin@clinic-app.com` / `admin123`  
**Dashboard URL**: `http://localhost:5173/admin`

**⚠️ Remember to change the default password immediately!**