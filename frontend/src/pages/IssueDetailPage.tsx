import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { gql } from '@apollo/client'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Edit, Trash2, Plus, X, CheckCircle } from 'lucide-react'
import { formatDate } from '../utils/dateUtils'
import toast from 'react-hot-toast'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { useIssuePermissions } from '../hooks/usePermissions'

const GET_ISSUE_DETAIL = gql`
  query GetIssueDetail($id: ID!) {
    issue(id: $id) {
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
      comments {
        id
        content
        createdAt
        author {
          id
          username
          name
        }
      }
    }
  }
`

const UPDATE_ISSUE = gql`
  mutation UpdateIssue($id: ID!, $title: String, $description: String, $status: IssueStatus, $priority: IssuePriority, $type: IssueType, $assigneeId: ID) {
    updateIssue(id: $id, title: $title, description: $description, status: $status, priority: $priority, type: $type, assigneeId: $assigneeId) {
      id
      title
      description
      status
      priority
      type
      assignee {
        id
        username
        name
      }
    }
  }
`

const DELETE_ISSUE = gql`
  mutation DeleteIssue($id: ID!) {
    deleteIssue(id: $id)
  }
`

const ADD_COMMENT = gql`
  mutation CreateComment($issueId: ID!, $content: String!) {
    createComment(issueId: $issueId, content: $content) {
      id
      content
      createdAt
      author {
        id
        username
        name
      }
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

const IssueDetailPage = () => {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    type: '',
    assigneeId: ''
  })
  const [newComment, setNewComment] = useState('')

  const { data, loading, error, refetch } = useQuery(GET_ISSUE_DETAIL, {
    variables: { id },
    skip: !id,
  })

  // Hook must always be called, even if data is not yet loaded
  const issuePermissions = useIssuePermissions(data?.issue?.reporter?.id, data?.issue?.assignee?.id)

  const { data: usersData } = useQuery(GET_USERS, {
    skip: !issuePermissions?.canAssignIssue
  })
  
  const [updateIssue, { loading: updating }] = useMutation(UPDATE_ISSUE)
  const [deleteIssue, { loading: deleting }] = useMutation(DELETE_ISSUE)
  const [createComment, { loading: addingComment }] = useMutation(ADD_COMMENT)

  // Helper functions for colors and text
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

  const handleEditIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await updateIssue({
        variables: {
          id,
          title: editFormData.title || undefined,
          description: editFormData.description || undefined,
          status: editFormData.status || undefined,
          priority: editFormData.priority || undefined,
          type: editFormData.type || undefined,
          assigneeId: editFormData.assigneeId || undefined
        }
      })
      
      toast.success(t('issue_updated_success'))
      setShowEditModal(false)
      refetch()
    } catch (error) {
      toast.error(t('issue_update_error'))
    }
  }

  const handleDeleteIssue = async () => {
    try {
      await deleteIssue({
        variables: { id }
      })
      
      toast.success(t('issue_deleted_success'))
      navigate('/issues')
    } catch (error) {
      toast.error(t('issue_delete_error'))
    }
  }

  const handleCloseIssue = async () => {
    try {
      await updateIssue({
        variables: {
          id,
          status: 'DONE'
        }
      })
      
      toast.success(t('issue_closed_success'))
      refetch()
    } catch (error) {
      toast.error(t('issue_close_error'))
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newComment.trim()) {
      toast.error(t('please_enter_comment'))
      return
    }

    try {
      await createComment({
        variables: {
          issueId: id,
          content: newComment.trim()
        }
      })
      
      toast.success(t('comment_added_success'))
      setShowCommentModal(false)
      setNewComment('')
      refetch()
    } catch (error) {
      toast.error(t('comment_add_error'))
    }
  }

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error || !data?.issue) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{t('error_loading_issue')}</p>
      </div>
    )
  }

  const issue = data.issue

  return (
    <div className="space-y-6">
      <Breadcrumbs 
        items={[
          { label: t('issues'), href: '/issues' },
          { label: issue.title, current: true }
        ]} 
        className="mb-2"
      />
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/issues')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            title={t('back_to_issues')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate('/kanban')}
            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            title={t('back_to_kanban')}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('kanban_board')}
          </button>
        </div>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{issue.title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t('project')}: {issue.project.name} • {t('created')}: {formatDate(issue.createdAt, i18n.language === 'de' ? 'de-DE' : 'en-US')}
          </p>
        </div>
        <div className="flex gap-2">
          {issuePermissions?.canEditIssue && (
            <button
              onClick={() => {
                setEditFormData({
                  title: issue.title,
                  description: issue.description || '',
                  status: issue.status,
                  priority: issue.priority,
                  type: issue.type,
                  assigneeId: issue.assignee?.id || ''
                })
                setShowEditModal(true)
              }}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              {t('edit')}
            </button>
          )}
          {issuePermissions?.canCloseIssue && issue.status !== 'DONE' && (
            <button
              onClick={() => setShowCloseModal(true)}
              className="px-3 py-2 text-sm font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {t('close')}
            </button>
          )}
          {issuePermissions?.canDeleteIssue && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {t('delete')}
            </button>
          )}
        </div>
      </div>

      {/* Issue Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">{t('description')}</h2>
            {issue.description ? (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{issue.description}</p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">{t('no_description')}</p>
            )}
          </div>

          {/* Comments */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t('comments')}</h2>
              {issuePermissions?.canEditIssue && (
                <button
                  onClick={() => setShowCommentModal(true)}
                  className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {t('add_comment')}
                </button>
              )}
            </div>
            
            {issue.comments.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 italic">{t('no_comments')}</p>
            ) : (
              <div className="space-y-4">
                {issue.comments.map((comment: any) => (
                  <div key={comment.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {comment.author.name || comment.author.username}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(comment.createdAt, i18n.language === 'de' ? 'de-DE' : 'en-US')}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status, Priority, Type */}
          <div className="card">
            <h3 className="font-semibold mb-4">{t('details')}</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('status')}:</span>
                <div className="mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(issue.status)}`}>
                    {getStatusText(issue.status)}
                  </span>
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('priority')}:</span>
                <div className="mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(issue.priority)}`}>
                    {getPriorityText(issue.priority)}
                  </span>
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('type')}:</span>
                <div className="mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(issue.type)}`}>
                    {getTypeText(issue.type)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* People */}
          <div className="card">
            <h3 className="font-semibold mb-4">{t('people')}</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('reporter')}:</span>
                <p className="font-medium">{issue.reporter.name || issue.reporter.username}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('assignee')}:</span>
                <p className="font-medium">
                  {issue.assignee ? (issue.assignee.name || issue.assignee.username) : t('unassigned')}
                </p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="card">
            <h3 className="font-semibold mb-4">{t('dates')}</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('created')}:</span>
                <p className="font-medium">{formatDate(issue.createdAt, i18n.language === 'de' ? 'de-DE' : 'en-US')}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('updated')}:</span>
                <p className="font-medium">{formatDate(issue.updatedAt, i18n.language === 'de' ? 'de-DE' : 'en-US')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('edit_issue')}</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditIssue} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('title')}
                </label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => handleEditFormChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('description')}
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => handleEditFormChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('status')}
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => handleEditFormChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">{t('keep_current')}</option>
                    <option value="TODO">{t('todo')}</option>
                    <option value="IN_PROGRESS">{t('in_progress')}</option>
                    <option value="IN_REVIEW">{t('in_review')}</option>
                    <option value="DONE">{t('done')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('priority')}
                  </label>
                  <select
                    value={editFormData.priority}
                    onChange={(e) => handleEditFormChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">{t('keep_current')}</option>
                    <option value="LOW">{t('low')}</option>
                    <option value="MEDIUM">{t('medium')}</option>
                    <option value="HIGH">{t('high')}</option>
                    <option value="URGENT">{t('urgent')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('type')}
                  </label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => handleEditFormChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">{t('keep_current')}</option>
                    <option value="BUG">{t('bug')}</option>
                    <option value="FEATURE">{t('feature')}</option>
                    <option value="TASK">{t('task')}</option>
                    <option value="ENHANCEMENT">{t('enhancement')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('assignee')}
                </label>
                <select
                  value={editFormData.assigneeId}
                  onChange={(e) => handleEditFormChange('assigneeId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">{t('unassigned')}</option>
                  {usersData?.users?.map((user: any) => (
                    <option key={user.id} value={user.id}>{user.name || user.username}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {updating ? t('updating') : t('save_changes')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('delete_issue')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t('delete_issue_confirmation')}</p>
            
            <div className="flex gap-3">
              <button
                onClick={handleDeleteIssue}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? t('deleting') : t('delete')}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Confirmation Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('close_issue')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t('close_issue_confirmation')}</p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleCloseIssue()
                  setShowCloseModal(false)
                }}
                disabled={updating}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {updating ? t('closing') : t('close')}
              </button>
              <button
                onClick={() => setShowCloseModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('add_comment')}</h2>
              <button
                onClick={() => setShowCommentModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddComment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('comment')}
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder={t('comment_placeholder')}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={addingComment}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {addingComment ? t('adding') : t('add_comment')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCommentModal(false)}
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

export default IssueDetailPage 