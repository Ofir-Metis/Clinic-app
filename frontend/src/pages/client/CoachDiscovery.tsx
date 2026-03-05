/**
 * CoachDiscovery - System for clients to discover and connect with new coaches
 * Advanced filtering, coach profiles, and connection requests
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Stack,
  Chip,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Rating,
  Badge,
  Tooltip,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  Psychology as SpecializationIcon,
  School as EducationIcon,
  WorkHistory as ExperienceIcon,
  Language as LanguageIcon,
  VideoCall as OnlineIcon,
  LocationOn as InPersonIcon,
  Phone as PhoneIcon,
  AttachMoney as PriceIcon,
  Send as SendIcon,
  Close as CloseIcon,
  CheckCircle as VerifiedIcon,
  TrendingUp as PopularIcon,
  FiberNew as NewIcon,
  Favorite as FavoriteIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import { useTranslation } from '../../contexts/LanguageContext';

interface Coach {
  id: string;
  firstName: string;
  lastName: string;
  professionalTitle: string;
  bio: string;
  profileImageUrl?: string;
  specializations: string[];
  yearsOfExperience: number;
  location: string;
  timezone: string;
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  acceptingNewClients: boolean;
  sessionTypes: {
    online: boolean;
    inPerson: boolean;
    phone: boolean;
  };
  sessionDurations: number[];
  pricingStructure: {
    currency: string;
    sessionRates: {
      individual: number;
      package: number;
    };
  };
  availability: {
    timezone: string;
    nextAvailable: Date;
  };
  coachingMethods: string[];
  targetDemographics: {
    ageRanges: string[];
    professions: string[];
  };
  languages: string[];
  credentials: Array<{
    name: string;
    issuingOrganization: string;
    isVerified: boolean;
  }>;
}

interface CoachFilters {
  search: string;
  specializations: string[];
  location: string;
  sessionTypes: string[];
  priceRange: [number, number];
  rating: number;
  experience: string;
  languages: string[];
  availability: string;
  verified: boolean;
}

const SPECIALIZATION_OPTIONS = [
  'Life Coaching',
  'Career Coaching', 
  'Executive Coaching',
  'Health & Wellness',
  'Relationship Coaching',
  'Financial Coaching',
  'Mindfulness & Meditation',
  'Leadership Development',
  'Personal Development',
  'Stress Management',
  'Goal Achievement',
  'Life Transitions'
];

const LANGUAGE_OPTIONS = [
  'English',
  'Spanish', 
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Mandarin',
  'Arabic',
  'Hebrew',
  'Russian'
];

const CoachDiscovery: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [filteredCoaches, setFilteredCoaches] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  
  const [filters, setFilters] = useState<CoachFilters>({
    search: '',
    specializations: [],
    location: '',
    sessionTypes: [],
    priceRange: [0, 500],
    rating: 0,
    experience: '',
    languages: [],
    availability: '',
    verified: false
  });

  const tabLabels = ['All Coaches', 'Top Rated', 'New Coaches', 'Available Now'];

  useEffect(() => {
    loadCoaches();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [coaches, filters, currentTab]);

  const loadCoaches = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - replace with actual API call
      const mockCoaches: Coach[] = [
        {
          id: '1',
          firstName: 'Dr. Sarah',
          lastName: 'Johnson',
          professionalTitle: 'Certified Life & Wellness Coach',
          bio: 'Passionate about helping individuals unlock their potential and create meaningful, fulfilling lives. With over 8 years of experience in personal development coaching, I specialize in mindfulness-based approaches to goal achievement and life transformation.',
          specializations: ['Life Coaching', 'Mindfulness & Meditation', 'Stress Management'],
          yearsOfExperience: 8,
          location: 'San Francisco, CA',
          timezone: 'PST',
          averageRating: 4.9,
          totalReviews: 127,
          isVerified: true,
          acceptingNewClients: true,
          sessionTypes: { online: true, inPerson: true, phone: false },
          sessionDurations: [45, 60, 90],
          pricingStructure: {
            currency: 'USD',
            sessionRates: { individual: 150, package: 135 }
          },
          availability: {
            timezone: 'PST',
            nextAvailable: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
          },
          coachingMethods: ['CBT', 'Mindfulness', 'Solution-Focused'],
          targetDemographics: {
            ageRanges: ['25-35', '35-45', '45-55'],
            professions: ['Tech Professionals', 'Entrepreneurs', 'Healthcare Workers']
          },
          languages: ['English', 'Spanish'],
          credentials: [
            { name: 'ICF ACC Certification', issuingOrganization: 'International Coach Federation', isVerified: true },
            { name: 'Mindfulness-Based Coaching', issuingOrganization: 'Mindful Schools', isVerified: true }
          ]
        },
        {
          id: '2',
          firstName: 'Marcus',
          lastName: 'Rodriguez',
          professionalTitle: 'Executive & Career Coach',
          bio: 'Former Fortune 500 executive turned coach, specializing in leadership development and career transitions. I help professionals navigate complex career decisions and develop executive presence.',
          specializations: ['Career Coaching', 'Executive Coaching', 'Leadership Development'],
          yearsOfExperience: 12,
          location: 'New York, NY',
          timezone: 'EST',
          averageRating: 4.8,
          totalReviews: 89,
          isVerified: true,
          acceptingNewClients: true,
          sessionTypes: { online: true, inPerson: true, phone: true },
          sessionDurations: [60, 90, 120],
          pricingStructure: {
            currency: 'USD',
            sessionRates: { individual: 200, package: 180 }
          },
          availability: {
            timezone: 'EST',
            nextAvailable: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
          },
          coachingMethods: ['Executive Coaching', '360 Feedback', 'Leadership Assessment'],
          targetDemographics: {
            ageRanges: ['30-40', '40-50', '50+'],
            professions: ['Executives', 'Managers', 'Consultants']
          },
          languages: ['English', 'Spanish'],
          credentials: [
            { name: 'ICF PCC Certification', issuingOrganization: 'International Coach Federation', isVerified: true },
            { name: 'Executive MBA', issuingOrganization: 'Wharton School', isVerified: true }
          ]
        },
        {
          id: '3',
          firstName: 'Dr. Aisha',
          lastName: 'Patel',
          professionalTitle: 'Wellness & Mindfulness Coach',
          bio: 'Certified wellness coach and mindfulness instructor with expertise in stress management and mental wellness. I combine evidence-based coaching approaches with ancient mindfulness practices.',
          specializations: ['Health & Wellness', 'Mindfulness & Meditation', 'Stress Management'],
          yearsOfExperience: 6,
          location: 'Austin, TX',
          timezone: 'CST',
          averageRating: 4.9,
          totalReviews: 156,
          isVerified: true,
          acceptingNewClients: true,
          sessionTypes: { online: true, inPerson: false, phone: true },
          sessionDurations: [45, 60, 75],
          pricingStructure: {
            currency: 'USD',
            sessionRates: { individual: 120, package: 110 }
          },
          availability: {
            timezone: 'CST',
            nextAvailable: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          },
          coachingMethods: ['Mindfulness-Based Stress Reduction', 'CBT', 'Somatic Therapy'],
          targetDemographics: {
            ageRanges: ['20-30', '30-40', '40-50'],
            professions: ['Healthcare Workers', 'Teachers', 'Students']
          },
          languages: ['English', 'Hindi'],
          credentials: [
            { name: 'Licensed Clinical Social Worker', issuingOrganization: 'Texas State Board', isVerified: true },
            { name: 'MBSR Teacher Training', issuingOrganization: 'UMASS Medical School', isVerified: true }
          ]
        }
      ];

      setCoaches(mockCoaches);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load coaches:', error);
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...coaches];

    // Tab-specific filtering
    switch (currentTab) {
      case 1: // Top Rated
        filtered = filtered.filter(coach => coach.averageRating >= 4.5);
        filtered.sort((a, b) => b.averageRating - a.averageRating);
        break;
      case 2: // New Coaches
        filtered = filtered.filter(coach => coach.yearsOfExperience <= 3);
        break;
      case 3: // Available Now
        const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(coach => coach.availability.nextAvailable <= threeDaysFromNow);
        break;
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(coach =>
        coach.firstName.toLowerCase().includes(searchLower) ||
        coach.lastName.toLowerCase().includes(searchLower) ||
        coach.professionalTitle.toLowerCase().includes(searchLower) ||
        coach.bio.toLowerCase().includes(searchLower) ||
        coach.specializations.some(spec => spec.toLowerCase().includes(searchLower))
      );
    }

    // Specialization filter
    if (filters.specializations.length > 0) {
      filtered = filtered.filter(coach =>
        filters.specializations.some(spec => coach.specializations.includes(spec))
      );
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(coach =>
        coach.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Session type filter
    if (filters.sessionTypes.length > 0) {
      filtered = filtered.filter(coach =>
        filters.sessionTypes.some(type => {
          switch (type) {
            case 'online': return coach.sessionTypes.online;
            case 'in-person': return coach.sessionTypes.inPerson;
            case 'phone': return coach.sessionTypes.phone;
            default: return false;
          }
        })
      );
    }

    // Price range filter
    filtered = filtered.filter(coach =>
      coach.pricingStructure.sessionRates.individual >= filters.priceRange[0] &&
      coach.pricingStructure.sessionRates.individual <= filters.priceRange[1]
    );

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(coach => coach.averageRating >= filters.rating);
    }

    // Experience filter
    if (filters.experience) {
      filtered = filtered.filter(coach => {
        switch (filters.experience) {
          case 'entry': return coach.yearsOfExperience <= 3;
          case 'intermediate': return coach.yearsOfExperience > 3 && coach.yearsOfExperience <= 7;
          case 'senior': return coach.yearsOfExperience > 7 && coach.yearsOfExperience <= 12;
          case 'expert': return coach.yearsOfExperience > 12;
          default: return true;
        }
      });
    }

    // Languages filter
    if (filters.languages.length > 0) {
      filtered = filtered.filter(coach =>
        filters.languages.some(lang => coach.languages.includes(lang))
      );
    }

    // Verified filter
    if (filters.verified) {
      filtered = filtered.filter(coach => coach.isVerified);
    }

    setFilteredCoaches(filtered);
  };

  const handleFilterChange = (key: keyof CoachFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleViewProfile = (coach: Coach) => {
    if (!coach) {
      console.error('Cannot view profile: coach data is missing');
      return;
    }
    setSelectedCoach(coach);
    setShowProfileDialog(true);
  };

  const handleConnectWithCoach = (coach: Coach) => {
    setSelectedCoach(coach);
    setConnectionMessage(`Hi ${coach.firstName}, I'm interested in working with you on my personal development journey. I'd love to learn more about your coaching approach and discuss how we might work together.`);
    setShowConnectionDialog(true);
  };

  const handleSendConnectionRequest = async () => {
    if (!selectedCoach) return;

    try {
      // TODO: Send connection request via API
      console.log('Sending connection request to:', selectedCoach.id, connectionMessage);
      
      // Show success message
      setShowConnectionDialog(false);
      setConnectionMessage('');
      setSelectedCoach(null);
      
      // TODO: Show success notification
    } catch (error) {
      console.error('Failed to send connection request:', error);
    }
  };

  const getAvailabilityText = (coach: Coach) => {
    const days = Math.ceil((coach.availability.nextAvailable.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days <= 1) return 'Available today';
    if (days <= 3) return `Available in ${days} days`;
    return `Next available: ${coach.availability.nextAvailable.toLocaleDateString()}`;
  };

  const getSessionTypeIcons = (coach: Coach) => {
    const icons = [];
    if (coach.sessionTypes.online) icons.push(<OnlineIcon key="online" />);
    if (coach.sessionTypes.inPerson) icons.push(<InPersonIcon key="inperson" />);
    if (coach.sessionTypes.phone) icons.push(<PhoneIcon key="phone" />);
    return icons;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.light, 0.1)} 100%)`,
        p: { xs: 2, sm: 3, md: 4 }
      }}
    >
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {/* Page Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h3"
            data-testid="coach-discovery-heading"
            sx={{
              fontWeight: 700,
              mb: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Discover Your Perfect Coach 🌟
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Find verified coaches who match your goals and preferences
          </Typography>
        </Box>

        {/* Tabs */}
        <Card sx={{ mb: 4, background: alpha(theme.palette.background.paper, 0.85), borderRadius: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
              '& .MuiTab-root': {
                minWidth: 120,
                fontWeight: 600,
                textTransform: 'none'
              }
            }}
          >
            {tabLabels.map((label, index) => (
              <Tab
                key={index}
                label={label}
                icon={
                  index === 0 ? <SearchIcon /> :
                  index === 1 ? <StarIcon /> :
                  index === 2 ? <NewIcon /> :
                  <ScheduleIcon />
                }
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Card>

        {/* Filters */}
        <Card sx={{ mb: 4, background: alpha(theme.palette.background.paper, 0.85), borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <FilterIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Find Your Ideal Coach
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search coaches, specializations..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  data-testid="coach-search-input"
                  inputProps={{ 'data-testid': 'coach-search-input-field', role: 'searchbox' }}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Specialization</InputLabel>
                  <Select
                    multiple
                    value={filters.specializations}
                    label="Specialization"
                    onChange={(e) => handleFilterChange('specializations', e.target.value)}
                    data-testid="coach-specialization-filter"
                    sx={{ borderRadius: 2 }}
                  >
                    {SPECIALIZATION_OPTIONS.map((spec) => (
                      <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="Location"
                  placeholder="City, State"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Session Type</InputLabel>
                  <Select
                    multiple
                    value={filters.sessionTypes}
                    label="Session Type"
                    onChange={(e) => handleFilterChange('sessionTypes', e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="online">🌐 Online</MenuItem>
                    <MenuItem value="in-person">🏢 In-Person</MenuItem>
                    <MenuItem value="phone">📞 Phone</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
                  </Typography>
                  <Slider
                    value={filters.priceRange}
                    onChange={(_, value) => handleFilterChange('priceRange', value)}
                    valueLabelDisplay="auto"
                    min={0}
                    max={500}
                    step={25}
                    marks={[
                      { value: 0, label: '$0' },
                      { value: 250, label: '$250' },
                      { value: 500, label: '$500+' }
                    ]}
                  />
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.verified}
                    onChange={(e) => handleFilterChange('verified', e.target.checked)}
                  />
                }
                label="Verified Only"
              />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">Min Rating:</Typography>
                <Rating
                  value={filters.rating}
                  onChange={(_, value) => handleFilterChange('rating', value || 0)}
                  precision={0.5}
                />
              </Box>


              <Chip
                label={`${filteredCoaches.length} coaches found`}
                color="primary"
                variant="outlined"
                data-testid="coach-count-chip"
                sx={{ ml: 'auto' }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Coach Grid */}
        <Grid container spacing={3}>
          {filteredCoaches.length > 0 ? (
            filteredCoaches.map((coach) => (
              <Grid item xs={12} md={6} lg={4} key={coach.id}>
                <Card
                  data-testid={`coach-card-${coach.id}`}
                  className="coach-card"
                  onClick={() => handleViewProfile(coach)}
                  sx={{
                    background: alpha(theme.palette.background.paper, 0.85),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: 3,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          mr: 2,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                        }}
                      >
                        {coach.firstName?.[0] || 'U'}{coach.lastName?.[0] || 'U'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {coach.firstName || 'Unknown'} {coach.lastName || 'User'}
                          </Typography>
                          {coach.isVerified && (
                            <Tooltip title="Verified Coach">
                              <VerifiedIcon sx={{ fontSize: 20, color: 'success.main' }} />
                            </Tooltip>
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {coach.professionalTitle}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Rating value={coach.averageRating} readOnly size="small" precision={0.1} />
                          <Typography variant="caption" color="text.secondary">
                            ({coach.totalReviews} reviews)
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Specializations */}
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {coach.specializations.slice(0, 3).map((spec) => (
                          <Chip
                            key={spec}
                            label={spec}
                            size="small"
                            sx={{ 
                              fontSize: '0.75rem',
                              '&.MuiChip-colorDefault': {
                                background: alpha(theme.palette.primary.main, 0.1),
                                color: 'primary.main'
                              }
                            }}
                          />
                        ))}
                        {coach.specializations.length > 3 && (
                          <Chip
                            label={`+${coach.specializations.length - 3} more`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        )}
                      </Stack>
                    </Box>

                    {/* Bio */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {coach.bio}
                    </Typography>

                    {/* Details */}
                    <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {coach.location}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ExperienceIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {coach.yearsOfExperience} years
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PriceIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          ${coach.pricingStructure.sessionRates.individual}/session
                        </Typography>
                      </Box>
                    </Box>

                    {/* Session Types and Availability */}
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {getSessionTypeIcons(coach).map((icon, index) => (
                          <IconButton
                            key={index}
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main',
                              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                            }}
                          >
                            {icon}
                          </IconButton>
                        ))}
                      </Box>
                      
                      <Typography variant="caption" color="success.main" sx={{ fontWeight: 500 }}>
                        {getAvailabilityText(coach)}
                      </Typography>
                    </Box>

                    {/* Actions */}
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProfile(coach);
                        }}
                        sx={{ flex: 1, borderRadius: 2 }}
                      >
                        View Profile
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConnectWithCoach(coach);
                        }}
                        startIcon={<SendIcon />}
                        disabled={!coach.acceptingNewClients}
                        sx={{
                          flex: 1,
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                        }}
                      >
                        Connect
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }} data-testid="empty-state-container">
                <SearchIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }} data-testid="no-coaches-message">
                  No coaches found
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }} data-testid="empty-state-description">
                  No results match your search. Try different filters to find coaches.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setFilters({
                    search: '',
                    specializations: [],
                    location: '',
                    sessionTypes: [],
                    priceRange: [0, 500],
                    rating: 0,
                    experience: '',
                    languages: [],
                    availability: '',
                    verified: false
                  })}
                  sx={{ borderRadius: 3 }}
                >
                  Clear All Filters
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Coach Profile Dialog */}
        <Dialog
          open={showProfileDialog && selectedCoach !== null}
          onClose={() => {
            setShowProfileDialog(false);
            setSelectedCoach(null);
          }}
          maxWidth="md"
          fullWidth
        >
          {selectedCoach && (
            <>
              <DialogTitle sx={{ pb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                    }}
                  >
                    {selectedCoach.firstName?.[0] || 'U'}{selectedCoach.lastName?.[0] || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {selectedCoach.firstName || 'Unknown'} {selectedCoach.lastName || 'User'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCoach.professionalTitle || 'Coach'}
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 'auto' }}>
                    <IconButton onClick={() => {
                      setShowProfileDialog(false);
                      setSelectedCoach(null);
                    }}>
                      <CloseIcon />
                    </IconButton>
                  </Box>
                </Box>
              </DialogTitle>
              
              <DialogContent sx={{ pt: 0 }}>
                {/* About Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SpecializationIcon /> About
                  </Typography>
                  <Typography paragraph>{selectedCoach.bio || 'No bio available.'}</Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Specializations */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Specializations
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    {selectedCoach.specializations.map((spec) => (
                      <Chip key={spec} label={spec} color="primary" variant="outlined" />
                    ))}
                  </Stack>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Experience & Details */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Experience & Details
                  </Typography>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <ExperienceIcon color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Years of Experience</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedCoach.yearsOfExperience} years</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <LocationIcon color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Location</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedCoach.location}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <LanguageIcon color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Languages</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedCoach.languages.join(', ')}</Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Availability */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon /> Availability
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 2 }}>
                    <Typography variant="body1" color="success.main" sx={{ fontWeight: 500 }}>
                      {getAvailabilityText(selectedCoach)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Timezone: {selectedCoach.availability.timezone}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Pricing */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PriceIcon /> Session Pricing
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                      <Typography variant="body1">Individual Session</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        ${selectedCoach.pricingStructure.sessionRates.individual}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                      <Typography variant="body1">Package Rate</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        ${selectedCoach.pricingStructure.sessionRates.package}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Session Types */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Session Formats
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    {selectedCoach.sessionTypes.online && (
                      <Chip icon={<OnlineIcon />} label="Online" color="primary" />
                    )}
                    {selectedCoach.sessionTypes.inPerson && (
                      <Chip icon={<InPersonIcon />} label="In-Person" color="primary" />
                    )}
                    {selectedCoach.sessionTypes.phone && (
                      <Chip icon={<PhoneIcon />} label="Phone" color="primary" />
                    )}
                  </Stack>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Credentials */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Credentials
                  </Typography>
                  <List>
                    {selectedCoach.credentials.map((cred, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <EducationIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={cred.name}
                          secondary={cred.issuingOrganization}
                        />
                        {cred.isVerified && <VerifiedIcon color="success" />}
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </DialogContent>
              
              <DialogActions>
                <Button onClick={() => {
                  setShowProfileDialog(false);
                  setSelectedCoach(null);
                }}>
                  Close
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    setShowProfileDialog(false);
                    handleConnectWithCoach(selectedCoach);
                  }}
                  startIcon={<SendIcon />}
                  disabled={!selectedCoach.acceptingNewClients}
                >
                  Request Connection
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Connection Request Dialog */}
        <Dialog
          open={showConnectionDialog}
          onClose={() => setShowConnectionDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Connect with {selectedCoach?.firstName} {selectedCoach?.lastName}
          </DialogTitle>
          
          <DialogContent>
            <Typography paragraph>
              Send a personalized message to introduce yourself and explain why you'd like to work with this coach.
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Your Message"
              value={connectionMessage}
              onChange={(e) => setConnectionMessage(e.target.value)}
              placeholder="Hi, I'm interested in working with you..."
              sx={{ mt: 2 }}
            />
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setShowConnectionDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSendConnectionRequest}
              startIcon={<SendIcon />}
              disabled={!connectionMessage.trim()}
            >
              Send Request
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default CoachDiscovery;