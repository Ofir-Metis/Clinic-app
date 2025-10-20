import React from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  Avatar,
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  AutoAwesome as AIIcon,
  Assessment as AssessmentIcon,
  Notes as NotesIcon,
  TrendingUp as TrendingUpIcon,
  Insights as InsightsIcon,
} from '@mui/icons-material';
import { useTranslation } from '../contexts/LanguageContext';
import { theme } from '../theme';
import WellnessLayout from '../layouts/WellnessLayout';

const aiTools = [
  {
    id: 'session-notes',
    title: 'AI Session Notes',
    description: 'Generate comprehensive session summaries and treatment notes',
    icon: <NotesIcon />,
    color: '#2E7D6B',
    comingSoon: false,
  },
  {
    id: 'progress-analysis',
    title: 'Progress Analysis',
    description: 'AI-powered insights into client progress and treatment effectiveness',
    icon: <TrendingUpIcon />,
    color: '#8B5A87',
    comingSoon: false,
  },
  {
    id: 'treatment-recommendations',
    title: 'Treatment Recommendations',
    description: 'Evidence-based treatment suggestions tailored to client needs',
    icon: <PsychologyIcon />,
    color: '#4A9B8A',
    comingSoon: true,
  },
  {
    id: 'wellness-insights',
    title: 'Wellness Insights',
    description: 'Comprehensive analysis of client wellness patterns and trends',
    icon: <InsightsIcon />,
    color: '#7B9B7A',
    comingSoon: true,
  },
  {
    id: 'assessment-tools',
    title: 'Assessment Tools',
    description: 'AI-assisted psychological assessments and screening tools',
    icon: <AssessmentIcon />,
    color: '#A67B5B',
    comingSoon: true,
  },
  {
    id: 'ai-assistant',
    title: 'Therapy Assistant',
    description: 'Intelligent assistant for therapy session planning and management',
    icon: <AIIcon />,
    color: '#6B7AA0',
    comingSoon: true,
  },
];

const ToolsPage: React.FC = () => {
  const { t } = useTranslation();

  const handleToolClick = (toolId: string) => {
    // Navigate to specific tool or show coming soon message
    console.log('Tool clicked:', toolId);
  };

  return (
    <WellnessLayout
        title="AI Tools"
        showFab={false}
      >
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              mb: 1,
              background: 'linear-gradient(135deg, #2E7D6B 0%, #4A9B8A 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            🧠 AI-Powered Tools
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Enhance your practice with intelligent tools designed for mental health professionals
          </Typography>
        </Box>

        {/* AI Tools Grid */}
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {aiTools.map((tool) => (
            <Grid item xs={12} sm={6} lg={4} key={tool.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 28px ${tool.color}20`,
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: `linear-gradient(90deg, ${tool.color}, ${tool.color}80)`,
                  },
                }}
                onClick={() => handleToolClick(tool.id)}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: `${tool.color}15`,
                        color: tool.color,
                        width: 56,
                        height: 56,
                        mr: 2,
                      }}
                    >
                      {tool.icon}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {tool.title}
                      </Typography>
                      {tool.comingSoon && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'warning.main',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          Coming Soon
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 3,
                      flex: 1,
                      lineHeight: 1.6,
                    }}
                  >
                    {tool.description}
                  </Typography>
                  
                  <Button
                    variant={tool.comingSoon ? 'outlined' : 'contained'}
                    fullWidth
                    disabled={tool.comingSoon}
                    sx={{
                      mt: 'auto',
                      ...(tool.comingSoon && {
                        borderColor: `${tool.color}40`,
                        color: `${tool.color}60`,
                      }),
                      ...(!tool.comingSoon && {
                        background: `linear-gradient(135deg, ${tool.color}, ${tool.color}CC)`,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${tool.color}DD, ${tool.color}AA)`,
                        },
                      }),
                    }}
                  >
                    {tool.comingSoon ? 'Notify Me' : 'Launch Tool'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Additional Info Section */}
        <Box sx={{ 
          mt: 6, 
          p: 4, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(46, 125, 107, 0.08), rgba(139, 90, 135, 0.08))',
          border: '1px solid rgba(46, 125, 107, 0.12)',
          textAlign: 'center',
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            🌟 Powered by Advanced AI
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Our AI tools are designed specifically for mental health professionals, 
            trained on evidence-based practices and ethical guidelines to support 
            your clinical decision-making while maintaining the highest standards of patient care.
          </Typography>
        </Box>
      </WellnessLayout>
  );
};

export default ToolsPage;
