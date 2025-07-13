export interface User {
  id: string
  username: string
  email: string
  name?: string
  role: UserRole
  isActive: boolean
  issues?: Issue[]
  assignedIssues?: Issue[]
  projects?: Project[]
  projectMemberships?: ProjectMember[]
  createdAt: string
  updatedAt: string
}

export interface AuthPayload {
  token: string
  user: User
}

export interface Project {
  id: string
  name: string
  description?: string
  ownerId?: string
  issues?: Issue[]
  members?: User[]
  projectMembers?: ProjectMember[]
  createdAt: string
  updatedAt: string
}

export interface ProjectMember {
  id: string
  user: User
  project: Project
  projectRole: ProjectRole
  joinedAt: string
}

export interface Issue {
  id: string
  title: string
  description?: string
  status: IssueStatus
  priority: IssuePriority
  type: IssueType
  project: Project
  reporter: User
  assignee?: User
  comments?: Comment[]
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  content: string
  author: User
  issue: Issue
  createdAt: string
  updatedAt: string
}

export enum IssueStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE'
}

export enum IssuePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum IssueType {
  BUG = 'BUG',
  FEATURE = 'FEATURE',
  TASK = 'TASK',
  ENHANCEMENT = 'ENHANCEMENT'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  DEVELOPER = 'DEVELOPER',
  USER = 'USER'
}

export enum ProjectRole {
  OWNER = 'OWNER',
  MAINTAINER = 'MAINTAINER',
  DEVELOPER = 'DEVELOPER',
  REPORTER = 'REPORTER',
  MEMBER = 'MEMBER'
} 