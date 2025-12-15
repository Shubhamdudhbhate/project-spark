// src/services/caseService.ts
import { v4 as uuidv4 } from 'uuid';
import { CaseFile, CaseStatus } from '@/types/case';

const STORAGE_KEY = 'nyaysutra-cases';

/**
 * Creates a new case and stores it in localStorage
 * @param data Case data without auto-generated fields
 * @returns The created case with all required fields
 * @throws Error if case creation fails
 */
export const createCase = async (
  data: Omit<CaseFile, 'id' | 'createdAt' | 'updatedAt' | 'evidenceCount' | 'status'>
): Promise<CaseFile> => {
  try {
    // Validate required fields
    if (!data.caseNumber || !data.title || !data.courtName) {
      throw new Error('Missing required case fields');
    }

    const newCase: CaseFile = {
      ...data,
      id: `case-${uuidv4()}`,
      evidenceCount: 0,
      status: 'open' as CaseStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Get existing cases
    const cases = await getCases();
    
    // Check for duplicate case number
    if (cases.some(c => c.caseNumber === data.caseNumber)) {
      throw new Error(`Case with number ${data.caseNumber} already exists`);
    }

    // Save to localStorage
    try {
      const updatedCases = [...cases, newCase];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCases));
    } catch (error) {
      console.error('Failed to save case to localStorage:', error);
      throw new Error('Failed to save case');
    }

    return newCase;
  } catch (error) {
    console.error('Error creating case:', error);
    throw error;
  }
};

/**
 * Retrieves all cases from localStorage
 * @returns Array of cases
 */
export const getCases = async (): Promise<CaseFile[]> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error retrieving cases:', error);
    return [];
  }
};

/**
 * Retrieves a single case by ID
 * @param id Case ID to retrieve
 * @returns The found case or undefined if not found
 */
export const getCaseById = async (id: string): Promise<CaseFile | undefined> => {
  if (!id) {
    throw new Error('Case ID is required');
  }
  
  try {
    const cases = await getCases();
    return cases.find((c: CaseFile) => c.id === id);
  } catch (error) {
    console.error(`Error retrieving case ${id}:`, error);
    throw error;
  }
};

/**
 * Updates an existing case
 * @param id Case ID to update
 * @param updates Partial case data to update
 * @returns The updated case
 */
export const updateCase = async (
  id: string,
  updates: Partial<Omit<CaseFile, 'id' | 'createdAt' | 'evidenceCount'>>
): Promise<CaseFile> => {
  try {
    const cases = await getCases();
    const index = cases.findIndex(c => c.id === id);
    
    if (index === -1) {
      throw new Error(`Case with ID ${id} not found`);
    }

    const updatedCase = {
      ...cases[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Check for duplicate case number
    if (updates.caseNumber && cases.some((c, i) => 
      i !== index && c.caseNumber === updates.caseNumber
    )) {
      throw new Error(`Case with number ${updates.caseNumber} already exists`);
    }

    cases[index] = updatedCase;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    
    return updatedCase;
  } catch (error) {
    console.error(`Error updating case ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a case by ID
 * @param id Case ID to delete
 * @returns true if deletion was successful
 */
export const deleteCase = async (id: string): Promise<boolean> => {
  try {
    const cases = await getCases();
    const filteredCases = cases.filter(c => c.id !== id);
    
    if (cases.length === filteredCases.length) {
      return false; // No case was deleted
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredCases));
    return true;
  } catch (error) {
    console.error(`Error deleting case ${id}:`, error);
    throw error;
  }
};