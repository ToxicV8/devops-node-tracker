import { useState } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  Eye, 
  Plus,
  Search,
  X,
  GripVertical
} from 'lucide-react'
import { formatDate } from '@/utils/dateUtils'
import toast from 'react-hot-toast'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

const GET_KANBAN_DATA = gql`
  query GetKanbanData($projectId: ID) {
    issues(projectId: $projectId) {
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
    projects {
      id
      name
    }
  }
`

const UPDATE_ISSUE_STATUS = gql`
  mutation UpdateIssueStatus($id: ID!, $status: IssueStatus!) {
    updateIssue(id: $id, status: $status) {
      id
      status
    }
  }
`

const CREATE_ISSUE = gql`
  mutation CreateIssue($title: String!, $description: String, $status: IssueStatus!, $priority: IssuePriority!, $type: IssueType!, $projectId: ID!) {
    createIssue(title: $title, description: $description, status: $status, priority: $priority, type: $type, projectId: $projectId) {
      id
      title
      status
      priority
      type
    }
  }
`

interface KanbanColumn {
  id: string
  title: string
  issues: any[]
  color: string
  bgColor: string
  icon: any
}

// Sortable Issue Card Component
const SortableIssueCard = ({ issue, getStatusColor, getPriorityColor, getTypeColor, getStatusText, getPriorityText, getTypeText, t, i18n, onIssueClick }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation when clicking on drag handle
    if ((e.target as HTMLElement).closest('[data-drag-handle]')) {
      return
    }
    onIssueClick(issue.id)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-3 p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 transition-all cursor-pointer group ${
        isDragging ? 'shadow-lg rotate-2 opacity-50' : 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600'
      }`}
      onClick={handleCardClick}
      title={t('click_to_view_details')}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-2 flex-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {issue.title}
          </h4>
          <div
            {...attributes}
            {...listeners}
            data-drag-handle
            className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        </div>
        
        {issue.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {issue.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1">
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

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{issue.project.name}</span>
          <span>{formatDate(issue.createdAt, i18n.language === 'de' ? 'de-DE' : 'en-US')}</span>
        </div>

        {issue.assignee && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <span>{t('assigned_to')}: {issue.assignee.name || issue.assignee.username}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Droppable Column Component
const DroppableColumn = ({ column, children }: { column: KanbanColumn, children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[500px] p-2 rounded-lg transition-colors ${
        isOver 
          ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-600' 
          : 'bg-gray-50 dark:bg-gray-800'
      }`}
    >
      {children}
    </div>
  )
}

const KanbanBoardPage = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [selectedProject, setSelectedProject] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    type: 'TASK',
    projectId: ''
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const { data, loading, error, refetch } = useQuery(GET_KANBAN_DATA, {
    variables: { projectId: selectedProject || undefined },
    fetchPolicy: 'cache-and-network'
  })

  const [updateIssueStatus] = useMutation(UPDATE_ISSUE_STATUS)
  const [createIssue, { loading: creating }] = useMutation(CREATE_ISSUE)

  // Helper functions
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

  // Filter issues based on search term
  const filteredIssues = (data?.issues || []).filter((issue: any) =>
    issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.project.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Organize issues into columns
  const columns: KanbanColumn[] = [
    {
      id: 'TODO',
      title: t('todo'),
      issues: filteredIssues.filter((issue: any) => issue.status === 'TODO'),
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-800',
      icon: AlertCircle
    },
    {
      id: 'IN_PROGRESS',
      title: t('in_progress'),
      issues: filteredIssues.filter((issue: any) => issue.status === 'IN_PROGRESS'),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      icon: Clock
    },
    {
      id: 'IN_REVIEW',
      title: t('in_review'),
      issues: filteredIssues.filter((issue: any) => issue.status === 'IN_REVIEW'),
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      icon: Eye
    },
    {
      id: 'DONE',
      title: t('done'),
      issues: filteredIssues.filter((issue: any) => issue.status === 'DONE'),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      icon: CheckCircle
    }
  ]

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the source and destination columns
    const sourceColumn = columns.find(col => col.issues.some(issue => issue.id === activeId))
    const destinationColumn = columns.find(col => col.id === overId)

    if (!sourceColumn || !destinationColumn) return

    // If moving to a different column (status change)
    if (sourceColumn.id !== destinationColumn.id) {
      try {
        await updateIssueStatus({
          variables: {
            id: activeId,
            status: destinationColumn.id
          }
        })
        
        toast.success(t('issue_status_updated'))
        refetch()
      } catch (error) {
        toast.error(t('issue_status_update_error'))
      }
    }
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
          projectId: createFormData.projectId
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
        projectId: ''
      })
      refetch()
    } catch (error) {
      toast.error(t('issue_create_error'))
    }
  }

  const handleIssueClick = (issueId: string) => {
    navigate(`/issues/${issueId}`)
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
        <p className="text-red-600">{t('error_loading_issues')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs 
        items={[
          { label: t('kanban_board'), current: true }
        ]} 
        className="mb-2"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('kanban_board')}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('manage_issues_kanban')}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary btn-md w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('create_issue')}
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('search_issues')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">{t('all_projects')}</option>
            {data?.projects?.map((project: any) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={() => {
          // Optional: Add any drag start logic here
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {columns.map((column) => {
            const Icon = column.icon
            return (
              <div key={column.id} className="space-y-4">
                <div className={`p-4 rounded-lg ${column.bgColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Icon className={`h-5 w-5 mr-2 ${column.color}`} />
                      <h3 className={`font-semibold ${column.color}`}>{column.title}</h3>
                    </div>
                    <span className="bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-sm font-medium">
                      {column.issues.length}
                    </span>
                  </div>
                </div>

                <DroppableColumn column={column}>
                  <SortableContext
                    items={column.issues.map(issue => issue.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {column.issues.map((issue) => (
                      <SortableIssueCard
                        key={issue.id}
                        issue={issue}
                        getStatusColor={getStatusColor}
                        getPriorityColor={getPriorityColor}
                        getTypeColor={getTypeColor}
                        getStatusText={getStatusText}
                        getPriorityText={getPriorityText}
                        getTypeText={getTypeText}
                        t={t}
                        i18n={i18n}
                        onIssueClick={handleIssueClick}
                      />
                    ))}
                  </SortableContext>
                </DroppableColumn>
              </div>
            )
          })}
        </div>
      </DndContext>

      {/* Create Issue Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-md relative animate-fade-in">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              onClick={() => setShowCreateModal(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-semibold mb-4">{t('create_issue')}</h3>
            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('title')}</label>
                <input
                  type="text"
                  className="input"
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('description')}</label>
                <textarea
                  className="input"
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('status')}</label>
                  <select
                    className="input"
                    value={createFormData.status}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="TODO">{t('todo')}</option>
                    <option value="IN_PROGRESS">{t('in_progress')}</option>
                    <option value="IN_REVIEW">{t('in_review')}</option>
                    <option value="DONE">{t('done')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('priority')}</label>
                  <select
                    className="input"
                    value={createFormData.priority}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="LOW">{t('low')}</option>
                    <option value="MEDIUM">{t('medium')}</option>
                    <option value="HIGH">{t('high')}</option>
                    <option value="URGENT">{t('urgent')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('type')}</label>
                  <select
                    className="input"
                    value={createFormData.type}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="BUG">{t('bug')}</option>
                    <option value="FEATURE">{t('feature')}</option>
                    <option value="TASK">{t('task')}</option>
                    <option value="ENHANCEMENT">{t('enhancement')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('project')}</label>
                  <select
                    className="input"
                    value={createFormData.projectId}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, projectId: e.target.value }))}
                    required
                  >
                    <option value="">{t('select_project')}</option>
                    {data?.projects?.map((project: any) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-md w-full" disabled={creating}>
                {creating ? t('creating') : t('create')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default KanbanBoardPage 