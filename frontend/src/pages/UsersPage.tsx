import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation } from '@apollo/client'
import { gql } from '@apollo/client'
import { formatDate } from '../utils/dateUtils'
import { useAuthStore } from '../store/auth'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { usePermissions } from '../hooks/usePermissions'

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      username
      email
      name
      role
      isActive
      createdAt
      updatedAt
    }
  }
`

const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $username: String, $email: String, $name: String, $role: UserRole, $isActive: Boolean) {
    updateUser(id: $id, username: $username, email: $email, name: $name, role: $role, isActive: $isActive) {
      id
      username
      email
      name
      role
      isActive
      updatedAt
    }
  }
`

const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`

const UsersPage = () => {
  const { t, i18n } = useTranslation()
  const { user: currentUser } = useAuthStore()
  const permissions = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const { data: usersData, loading: usersLoading, error: usersError, refetch } = useQuery(GET_USERS)
  const [updateUser, { loading: updateLoading }] = useMutation(UPDATE_USER)
  const [deleteUser, { loading: deleteLoading }] = useMutation(DELETE_USER)

  const filteredUsers = usersData?.users?.filter((user: any) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'MANAGER': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'DEVELOPER': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'USER': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN': return t('admin')
      case 'MANAGER': return t('manager')
      case 'DEVELOPER': return t('developer')
      case 'USER': return t('user')
      default: return role
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }

  const handleEditUser = (user: any) => {
    setEditingUser({ ...user })
  }

  const handleSaveUser = async () => {
    if (!editingUser) return

    try {
      await updateUser({
        variables: {
          id: editingUser.id,
          username: editingUser.username,
          email: editingUser.email,
          name: editingUser.name,
          role: editingUser.role,
          isActive: editingUser.isActive
        }
      })
      setEditingUser(null)
      refetch()
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser({ variables: { id: userId } })
      setShowDeleteConfirm(null)
      refetch()
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const canEditUser = (user: any) => {
    // Admins can edit anyone, users can only edit themselves
    return permissions.isAdmin || currentUser?.id === user.id
  }

  const canDeleteUser = (user: any) => {
    // Only admins can delete users, and they can't delete themselves
    return permissions.isAdmin && currentUser?.id !== user.id
  }

  // Check if user has permission to view users page
  if (!permissions.canViewAllUsers) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Breadcrumbs 
          items={[
            { label: t('users'), current: true }
          ]} 
          className="mb-2"
        />
        <div className="card">
          <div className="text-center py-8">
            <p className="text-red-500 dark:text-red-400">{t('no_permission_to_view_users')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (usersError) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('users')}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('manage_users')}</p>
        </div>
        
        <div className="card">
          <p className="text-red-500 dark:text-red-400">{t('error_loading_users')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Breadcrumbs 
        items={[
          { label: t('users'), current: true }
        ]} 
        className="mb-2"
      />
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('users')}</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('manage_users')}</p>
      </div>

      {/* Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('search_users')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="card">
        {usersLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">{t('no_users_found')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{t('username')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{t('email')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{t('name')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{t('role')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{t('status')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{t('created')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user: any) => (
                  <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4">
                      {editingUser?.id === user.id ? (
                        <input
                          type="text"
                          value={editingUser.username}
                          onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      ) : (
                        <span className="text-gray-900 dark:text-gray-100">{user.username}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingUser?.id === user.id ? (
                        <input
                          type="email"
                          value={editingUser.email}
                          onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      ) : (
                        <span className="text-gray-900 dark:text-gray-100">{user.email}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingUser?.id === user.id ? (
                        <input
                          type="text"
                          value={editingUser.name || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      ) : (
                        <span className="text-gray-900 dark:text-gray-100">{user.name || '-'}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingUser?.id === user.id ? (
                        <select
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                          <option value="USER">{t('user')}</option>
                          <option value="DEVELOPER">{t('developer')}</option>
                          <option value="MANAGER">{t('manager')}</option>
                          <option value="ADMIN">{t('admin')}</option>
                        </select>
                      ) : (
                                                 <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                           {getRoleText(user.role)}
                         </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingUser?.id === user.id ? (
                        <select
                          value={editingUser.isActive.toString()}
                          onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.value === 'true' })}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                          <option value="true">{t('active')}</option>
                          <option value="false">{t('inactive')}</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.isActive)}`}>
                          {user.isActive ? t('active') : t('inactive')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(user.createdAt, i18n.language === 'de' ? 'de-DE' : 'en-US')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {editingUser?.id === user.id ? (
                          <>
                            <button
                              onClick={handleSaveUser}
                              disabled={updateLoading}
                              className="px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors disabled:opacity-50"
                            >
                              {updateLoading ? t('saving') : t('save')}
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            >
                              {t('cancel')}
                            </button>
                          </>
                        ) : (
                          <>
                            {canEditUser(user) && (
                              <button
                                onClick={() => handleEditUser(user)}
                                className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                              >
                                {t('edit')}
                              </button>
                            )}
                            {canDeleteUser(user) && (
                              <button
                                onClick={() => setShowDeleteConfirm(user.id)}
                                className="px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                              >
                                {t('delete')}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('confirm_delete_user')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('delete_user_warning')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteLoading ? t('deleting') : t('delete')}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersPage 