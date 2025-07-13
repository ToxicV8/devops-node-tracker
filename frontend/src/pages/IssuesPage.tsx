import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation } from '@apollo/client'
import { gql } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '../utils/dateUtils'
import { Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { usePermissions } from '../hooks/usePermissions'

const GET_ISSUES = gql`
  query GetIssues($projectId: ID, $status: IssueStatus, $priority: IssuePriority, $type: IssueType, $assigneeId: ID) {
    issues(projectId: $projectId, status: $status, priority: $priority, type: $type, assigneeId: $assigneeId) {
      id
      title
      description
      status
      priority
      type
      createdAt
      updatedAt
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
  }
`

const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
      name
    }
  }
`

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      username
      name
    }
  }
`

const CREATE_ISSUE = gql`
  mutation CreateIssue($title: String!, $description: String, $status: IssueStatus!, $priority: IssuePriority!, $type: IssueType!, $projectId: ID!, $assigneeId: ID) {
    createIssue(title: $title, description: $description, status: $status, priority: $priority, type: $type, projectId: $projectId, assigneeId: $assigneeId) {
      id
      title
      description
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
  }
`

const IssuesPage = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const permissions = usePermissions()
  const [filters, setFilters] = useState({
    projectId: '',
    status: '',
    priority: '',
    type: '',
    assigneeId: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    type: 'TASK',
    projectId: '',
    assigneeId: ''
  })

  // Filter out empty strings, as GraphQL Enums don't accept empty strings
  const graphqlFilters = {
    projectId: filters.projectId || undefined,
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    type: filters.type || undefined,
    assigneeId: filters.assigneeId || undefined
  }

  const { data: issuesData, loading: issuesLoading, error: issuesError, refetch } = useQuery(GET_ISSUES, {
    variables: graphqlFilters,
    fetchPolicy: 'cache-and-network'
  })

  const { data: projectsData } = useQuery(GET_PROJECTS)
  const { data: usersData } = useQuery(GET_USERS, {
    skip: !permissions.canAssignIssues
  })
  const [createIssue, { loading: creating }] = useMutation(CREATE_ISSUE)

  const filteredIssues = issuesData?.issues?.filter((issue: any) =>
    issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.project.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

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

  const clearFilters = () => {
    setFilters({
      projectId: '',
      status: '',
      priority: '',
      type: '',
      assigneeId: ''
    })
    setSearchTerm('')
  }

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!createFormData.title.trim() || !createFormData.projectId) {
      toast.error(t('please_fill_required_fields'))
      return
    }

    try {
      await createIssue({
        variables: {
          title: createFormData.title.trim(),
          description: createFormData.description.trim() || undefined,
          status: createFormData.status,
          priority: createFormData.priority,
          type: createFormData.type,
          projectId: createFormData.projectId,
          assigneeId: createFormData.assigneeId || undefined
        }
      })
      
      toast.success(t('issue_created_success'))
      setShowCreateModal(false)
      setCreateFormData({
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        type: 'TASK',
        projectId: '',
        assigneeId: ''
      })
      refetch()
    } catch (error) {
      toast.error(t('issue_create_error'))
    }
  }

  const handleCreateFormChange = (field: string, value: string) => {
    setCreateFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (issuesError) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('issues')}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('manage_issues')}</p>
        </div>
        
        <div className="card">
          <p className="text-red-500 dark:text-red-400">{t('error_loading_issues')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Breadcrumbs 
        items={[
          { label: t('issues'), current: true }
        ]} 
        className="mb-2"
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('issues')}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('manage_issues')}</p>
        </div>
        {permissions.canCreateComments && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('create_issue')}
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('search_issues')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {t('clear_filters')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <select
            value={filters.projectId}
            onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">{t('all_projects')}</option>
            {projectsData?.projects?.map((project: any) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">{t('all_statuses')}</option>
            <option value="TODO">{t('todo')}</option>
            <option value="IN_PROGRESS">{t('in_progress')}</option>
            <option value="IN_REVIEW">{t('in_review')}</option>
            <option value="DONE">{t('done')}</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">{t('all_priorities')}</option>
            <option value="LOW">{t('low')}</option>
            <option value="MEDIUM">{t('medium')}</option>
            <option value="HIGH">{t('high')}</option>
            <option value="URGENT">{t('urgent')}</option>
          </select>

          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">{t('all_types')}</option>
            <option value="BUG">{t('bug')}</option>
            <option value="FEATURE">{t('feature')}</option>
            <option value="TASK">{t('task')}</option>
            <option value="ENHANCEMENT">{t('enhancement')}</option>
          </select>

          <select
            value={filters.assigneeId}
            onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">{t('all_assignees')}</option>
            {usersData?.users?.map((user: any) => (
              <option key={user.id} value={user.id}>{user.name || user.username}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Issues List */}
      <div className="card">
        {issuesLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">{t('no_issues_found')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIssues.map((issue: any) => (
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
                    
                    {issue.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {issue.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>{t('project')}: {issue.project.name}</span>
                      <span>{t('reporter')}: {issue.reporter.name || issue.reporter.username}</span>
                      {issue.assignee && (
                        <span>{t('assignee')}: {issue.assignee.name || issue.assignee.username}</span>
                      )}
                      <span>{t('created')}: {formatDate(issue.createdAt, i18n.language === 'de' ? 'de-DE' : 'en-US')}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigate(`/issues/${issue.id}`)}
                      className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      {t('view')}
                    </button>
                    {permissions.canEditIssues && (
                      <button className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                        {t('edit')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Issue Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('create_issue')}</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('title')} *
                </label>
                <input
                  type="text"
                  value={createFormData.title}
                  onChange={(e) => handleCreateFormChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder={t('issue_title_placeholder')}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('description')}
                </label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => handleCreateFormChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder={t('issue_description_placeholder')}
                />
              </div>

              {/* Project */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('project')} *
                </label>
                <select
                  value={createFormData.projectId}
                  onChange={(e) => handleCreateFormChange('projectId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">{t('select_project')}</option>
                  {projectsData?.projects?.map((project: any) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              {/* Status, Priority, Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('status')} *
                  </label>
                  <select
                    value={createFormData.status}
                    onChange={(e) => handleCreateFormChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="TODO">{t('todo')}</option>
                    <option value="IN_PROGRESS">{t('in_progress')}</option>
                    <option value="IN_REVIEW">{t('in_review')}</option>
                    <option value="DONE">{t('done')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('priority')} *
                  </label>
                  <select
                    value={createFormData.priority}
                    onChange={(e) => handleCreateFormChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="LOW">{t('low')}</option>
                    <option value="MEDIUM">{t('medium')}</option>
                    <option value="HIGH">{t('high')}</option>
                    <option value="URGENT">{t('urgent')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('type')} *
                  </label>
                  <select
                    value={createFormData.type}
                    onChange={(e) => handleCreateFormChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="BUG">{t('bug')}</option>
                    <option value="FEATURE">{t('feature')}</option>
                    <option value="TASK">{t('task')}</option>
                    <option value="ENHANCEMENT">{t('enhancement')}</option>
                  </select>
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('assignee')}
                </label>
                <select
                  value={createFormData.assigneeId}
                  onChange={(e) => handleCreateFormChange('assigneeId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">{t('unassigned')}</option>
                  {usersData?.users?.map((user: any) => (
                    <option key={user.id} value={user.id}>{user.name || user.username}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {creating ? t('creating') : t('create_issue')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default IssuesPage 