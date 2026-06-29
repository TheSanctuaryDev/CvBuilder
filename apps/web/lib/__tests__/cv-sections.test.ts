// apps/web/lib/__tests__/cv-sections.test.ts
import { describe, it, expect } from 'vitest'
import { cvDataToSections, sectionsToCvData } from '../cv-sections'
import type { CvData } from '@/types'

const baseCvData: CvData = {
  fullName: 'Jean Dupont',
  emails: ['jean@test.com'],
  phones: [{ indicatif: '+229', number: '97000000' }],
  fieldOfActivity: 'Développeur Full Stack',
  summary: 'Expert React et .NET',
  experience: ['Développeur chez Acme (2022-2024)'],
  formation: ['Master Informatique — UAC (2020)'],
  skills: ['React', 'TypeScript', '.NET'],
  languages: 'Français (natif), Anglais (courant)',
}

describe('cvDataToSections', () => {
  it('crée une section header avec les données personnelles', () => {
    const sections = cvDataToSections(baseCvData)
    const header = sections.find(s => s.type === 'header')
    expect(header).toBeDefined()
    if (header?.type !== 'header') return
    expect(header.fullName).toBe('Jean Dupont')
    expect(header.emails).toEqual(['jean@test.com'])
    expect(header.jobTitle).toBe('Développeur Full Stack')
  })

  it('crée une section summary', () => {
    const sections = cvDataToSections(baseCvData)
    const summary = sections.find(s => s.type === 'summary')
    expect(summary).toBeDefined()
    if (summary?.type !== 'summary') return
    expect(summary.text).toBe('Expert React et .NET')
  })

  it('convertit experience[] strings en ExperienceEntry avec description', () => {
    const sections = cvDataToSections(baseCvData)
    const exp = sections.find(s => s.type === 'experience')
    expect(exp).toBeDefined()
    if (exp?.type !== 'experience') return
    expect(exp.entries).toHaveLength(1)
    expect(exp.entries[0].description).toBe('Développeur chez Acme (2022-2024)')
    expect(exp.entries[0].title).toBe('')
  })

  it('n\'ajoute pas de section summary si data.summary est vide', () => {
    const sections = cvDataToSections({ ...baseCvData, summary: undefined })
    expect(sections.find(s => s.type === 'summary')).toBeUndefined()
  })

  it('assigne des ordres croissants', () => {
    const sections = cvDataToSections(baseCvData)
    const orders = sections.map(s => s.order)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
  })
})

describe('sectionsToCvData', () => {
  it('round-trip : cvData → sections → cvData préserve fullName et emails', () => {
    const sections = cvDataToSections(baseCvData)
    const result = sectionsToCvData(sections)
    expect(result.fullName).toBe('Jean Dupont')
    expect(result.emails).toEqual(['jean@test.com'])
  })

  it('round-trip préserve skills', () => {
    const sections = cvDataToSections(baseCvData)
    const result = sectionsToCvData(sections)
    expect(result.skills).toEqual(['React', 'TypeScript', '.NET'])
  })

  it('concatène les items languages avec virgule', () => {
    const sections = cvDataToSections(baseCvData)
    const result = sectionsToCvData(sections)
    expect(result.languages).toBe('Français (natif), Anglais (courant)')
  })
})
