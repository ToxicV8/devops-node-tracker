import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { gql } from '@apollo/client'
import { Link } from 'react-router-dom'
import { Plus, FolderOpen, Users, Calendar } from 'lucide-react'
import { Project } from '@/types'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/utils/dateUtils'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { usePermissions } from '@/hooks/usePermissions'

const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
      name
      description
      createdAt
      issues {
        id
        status
      }
      members {
        id
        username
      }
    }
  }
`

const CREATE_PROJECT = gql`
  mutation CreateProject($name: String!, $description: String) {
    createProject(name: $name, description: $description) {
      id
      name
      description
    }
  }
`

const ProjectsPage = () => {
  const { t, i18n } = useTranslation()
  const permissions = usePermissions()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const { data, loading, error, refetch } = useQuery<{ projects: Project[] }>(GET_PROJECTS)
  const [createProject, { loading: creating }] = useMutation(CREATE_PROJECT)

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createProject({
        variables: formData,
      })
      
      toast.success(t('project_created_success'))
      setShowCreateModal(false)
      setFormData({ name: '', description: '' })
      refetch()
    } catch (error) {
      toast.error(t('project_create_error'))
    }
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
        <p className="text-red-600">{t('error_loading_projects')}</p>
      </div>
    )
  }

  const projects = data?.projects || []

  return (
    <div className="space-y-4 sm:space-y-6">
      <Breadcrumbs 
        items={[
          { label: t('projects'), current: true }
        ]} 
        className="mb-2"
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('projects')}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('manage_projects')}</p>
        </div>
        {permissions.canCreateProjects && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary btn-md w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('create_project')}
          </button>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {projects.map((project) => {
          const todoIssues = project.issues?.filter(issue => issue.status === 'TODO') || []
          const inProgressIssues = project.issues?.filter(issue => issue.status === 'IN_PROGRESS') || []
          const doneIssues = project.issues?.filter(issue => issue.status === 'DONE') || []
          
          return (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center flex-1 min-w-0">
                  <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 mr-2 sm:mr-3 flex-shrink-0" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{project.name}</h3>
                </div>
              </div>
              
              {project.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{project.description}</p>
              )}
              
              <div className="space-y-3">
                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-2" />
                  {project.members?.length || 0} {t('members')}
                </div>
                
                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(project.createdAt, i18n.language === 'de' ? 'de-DE' : 'en-US')}
                </div>
                
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    {todoIssues.length} {t('todo')}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                    {inProgressIssues.length} {t('in_progress')}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    {doneIssues.length} {t('done')}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('create_project')}</h3>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('project_name')}
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  className="input mt-1"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('project_name')}
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('description')}
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className="input mt-1"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('description')}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary btn-md flex-1"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-md flex-1"
                  disabled={creating}
                >
                  {creating ? t('creating') : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectsPage 