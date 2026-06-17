export type Template = {
  id: string
  name: string
  templateKey: string
  isPremium: boolean
  previewUrl: string | null
}

export type Cv = {
  id: string
  title: string
  templateKey: string
  isPremium: boolean
  isPaid: boolean
  currentVersion: number
  createdAt: string
  updatedAt: string
}

export type CvVersion = {
  id: string
  cvId: string
  versionNum: number
  cvData: CvData
  htmlContent: string | null
  photoPath: string | null
  createdAt: string
}

export type CvData = {
  fullName: string
  email?: string
  phone?: string
  address?: string
  linkedIn?: string
  gitHub?: string
  summary?: string
  fieldOfActivity?: string
  experience?: string[]
  formation?: string[]
  skills?: string[]
  languages?: string
  contestsWon?: string[]
  references?: string[]
  interests?: string[]
  selectedTemplate?: string
  isPremium?: boolean
}
