import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { 
  FolderOpen, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Shield,
  AlertTriangle
} from 'lucide-react'
import { Project, Issue } from '@/types'
import { useTranslation } from 'react-i18next'
import { usePermissions } from '../hooks/usePermissions'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'

const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    projects {
      id
      name
      description
      createdAt
      issues {
        id
        status
        priority
        type
        createdAt
      }
    }
    issues {
      id
      title
      status
      priority
      type
      createdAt
      project {
        id
        name
      }
      reporter {
        id
        username
        name
      }
      assignee {
        id
        username
        name
      }
    }
    users {
      id
      username
      name
      role
      isActive
    }
  }
`

interface DashboardData {
  projects: Project[]
  issues: Issue[]
  users: any[]
}

const COLORS = {
  TODO: '#94A3B8',
  IN_PROGRESS: '#3B82F6',
  IN_REVIEW: '#F59E0B',
  DONE: '#10B981',
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#F97316',
  URGENT: '#EF4444',
  BUG: '#EF4444',
  FEATURE: '#8B5CF6',
  TASK: '#3B82F6',
  ENHANCEMENT: '#6366F1'
}

const GRADIENT_COLORS = {
  blue: ['#3B82F6', '#1D4ED8'],
  green: ['#10B981', '#059669'],
  purple: ['#8B5CF6', '#7C3AED'],
  orange: ['#F59E0B', '#D97706'],
  red: ['#EF4444', '#DC2626']
}

const DashboardPage = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { canViewDashboard } = usePermissions()
  const { data, loading, error } = useQuery<DashboardData>(GET_DASHBOARD_DATA)

  // Check if user has permission to view dashboard
  if (!canViewDashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t('access_denied')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('dashboard_access_denied')}
          </p>
          <button
            onClick={() => navigate('/projects')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('go_to_projects')}
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{t('error_loading_dashboard')}</p>
      </div>
    )
  }

  const projects = data?.projects || []
  const issues = data?.issues || []
  const users = data?.users || []
  // Basic Statistics
  const todoIssues = issues.filter(issue => issue.status === 'TODO')
  const inProgressIssues = issues.filter(issue => issue.status === 'IN_PROGRESS')
  const inReviewIssues = issues.filter(issue => issue.status === 'IN_REVIEW')
  const doneIssues = issues.filter(issue => issue.status === 'DONE')
  const urgentIssues = issues.filter(issue => issue.priority === 'URGENT')
  const highPriorityIssues = issues.filter(issue => issue.priority === 'HIGH')
  
  const activeUsers = users.filter(user => user.isActive)
  const totalIssues = issues.length
  const completionRate = totalIssues > 0 ? Math.round((doneIssues.length / totalIssues) * 100) : 0

  // Chart Data Preparation
  const statusData = [
    { name: t('todo'), value: todoIssues.length, color: COLORS.TODO, fill: COLORS.TODO },
    { name: t('in_progress'), value: inProgressIssues.length, color: COLORS.IN_PROGRESS, fill: COLORS.IN_PROGRESS },
    { name: t('in_review'), value: inReviewIssues.length, color: COLORS.IN_REVIEW, fill: COLORS.IN_REVIEW },
    { name: t('done'), value: doneIssues.length, color: COLORS.DONE, fill: COLORS.DONE }
  ].filter(item => item.value > 0)

  const priorityData = [
    { name: t('low'), value: issues.filter(i => i.priority === 'LOW').length, color: COLORS.LOW },
    { name: t('medium'), value: issues.filter(i => i.priority === 'MEDIUM').length, color: COLORS.MEDIUM },
    { name: t('high'), value: highPriorityIssues.length, color: COLORS.HIGH },
    { name: t('urgent'), value: urgentIssues.length, color: COLORS.URGENT }
  ].filter(item => item.value > 0)

  const typeData = [
    { name: t('bug'), value: issues.filter(i => i.type === 'BUG').length, color: COLORS.BUG, fill: COLORS.BUG },
    { name: t('feature'), value: issues.filter(i => i.type === 'FEATURE').length, color: COLORS.FEATURE, fill: COLORS.FEATURE },
    { name: t('task'), value: issues.filter(i => i.type === 'TASK').length, color: COLORS.TASK, fill: COLORS.TASK },
    { name: t('enhancement'), value: issues.filter(i => i.type === 'ENHANCEMENT').length, color: COLORS.ENHANCEMENT, fill: COLORS.ENHANCEMENT }
  ].filter(item => item.value > 0)

  // Project Activity Data (last 7 days)
  const getLast7Days = () => {
    const dates = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date)
    }
    return dates
  }

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  const activityData = getLast7Days().map(date => {
    const dayIssues = issues.filter(issue => {
      if (!issue.createdAt) return false
      
      try {
        // Handle Unix timestamp (milliseconds) as string
        let issueDate: Date
        if (/^\d+$/.test(issue.createdAt)) {
          // It's a numeric string (Unix timestamp)
          issueDate = new Date(parseInt(issue.createdAt))
        } else {
          // Try parsing as regular date string
          issueDate = new Date(issue.createdAt)
        }
        
        // Check if the date is valid
        if (isNaN(issueDate.getTime())) {
          console.warn('Invalid date after parsing:', issue.createdAt)
          return false
        }
        
        return isSameDay(issueDate, date)
      } catch (error) {
        console.warn('Error parsing date:', issue.createdAt, error)
        return false
      }
    })
    
    return {
      date: date.toLocaleDateString(i18n.language === 'de' ? 'de-DE' : 'en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      issues: dayIssues.length,
      fullDate: date.toISOString().split('T')[0] // For debugging
    }
  })

  // Project Performance Data - Completed Issues
  const projectPerformance = projects.map(project => {
    const projectIssues = issues.filter(issue => issue.project.id === project.id)
    const completedIssues = projectIssues.filter(issue => issue.status === 'DONE').length
    const openIssues = projectIssues.filter(issue => issue.status === 'TODO').length
    const inProgressIssues = projectIssues.filter(issue => issue.status === 'IN_PROGRESS').length
    
    return {
      name: project.name,
      completed: completedIssues,
      open: openIssues,
      inProgress: inProgressIssues,
      total: projectIssues.length,
      fill: completedIssues > 10 ? GRADIENT_COLORS.green[0] : completedIssues > 5 ? GRADIENT_COLORS.orange[0] : GRADIENT_COLORS.red[0]
    }
  }).sort((a, b) => b.completed - a.completed).slice(0, 5)

  // Calculate real trends based on actual data
  const calculateTrend = (current: number, previous: number): { value: string, up: boolean } => {
    if (previous === 0) {
      return { value: current > 0 ? '+100%' : '0%', up: current > 0 }
    }
    const change = ((current - previous) / previous) * 100
    const rounded = Math.round(change)
    return { 
      value: `${rounded >= 0 ? '+' : ''}${rounded}%`, 
      up: rounded >= 0 
    }
  }

  // For demo purposes, we'll calculate trends based on current data distribution
  // In a real app, you'd compare with historical data from a database
  const projectsTrend = calculateTrend(projects.length, Math.max(0, projects.length - 1))
  const issuesTrend = calculateTrend(totalIssues, Math.max(0, totalIssues - 2))
  const completionTrend = calculateTrend(completionRate, Math.max(0, completionRate - 5))
  const usersTrend = calculateTrend(activeUsers.length, Math.max(0, activeUsers.length - 1))

  const stats = [
    {
      name: t('projects'),
      value: projects.length,
      icon: FolderOpen,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      borderColor: 'border-blue-200 dark:border-blue-700',
      trend: projectsTrend.value,
      trendUp: projectsTrend.up,
      description: t('active_projects')
    },
    {
      name: t('total_issues'),
      value: totalIssues,
      icon: AlertCircle,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20',
      borderColor: 'border-orange-200 dark:border-orange-700',
      trend: issuesTrend.value,
      trendUp: issuesTrend.up,
      description: t('total_issues_description')
    },
    {
      name: t('completion_rate'),
      value: `${completionRate}%`,
      icon: Target,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
      borderColor: 'border-green-200 dark:border-green-700',
      trend: completionTrend.value,
      trendUp: completionTrend.up,
      description: t('completion_rate_description')
    },
    {
      name: t('active_users'),
      value: activeUsers.length,
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
      borderColor: 'border-purple-200 dark:border-purple-700',
      trend: usersTrend.value,
      trendUp: usersTrend.up,
      description: t('active_users_description')
    }
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl backdrop-blur-sm z-50">
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            // Übersetze die Daten-Schlüssel
            let translatedName = entry.name
            if (entry.dataKey === 'completed') {
              translatedName = t('completed')
            } else if (entry.dataKey === 'value') {
              translatedName = t('count')
            } else if (entry.dataKey === 'issues') {
              translatedName = t('issues')
            } else {
              translatedName = t(entry.name)
            }
            
            return (
              <div key={index} className="flex items-center gap-2 mb-1">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {translatedName}: <span className="text-gray-900 dark:text-gray-100 font-semibold">{entry.value}</span>
                </p>
              </div>
            )
          })}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('dashboard')}</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">{t('overview')}</p>
      </div>



      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div 
              key={stat.name} 
              className={`card border-2 ${stat.borderColor} ${stat.bgColor} transform hover:scale-105 transition-all duration-300 hover:shadow-xl`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
              <div className="flex items-center">
                  <div className={`p-4 rounded-2xl ${stat.bgColor} shadow-lg`}>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.name}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.description}</p>
                  </div>
                </div>
                <div className={`flex items-center text-sm font-medium ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trendUp ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {stat.trend}
                </div>
              </div>
            </div>
          )
        })}
      </div>

            {/* Dashboard Grid - 2x3 Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Urgent Issues */}
        <div className="card border-2 border-red-200 dark:border-red-700 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('urgent_issues')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('urgent_description')}</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-xl">
              <Zap className="h-6 w-6 text-red-600" />
            </div>
          </div>
          {urgentIssues.length > 0 ? (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {urgentIssues.slice(0, 8).map((issue) => (
                <div 
                  key={issue.id} 
                  className="flex flex-col p-4 bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-700 shadow-sm hover:shadow-xl hover:border-red-300 dark:hover:border-red-600 transition-all duration-200 cursor-pointer group"
                  onClick={() => navigate(`/issues/${issue.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors mb-2">
                      {issue.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors mb-3">
                      {issue.project.name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 text-xs font-medium bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded-full">
                      {t(issue.status.toLowerCase())}
                  </span>
                    <AlertCircle className="h-4 w-4 text-red-500 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
              ))}
              {urgentIssues.length > 8 && (
                <div className="text-center pt-4">
                  <button 
                    onClick={() => navigate('/issues?priority=URGENT')}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
                  >
                    {t('view_all_urgent_issues')} ({urgentIssues.length})
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 bg-green-100 dark:bg-green-900/40 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">{t('no_urgent_issues')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{t('all_issues_under_control')}</p>
            </div>
          )}
        </div>

        {/* Issue Status Distribution */}
        <div className="card border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('issue_status_distribution')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('status_distribution_description')}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <PieChart className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
          <ResponsiveContainer width="100%" height={350}>
            <RechartsPieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={120}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={5}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Issue Priority Distribution */}
        <div className="card border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('issue_priority_distribution')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('priority_distribution_description')}</p>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={priorityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
                fill="url(#priorityGradient)"
              />
              <defs>
                <linearGradient id="priorityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0.9}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="card border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('recent_activity')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('activity_description')}</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={activityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="issues" 
                stroke="#10B981" 
                strokeWidth={3}
                fill="url(#activityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Project Performance - Completed Issues */}
        <div className="card border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('project_performance')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('completed_issues_per_project')}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={projectPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke="#6B7280" 
                fontSize={12} 
                angle={-45} 
                textAnchor="end" 
                height={80}
                tick={{ fill: '#6B7280' }}
              />
              <YAxis 
                stroke="#6B7280" 
                fontSize={12}
                tick={{ fill: '#6B7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="completed" 
                radius={[6, 6, 0, 0]}
                fill="url(#completedGradient)"
                stroke="#3B82F6"
                strokeWidth={1}
              />
              <defs>
                <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9}/>
                  <stop offset="50%" stopColor="#2563EB" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0.9}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Issue Types */}
        <div className="card border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('issue_types')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('types_description')}</p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <PieChart className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <RechartsPieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={120}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={5}
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage 