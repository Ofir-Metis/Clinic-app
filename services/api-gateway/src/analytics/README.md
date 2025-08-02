# Analytics Dashboard for Recording Insights

This module provides comprehensive analytics and insights for coaching sessions, recordings, client progress, and business metrics.

## Features

### 📊 **Core Analytics**
- **Session Metrics**: Volume, duration, ratings, engagement scores
- **Recording Analytics**: Storage usage, transcription accuracy, processing costs
- **Client Progress**: Individual journey tracking, goal completion, mood progression
- **Coach Performance**: Effectiveness metrics, client satisfaction, retention rates
- **Program Analytics**: Enrollment, completion rates, module performance
- **Business Intelligence**: Revenue, growth, retention, efficiency metrics

### 📈 **Advanced Insights**
- **Trend Analysis**: Historical patterns and forecasting
- **Comparative Analysis**: Side-by-side comparisons of coaches, programs, periods
- **Predictive Analytics**: Client success probability, churn risk prediction
- **Real-time Monitoring**: Live session tracking, system health, alerts
- **AI-Powered Insights**: Pattern recognition, recommendation engine

### 📋 **Reporting & Export**
- **Dashboard Views**: Executive, coach, client-specific dashboards
- **Custom Reports**: Flexible filtering and data visualization
- **Export Options**: CSV, Excel, PDF formats with charts
- **Automated Reports**: Scheduled delivery of key metrics
- **Data Visualization**: Interactive charts and graphs

## API Endpoints

### Main Dashboard

#### `GET /api/analytics/dashboard`
Get comprehensive analytics dashboard with key insights and trends.

**Query Parameters:**
- `startDate` - Filter start date (ISO string)
- `endDate` - Filter end date (ISO string) 
- `coachId` - Filter by specific coach

**Response:**
```json
{
  "status": "success",
  "dashboard": {
    "overview": {
      "totalClients": 187,
      "activeClients": 142,
      "totalSessions": 1247,
      "averageClientProgress": 76.4,
      "clientSatisfactionScore": 4.7
    },
    "trends": {
      "clientGrowth": [
        { "month": "Jan", "clients": 134 },
        { "month": "Feb", "clients": 141 }
      ],
      "sessionVolume": [...],
      "engagementScores": [...],
      "goalCompletionRates": [...]
    },
    "topInsights": [
      {
        "type": "success",
        "title": "Strong Client Retention",
        "description": "Client retention rate improved to 87.3%",
        "impact": "high",
        "actionItems": ["Continue retention strategies", "Share best practices"]
      }
    ],
    "recommendations": [
      {
        "category": "growth",
        "priority": "high", 
        "title": "Expand Stress Management Offerings",
        "expectedImpact": "25% increase in program revenue"
      }
    ]
  }
}
```

### Session Analytics

#### `GET /api/analytics/sessions`
Get detailed session analytics and metrics.

**Query Parameters:**
- `startDate`, `endDate` - Date range filter
- `coachId`, `clientId`, `programId` - Entity filters

**Response:**
```json
{
  "status": "success",
  "metrics": {
    "totalSessions": 1247,
    "completedSessions": 1189,
    "averageDuration": 52.3,
    "averageRating": 4.7,
    "engagementScore": 8.2
  },
  "insights": [
    "Excellent session quality with high client satisfaction",
    "Strong client engagement levels across sessions"
  ]
}
```

### Recording Analytics

#### `GET /api/analytics/recordings`
Get recording and AI processing analytics.

**Response:**
```json
{
  "status": "success",
  "metrics": {
    "totalRecordings": 1189,
    "totalStorageUsed": 49093671936,
    "averageTranscriptionAccuracy": 96.3,
    "processingSuccessRate": 98.7,
    "costAnalysis": {
      "storage": 23.45,
      "transcription": 156.78,
      "aiProcessing": 234.67,
      "total": 414.90
    }
  },
  "insights": [
    "High transcription accuracy ensures reliable analysis",
    "Excellent AI processing reliability"
  ],
  "recommendations": [
    "Consider file compression to optimize storage costs"
  ]
}
```

### Client Progress Analytics

#### `GET /api/analytics/clients/:clientId/progress`
Get detailed client progress and journey analytics.

**Response:**
```json
{
  "status": "success",
  "progress": {
    "clientId": "client_123",
    "clientName": "John Smith",
    "totalSessions": 12,
    "progressTrend": "improving",
    "goalCompletionRate": 78.5,
    "engagementLevel": "high",
    "keyMetrics": {
      "moodProgression": [
        { "date": "2024-01-01", "mood": 5, "session": "session_1" },
        { "date": "2024-01-08", "mood": 6, "session": "session_2" }
      ],
      "goalProgress": [
        { "goal": "Reduce stress", "progress": 85, "target": "2024-03-01" }
      ],
      "sessionRatings": [...],
      "actionItemCompletion": [...]
    },
    "insights": {
      "strengths": ["High motivation", "Consistent attendance"],
      "challenges": ["Time management", "Boundary setting"],
      "recommendations": ["Continue mindfulness practice"]
    }
  },
  "predictions": {
    "goalCompletion": {
      "probability": 0.85,
      "timeframe": "2-3 weeks",
      "confidence": "high"
    },
    "successProbability": 0.82
  }
}
```

### Coach Performance Analytics

#### `GET /api/analytics/coaches/:coachId/performance`
Get comprehensive coach performance metrics (Coach can only view own data, Admin sees all).

**Response:**
```json
{
  "status": "success",
  "performance": {
    "coachId": "coach_123",
    "coachName": "Sarah Johnson",
    "totalClients": 24,
    "activeClients": 18,
    "averageSessionRating": 4.8,
    "clientRetentionRate": 89.3,
    "performance": {
      "effectiveness": 8.7,
      "communication": 9.2,
      "goalAchievement": 8.1,
      "clientSatisfaction": 8.9
    },
    "trends": {
      "sessionVolume": [...],
      "clientRatings": [...],
      "goalCompletionRates": [...]
    }
  },
  "benchmarks": {
    "industry": {
      "averageRating": 4.3,
      "clientRetention": 78.5
    },
    "platform": {
      "averageRating": 4.6,
      "clientRetention": 84.2
    }
  },
  "strengths": ["Exceptional communication skills", "Outstanding client satisfaction"],
  "improvementAreas": ["Goal achievement methodologies"]
}
```

### Program Analytics

#### `GET /api/analytics/programs`
Get program performance and outcome analytics.

**Response:**
```json
{
  "status": "success",
  "programs": [
    {
      "programId": "life-balance-mastery",
      "programName": "Life Balance Mastery",
      "totalEnrollments": 156,
      "completionRate": 78.5,
      "averageRating": 4.8,
      "revenueGenerated": 187200,
      "modulePerformance": [
        {
          "moduleId": "module_1",
          "moduleName": "Foundation: Understanding Life Balance",
          "completionRate": 95.2,
          "engagementScore": 8.7
        }
      ],
      "outcomeMetrics": {
        "goalAchievementRate": 82.4,
        "clientSatisfactionScore": 4.7
      }
    }
  ],
  "summary": {
    "totalPrograms": 3,
    "totalEnrollments": 546,
    "averageCompletionRate": 80.1,
    "totalRevenue": 487650
  }
}
```

### Business Metrics (Admin Only)

#### `GET /api/analytics/business`
Get comprehensive business intelligence and KPIs.

**Response:**
```json
{
  "status": "success",
  "metrics": {
    "revenue": {
      "total": 487650,
      "monthly": [
        { "month": "Jan", "amount": 67890 },
        { "month": "Feb", "amount": 72340 }
      ],
      "byProgram": [...],
      "byCoach": [...]
    },
    "growth": {
      "clientAcquisition": [...],
      "sessionVolume": [...],
      "revenueGrowth": [...]
    },
    "retention": {
      "clientRetentionRate": 87.3,
      "churnRate": 12.7,
      "reasonsForChurn": [
        { "reason": "Achieved goals", "percentage": 35.2 },
        { "reason": "Financial constraints", "percentage": 23.1 }
      ]
    }
  },
  "kpis": {
    "customerLifetimeValue": 1847.00,
    "customerAcquisitionCost": 145.00,
    "churnRate": 12.7
  },
  "forecasts": {
    "nextMonthRevenue": 105000,
    "clientGrowthRate": 15.2
  }
}
```

### Comparative Analysis

#### `POST /api/analytics/compare`
Generate side-by-side comparisons of coaches, programs, or time periods.

**Request:**
```json
{
  "type": "coaches",
  "entities": ["coach_1", "coach_2", "coach_3"],
  "metrics": ["sessionRating", "clientRetention", "goalCompletion"],
  "timeframe": {
    "startDate": "2024-01-01",
    "endDate": "2024-06-30"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "analysis": {
    "comparisonType": "coaches",
    "results": [
      {
        "entity": "coach_1",
        "metrics": {
          "sessionRating": 4.8,
          "clientRetention": 89.3,
          "goalCompletion": 82.1
        }
      }
    ],
    "insights": [
      "Top performer shows 23% higher client satisfaction",
      "Completion rates vary by delivery method"
    ],
    "recommendations": [
      "Implement best practices from top performers"
    ]
  }
}
```

### Data Export

#### `POST /api/analytics/export`
Export analytics data in various formats.

**Request:**
```json
{
  "type": "sessions",
  "format": "excel",
  "filters": {
    "startDate": "2024-01-01",
    "endDate": "2024-06-30"
  },
  "includeCharts": true
}
```

**Response:**
```json
{
  "status": "success",
  "export": {
    "downloadUrl": "/exports/sessions_analytics_1234567890.excel",
    "fileName": "sessions_analytics_1234567890.excel",
    "fileSize": 245760,
    "generatedAt": "2024-06-15T10:30:00Z"
  }
}
```

### Real-time Analytics

#### `GET /api/analytics/realtime`
Get live system status and recent activity.

**Response:**
```json
{
  "status": "success",
  "realtime": {
    "activeSessions": 12,
    "recordingsInProgress": 5,
    "aiProcessingJobs": 3,
    "onlineCoaches": 8,
    "systemHealth": {
      "status": "healthy",
      "uptime": "99.97%",
      "responseTime": 145
    },
    "recentActivity": [
      {
        "type": "session_started",
        "coach": "Sarah J.",
        "client": "John D.",
        "time": "2024-06-15T10:25:00Z"
      }
    ]
  }
}
```

## Usage Examples

### 1. Dashboard Integration

```javascript
// Get main dashboard data
async function loadDashboard(dateRange) {
  const params = new URLSearchParams({
    startDate: dateRange.start,
    endDate: dateRange.end
  });
  
  const response = await fetch(`/api/analytics/dashboard?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  return data.dashboard;
}

// Display insights
function displayInsights(insights) {
  insights.forEach(insight => {
    console.log(`${insight.type}: ${insight.title}`);
    console.log(`Impact: ${insight.impact}`);
    console.log(`Actions: ${insight.actionItems.join(', ')}`);
  });
}
```

### 2. Client Progress Tracking

```javascript
async function trackClientProgress(clientId) {
  const response = await fetch(`/api/analytics/clients/${clientId}/progress`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  const progress = data.progress;
  
  // Display mood progression chart
  const moodData = progress.keyMetrics.moodProgression;
  renderChart('mood-chart', moodData);
  
  // Show predictions
  const predictions = data.predictions;
  console.log(`Success probability: ${predictions.successProbability * 100}%`);
}
```

### 3. Coach Performance Dashboard

```javascript
async function loadCoachPerformance(coachId) {
  const response = await fetch(`/api/analytics/coaches/${coachId}/performance`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  const performance = data.performance;
  
  // Display performance metrics
  console.log(`Rating: ${performance.averageSessionRating}/5`);
  console.log(`Retention: ${performance.clientRetentionRate}%`);
  
  // Show benchmarks
  const benchmarks = data.benchmarks;
  console.log(`vs Industry: +${(performance.averageSessionRating - benchmarks.industry.averageRating).toFixed(1)}`);
}
```

### 4. Comparative Analysis

```javascript
async function compareCoaches(coachIds, metrics) {
  const response = await fetch('/api/analytics/compare', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'coaches',
      entities: coachIds,
      metrics: metrics
    })
  });
  
  const data = await response.json();
  return data.analysis;
}
```

### 5. Export Analytics Data

```javascript
async function exportSessionData(format, filters) {
  const response = await fetch('/api/analytics/export', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'sessions',
      format: format,
      filters: filters,
      includeCharts: true
    })
  });
  
  const data = await response.json();
  
  // Download the exported file
  window.open(data.export.downloadUrl, '_blank');
}
```

## Permissions & Security

### Required Permissions
- `analytics:read` - View analytics dashboards and reports
- `analytics:compare` - Generate comparative analysis
- `analytics:export` - Export analytics data
- `analytics:realtime` - Access real-time monitoring

### Role-Based Access
- **Admin**: Full access to all analytics including business metrics
- **Coach**: Access to own performance data and assigned clients
- **Client**: Limited access to own progress data (if enabled)

### Data Privacy
- All client data is anonymized in aggregate reports
- Individual client data requires explicit permission
- Sensitive business metrics restricted to admin users
- Audit logs track all analytics access

## Visualization & Charts

### Supported Chart Types
- **Line Charts**: Trends over time (sessions, revenue, ratings)
- **Bar Charts**: Comparisons (coaches, programs, metrics)
- **Pie Charts**: Distributions (churn reasons, program enrollment)
- **Scatter Plots**: Correlations (engagement vs outcomes)
- **Heat Maps**: Performance matrices
- **Gauge Charts**: KPI indicators

### Chart Configuration
```javascript
const chartConfig = {
  type: 'line',
  data: sessionVolumeData,
  options: {
    responsive: true,
    scales: {
      y: { beginAtZero: true },
      x: { type: 'time' }
    },
    plugins: {
      title: { display: true, text: 'Session Volume Trend' },
      legend: { position: 'top' }
    }
  }
};
```

## Performance & Optimization

### Caching Strategy
- Dashboard data cached for 15 minutes
- Real-time data refreshed every 30 seconds
- Historical reports cached for 1 hour
- Export files cached for 24 hours

### Query Optimization
- Efficient database indexes on date and entity columns
- Aggregated data tables for faster reporting
- Async processing for complex analytics
- Pagination for large datasets

### Monitoring
- Track query performance and slow operations
- Monitor memory usage for large reports
- Set up alerts for system resource usage
- Log analytics access patterns

## Troubleshooting

### Common Issues

1. **Slow Dashboard Loading**
   - Check date range (limit to reasonable periods)
   - Verify database indexes
   - Consider data aggregation

2. **Export Timeouts**
   - Reduce data scope with filters
   - Use async processing for large exports
   - Implement progress indicators

3. **Inconsistent Data**
   - Verify data synchronization across services
   - Check for timezone issues
   - Validate calculation logic

### Debug Mode
```env
ANALYTICS_DEBUG=true
CACHE_DISABLED=true
LOG_LEVEL=debug
```

### Performance Monitoring
```javascript
// Monitor analytics performance
const startTime = Date.now();
const result = await analyticsService.getDashboard();
const processingTime = Date.now() - startTime;

console.log(`Dashboard loaded in ${processingTime}ms`);
```