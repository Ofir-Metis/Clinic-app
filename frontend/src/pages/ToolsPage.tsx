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

const ToolsPage: React.FC = () => {
  const { translations: t } = useTranslation();

  const aiTools = [
    {
      id: 'session-notes',
      title: t.toolsPage.sessionNotes.title,
      description: t.toolsPage.sessionNotes.description,
      icon: <NotesIcon />,
      color: '#2E7D6B',
      comingSoon: false,
    },
    {
      id: 'progress-analysis',
      title: t.toolsPage.progressAnalysis.title,
      description: t.toolsPage.progressAnalysis.description,
      icon: <TrendingUpIcon />,
      color: '#8B5A87',
      comingSoon: false,
    },
    {
      id: 'treatment-recommendations',
      title: t.toolsPage.treatmentRecs.title,
      description: t.toolsPage.treatmentRecs.description,
      icon: <PsychologyIcon />,
      color: '#4A9B8A',
      comingSoon: true,
    },
    {
      id: 'wellness-insights',
      title: t.toolsPage.wellnessInsights.title,
      description: t.toolsPage.wellnessInsights.description,
      icon: <InsightsIcon />,
      color: '#7B9B7A',
      comingSoon: true,
    },
    {
      id: 'assessment-tools',
      title: t.toolsPage.assessmentTools.title,
      description: t.toolsPage.assessmentTools.description,
      icon: <AssessmentIcon />,
      color: '#A67B5B',
      comingSoon: true,
    },
    {
      id: 'ai-assistant',
      title: t.toolsPage.therapyAssistant.title,
      description: t.toolsPage.therapyAssistant.description,
      icon: <AIIcon />,
      color: '#6B7AA0',
      comingSoon: true,
    },
  ];

  const handleToolClick = (toolId: string) => {
    // Navigate to specific tool or show coming soon message
    console.log('Tool clicked:', toolId);
  };

  return (
    <WellnessLayout
        title={t.nav.tools}
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
            {t.toolsPage.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t.toolsPage.subtitle}
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
                          {t.toolsPage.comingSoon}
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
                    {tool.comingSoon ? t.toolsPage.notifyMe : t.toolsPage.launchTool}
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
            {t.toolsPage.poweredByAI}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            {t.toolsPage.aiDescription}
          </Typography>
        </Box>
      </WellnessLayout>
  );
};

export default ToolsPage;
