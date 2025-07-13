import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, gql } from '@apollo/client'
import { useTranslation } from 'react-i18next'
import { Users, ListChecks, Info, Plus, X, Trash2, Edit, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDateTime } from '@/utils/dateUtils'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { useProjectPermissions } from '@/hooks/usePermissions'
import { usePermissions } from '@/hooks/usePermissions'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'

const GET_PROJECT_DETAIL = gql`
  query GetProjectDetail($id: ID!) {
    project(id: $id) {
      id
      name
      description
      ownerId
      createdAt
      updatedAt
      members {
        id
        username
        name
        role
      }
      projectMembers {
        id
        user {
          id
          username
          name
        }
        projectRole
        joinedAt
      }
      issues {
        id
        title
        status
        priority
        type
        createdAt
      }
    }
  }
`

const GET_ALL_USERS = gql`
  query GetAllUsers {
    users {
      id
      username
      name
      role
    }
  }
`

const ADD_PROJECT_MEMBER = gql`
  mutation AddProjectMember($projectId: ID!, $userId: ID!, $projectRole: ProjectRole) {
    addProjectMember(projectId: $projectId, userId: $userId, projectRole: $projectRole) {
      id
      user { id username name }
      projectRole
      joinedAt
    }
  }
`

const REMOVE_PROJECT_MEMBER = gql`
  mutation RemoveProjectMember($projectId: ID!, $userId: ID!) {
    removeProjectMember(projectId: $projectId, userId: $userId)
  }
`

const UPDATE_PROJECT_MEMBER_ROLE = gql`
  mutation UpdateProjectMemberRole($projectId: ID!, $userId: ID!, $projectRole: ProjectRole!) {
    updateProjectMemberRole(projectId: $projectId, userId: $userId, projectRole: $projectRole) {
      id
      user { id username name }
      projectRole
      joinedAt
    }
  }
`

const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: ID!, $name: String!, $description: String) {
    updateProject(id: $id, name: $name, description: $description) {
      id
      name
      description
    }
  }
`

const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`

const CREATE_ISSUE = gql`
  mutation CreateIssue($title: String!, $description: String, $status: IssueStatus!, $priority: IssuePriority!, $type: IssueType!, $projectId: ID!) {
    createIssue(title: $title, description: $description, status: $status, priority: $priority, type: $type, projectId: $projectId) {
      id
      title
    }
  }
`

const TABS = [
  { key: 'overview', icon: Info },
  { key: 'members', icon: Users },
  { key: 'issues', icon: ListChecks },
]

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

const ProjectDetailPage = () => {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const permissions = usePermissions()
  const [tab, setTab] = useState('overview')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [role, setRole] = useState('MEMBER')
  const [search, setSearch] = useState('')
  const [updatingRole, setUpdatingRole] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCreateIssueModal, setShowCreateIssueModal] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '' })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [createIssueForm, setCreateIssueForm] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    type: 'TASK',
  })

  // Helper functions for status, priority and type translations
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'IN_REVIEW': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'DONE': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'URGENT': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BUG': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'FEATURE': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'TASK': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'ENHANCEMENT': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'TODO': return t('todo')
      case 'IN_PROGRESS': return t('in_progress')
      case 'IN_REVIEW': return t('in_review')
      case 'DONE': return t('done')
      default: return status
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'LOW': return t('low')
      case 'MEDIUM': return t('medium')
      case 'HIGH': return t('high')
      case 'URGENT': return t('urgent')
      default: return priority
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'BUG': return t('bug')
      case 'FEATURE': return t('feature')
      case 'TASK': return t('task')
      case 'ENHANCEMENT': return t('enhancement')
      default: return type
    }
  }

  const { data, loading, error, refetch } = useQuery(GET_PROJECT_DETAIL, {
    variables: { id },
    skip: !id,
  })
  
  // Hook must always be called, even if data is not yet loaded
  const projectPermissions = useProjectPermissions(data?.project?.id, data?.project?.ownerId)
  
  const { data: usersData } = useQuery(GET_ALL_USERS, {
    skip: !projectPermissions?.canManageMembers
  })
  
  const [addProjectMember, { loading: adding }] = useMutation(ADD_PROJECT_MEMBER)
  const [removeProjectMember] = useMutation(REMOVE_PROJECT_MEMBER)
  const [updateProjectMemberRole] = useMutation(UPDATE_PROJECT_MEMBER_ROLE)
  const [updateProject, { loading: updatingProject }] = useMutation(UPDATE_PROJECT)
  const [deleteProject] = useMutation(DELETE_PROJECT)
  const [createIssue, { loading: creatingIssue }] = useMutation(CREATE_ISSUE)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !data?.project) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{t('error_loading_projects')}</p>
      </div>
    )
  }

  const project = data.project

  // Filter users for autocomplete
  const filteredUsers = (usersData?.users || []).filter(
    (u: any) =>
      (u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase())) &&
      !project.projectMembers.some((pm: any) => pm.user.id === u.id)
  )

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    try {
      await addProjectMember({
        variables: {
          projectId: project.id,
          userId: selectedUser.id,
          projectRole: role,
        },
      })
      toast.success(t('member_added'))
      setShowAddModal(false)
      setSelectedUser(null)
      setRole('MEMBER')
      setSearch('')
      refetch()
    } catch (err) {
      toast.error(t('member_add_error'))
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeProjectMember({
        variables: { projectId: project.id, userId },
      })
      toast.success(t('member_removed'))
      refetch()
    } catch (err) {
      toast.error(t('member_remove_error'))
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRole(userId)
    try {
      await updateProjectMemberRole({
        variables: { projectId: project.id, userId, projectRole: newRole },
      })
      toast.success(t('role_updated'))
      refetch()
    } catch (err) {
      toast.error(t('role_update_error'))
    } finally {
      setUpdatingRole('')
    }
  }

  // Calculate project statistics
  const calculateProjectStats = () => {
    const issues = project.issues || []
    const members = project.projectMembers || []
    
    // Issue status distribution
    const statusStats = {
      TODO: issues.filter((i: any) => i.status === 'TODO').length,
      IN_PROGRESS: issues.filter((i: any) => i.status === 'IN_PROGRESS').length,
      IN_REVIEW: issues.filter((i: any) => i.status === 'IN_REVIEW').length,
      DONE: issues.filter((i: any) => i.status === 'DONE').length
    }
    
    // Issue priority distribution
    const priorityStats = {
      LOW: issues.filter((i: any) => i.priority === 'LOW').length,
      MEDIUM: issues.filter((i: any) => i.priority === 'MEDIUM').length,
      HIGH: issues.filter((i: any) => i.priority === 'HIGH').length,
      URGENT: issues.filter((i: any) => i.priority === 'URGENT').length
    }
    
    // Issue type distribution
    const typeStats = {
      BUG: issues.filter((i: any) => i.type === 'BUG').length,
      FEATURE: issues.filter((i: any) => i.type === 'FEATURE').length,
      TASK: issues.filter((i: any) => i.type === 'TASK').length,
      ENHANCEMENT: issues.filter((i: any) => i.type === 'ENHANCEMENT').length
    }
    
    // Completion rate
    const totalIssues = issues.length
    const completedIssues = statusStats.DONE
    const completionRate = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0
    
    // Recent activity (last 7 days)
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
      const dayIssues = issues.filter((issue: any) => {
        if (!issue.createdAt) return false
        
        try {
          let issueDate: Date
          if (/^\d+$/.test(issue.createdAt)) {
            issueDate = new Date(parseInt(issue.createdAt))
          } else {
            issueDate = new Date(issue.createdAt)
          }
          
          if (isNaN(issueDate.getTime())) return false
          return isSameDay(issueDate, date)
        } catch (error) {
          return false
        }
      })
      
      return {
        date: date.toLocaleDateString(i18n.language === 'de' ? 'de-DE' : 'en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        issues: dayIssues.length,
        name: t('issues')
      }
    })
    
    return {
      statusStats,
      priorityStats,
      typeStats,
      completionRate,
      totalIssues,
      completedIssues,
      members: members.length,
      activityData
    }
  }
  
  const stats = calculateProjectStats()
  
  // Chart data preparation
  const statusChartData = Object.entries(stats.statusStats)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: getStatusText(key),
      value,
      color: COLORS[key as keyof typeof COLORS]
    }))
  
  const priorityChartData = Object.entries(stats.priorityStats)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: getPriorityText(key),
      value,
      color: COLORS[key as keyof typeof COLORS]
    }))
  
  const typeChartData = Object.entries(stats.typeStats)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: getTypeText(key),
      value,
      color: COLORS[key as keyof typeof COLORS]
    }))

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
              {entry.name || t('issues')}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Breadcrumbs 
        items={[
          { label: t('projects'), href: '/projects' },
          { label: project.name, current: true }
        ]} 
        className="mb-2"
      />
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{project.description}</p>
        </div>
        {/* Header Buttons */}
        <div className="flex gap-2">
          {projectPermissions?.canManageMembers && (
            <button
              className="btn btn-secondary btn-md"
              onClick={() => {
                setEditForm({ name: project.name, description: project.description || '' })
                setShowEditModal(true)
              }}
            >
              <Edit className="h-4 w-4 mr-1" /> {t('edit')}
            </button>
          )}
          {projectPermissions?.canDeleteProject && (
            <button
              className="btn btn-danger btn-md"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" /> {t('delete')}
            </button>
          )}
          <button
            className="btn btn-primary btn-md"
            onClick={() => setShowCreateIssueModal(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> {t('create_issue')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
        {/* Desktop Tabs */}
        <div className="hidden sm:flex">
          {TABS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center px-4 py-2 -mb-px border-b-2 transition-colors text-sm font-medium focus:outline-none ${
                tab === key
                  ? 'border-primary-600 text-primary-700 dark:text-primary-300 dark:border-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-300'
              }`}
            >
              <Icon className="mr-2 h-4 w-4" />
              {t(key)}
            </button>
          ))}
        </div>
        
        {/* Mobile Tab Selector */}
        <div className="sm:hidden">
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {TABS.map(({ key, icon: _Icon }) => (
              <option key={key} value={key} className="flex items-center">
                {t(key)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Project Info */}
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{project.name}</h2>
                {project.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{project.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>{t('created')}: {formatDateTime(project.createdAt, i18n.language === 'de' ? 'de-DE' : 'en-US')}</span>
                  <span>{t('updated')}: {formatDateTime(project.updatedAt, i18n.language === 'de' ? 'de-DE' : 'en-US')}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {projectPermissions?.canManageProject && (
                  <button
                    className="btn btn-primary btn-md"
                    onClick={() => {
                      setEditForm({ name: project.name, description: project.description || '' })
                      setShowEditModal(true)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" /> {t('edit')}
                  </button>
                )}
                {projectPermissions?.canDeleteProject && (
                  <button
                    className="btn btn-danger btn-md"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> {t('delete')}
                  </button>
                )}
                <button
                  className="btn btn-primary btn-md"
                  onClick={() => setShowCreateIssueModal(true)}
                >
                  <Plus className="h-4 w-4 mr-1" /> {t('create_issue')}
                </button>
              </div>
            </div>
          </div>

          {/* Statistics - Only show for users with permission */}
          {permissions.canViewProjectStats ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('total_issues')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalIssues}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('completion_rate')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.completionRate}%</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('in_progress')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.statusStats.IN_PROGRESS}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('members')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.members}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Issue Status Distribution */}
                {statusChartData.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold mb-4">{t('issue_status_distribution')}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Issue Priority Distribution */}
                {priorityChartData.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold mb-4">{t('issue_priority_distribution')}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={priorityChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#6B7280" 
                          fontSize={12}
                          tick={{ fill: '#6B7280' }}
                        />
                        <YAxis 
                          stroke="#6B7280" 
                          fontSize={12}
                          tick={{ fill: '#6B7280' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {priorityChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              {stats.activityData.some(day => day.issues > 0) && (
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">{t('recent_activity')}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={stats.activityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6B7280" 
                        fontSize={12}
                        tick={{ fill: '#6B7280' }}
                      />
                      <YAxis 
                        stroke="#6B7280" 
                        fontSize={12}
                        tick={{ fill: '#6B7280' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="issues" 
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Issue Types */}
              {typeChartData.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">{t('issue_types')}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {typeChartData.map((type, index) => (
                      <div key={index} className="text-center">
                        <div 
                          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2"
                          style={{ backgroundColor: `${type.color}20` }}
                        >
                          <span className="text-2xl font-bold" style={{ color: type.color }}>
                            {type.value}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{type.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Simple overview for users without stats permission */
            <div className="card">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Info className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('project_overview')}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{t('project_overview_description')}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{project.projectMembers.length}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('members')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{project.issues.length}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('total_issues')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'members' && (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-base sm:text-lg font-semibold">{t('members')}</h2>
            {projectPermissions?.canManageMembers && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary btn-md w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('add_member')}
              </button>
            )}
          </div>
          {/* Member list */}
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {project.projectMembers.map((projectMember: any) => {
              const member = projectMember.user
              return (
                <li key={projectMember.id} className="flex items-center py-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
                      {member.name?.charAt(0) || member.username?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">{member.name || member.username}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{t('project_role')}:</span>
                      <span className="text-xs font-medium text-primary-600 dark:text-primary-400">{t(projectMember.projectRole.toLowerCase())}</span>
                    </div>
                  </div>
                  {projectPermissions?.canManageMembers && (
                    <div className="flex items-center gap-2 ml-2">
                      {/* Role change dropdown */}
                      <select
                        className="input w-24 sm:w-32 text-xs sm:text-sm"
                        value={projectMember.projectRole}
                        disabled={updatingRole === projectMember.id}
                        onChange={e => handleRoleChange(member.id, e.target.value)}
                      >
                        <option value="OWNER">{t('owner')}</option>
                        <option value="MAINTAINER">{t('maintainer')}</option>
                        <option value="DEVELOPER">{t('developer')}</option>
                        <option value="REPORTER">{t('reporter')}</option>
                        <option value="MEMBER">{t('member')}</option>
                      </select>
                      {/* Remove button */}
                      <button
                        className="btn btn-danger btn-sm p-2"
                        title={t('remove_member')}
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          {/* Modal: Add member */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-md relative animate-fade-in">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
                <h3 className="text-lg font-semibold mb-4">{t('add_member')}</h3>
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('search_user')}
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder={t('search')}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                      <ul className="mt-2 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
                        {filteredUsers.length === 0 && (
                          <li className="px-3 py-2 text-gray-500 text-sm">{t('no_user_found')}</li>
                        )}
                        {filteredUsers.map((user: any) => (
                          <li
                            key={user.id}
                            className={`px-3 py-2 cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900 text-sm ${selectedUser?.id === user.id ? 'bg-primary-100 dark:bg-primary-900' : ''}`}
                            onClick={() => setSelectedUser(user)}
                          >
                            {user.name || user.username} <span className="text-xs text-gray-400 ml-2">({user.username})</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('role')}
                    </label>
                    <select
                      className="input"
                      value={role}
                      onChange={e => setRole(e.target.value)}
                    >
                      <option value="OWNER">{t('owner')}</option>
                      <option value="MAINTAINER">{t('maintainer')}</option>
                      <option value="DEVELOPER">{t('developer')}</option>
                      <option value="REPORTER">{t('reporter')}</option>
                      <option value="MEMBER">{t('member')}</option>
                    </select>
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="btn btn-primary btn-md w-full"
                      disabled={!selectedUser || adding}
                    >
                      {adding ? t('adding') : t('add')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'issues' && (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold">{t('issues')}</h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {project.issues.length} {project.issues.length === 1 ? t('issue') : t('issues')}
              </div>
            </div>
            <button
              onClick={() => navigate('/issues')}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('create_issue')}
            </button>
          </div>
          
          {project.issues.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">{t('no_issues_found')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {project.issues.map((issue: any) => (
                <div
                  key={issue.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-2">
                        <h3 
                          onClick={() => navigate(`/issues/${issue.id}`)}
                          className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {issue.title}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(issue.status)}`}>
                            {getStatusText(issue.status)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(issue.priority)}`}>
                            {getPriorityText(issue.priority)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(issue.type)}`}>
                            {getTypeText(issue.type)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{t('created')}: {formatDateTime(issue.createdAt, i18n.language === 'de' ? 'de-DE' : 'en-US')}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigate(`/issues/${issue.id}`)}
                        className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        {t('view')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-md relative animate-fade-in">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              onClick={() => setShowEditModal(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-semibold mb-4">{t('edit')} {t('project')}</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                await updateProject({ variables: { id: project.id, ...editForm } })
                toast.success(t('project_updated'))
                setShowEditModal(false)
                refetch()
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('project_name')}</label>
                <input
                  type="text"
                  className="input"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('description')}</label>
                <textarea
                  className="input"
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-md w-full" disabled={updatingProject}>{updatingProject ? t('saving') : t('save')}</button>
            </form>
          </div>
        </div>
      )}
      {/* Delete Project Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-md relative animate-fade-in">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              onClick={() => setShowDeleteModal(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-semibold mb-4">{t('delete')} {t('project')}</h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{t('delete_project_warning')}</p>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-md flex-1" onClick={() => setShowDeleteModal(false)}>{t('cancel')}</button>
              <button
                className="btn btn-danger btn-md flex-1"
                disabled={deleteLoading}
                onClick={async () => {
                  setDeleteLoading(true)
                  await deleteProject({ variables: { id: project.id } })
                  setDeleteLoading(false)
                  toast.success(t('project_deleted'))
                  navigate('/projects')
                }}
              >
                {deleteLoading ? t('deleting') : t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Create Issue Modal */}
      {showCreateIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-md relative animate-fade-in">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              onClick={() => setShowCreateIssueModal(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-semibold mb-4">{t('create_issue')}</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                await createIssue({ variables: { ...createIssueForm, projectId: project.id } })
                toast.success(t('issue_created_success'))
                setShowCreateIssueModal(false)
                setCreateIssueForm({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', type: 'TASK' })
                refetch()
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('title')}</label>
                <input
                  type="text"
                  className="input"
                  value={createIssueForm.title}
                  onChange={e => setCreateIssueForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('description')}</label>
                <textarea
                  className="input"
                  value={createIssueForm.description}
                  onChange={e => setCreateIssueForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <select className="input flex-1" value={createIssueForm.status} onChange={e => setCreateIssueForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="TODO">{t('todo')}</option>
                  <option value="IN_PROGRESS">{t('in_progress')}</option>
                  <option value="IN_REVIEW">{t('in_review')}</option>
                  <option value="DONE">{t('done')}</option>
                </select>
                <select className="input flex-1" value={createIssueForm.priority} onChange={e => setCreateIssueForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="LOW">{t('low')}</option>
                  <option value="MEDIUM">{t('medium')}</option>
                  <option value="HIGH">{t('high')}</option>
                  <option value="URGENT">{t('urgent')}</option>
                </select>
                <select className="input flex-1" value={createIssueForm.type} onChange={e => setCreateIssueForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="BUG">{t('bug')}</option>
                  <option value="FEATURE">{t('feature')}</option>
                  <option value="TASK">{t('task')}</option>
                  <option value="ENHANCEMENT">{t('enhancement')}</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-md w-full" disabled={creatingIssue}>{creatingIssue ? t('creating') : t('create')}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectDetailPage 