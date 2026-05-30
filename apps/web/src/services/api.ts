// All data access goes through Appwrite directly.
// This file only provides a helper to call Appwrite Functions.
import { functions } from '@/lib/appwrite';
import { ExecutionMethod } from 'appwrite';

export async function invokeFunction<T = any>(functionId: string, payload?: object): Promise<T> {
  const execution = await functions.createExecution(
    functionId,
    payload ? JSON.stringify(payload) : undefined,
    false,
    '/',
    ExecutionMethod.POST,
    { 'Content-Type': 'application/json' },
  );
  if (execution.responseStatusCode >= 400) {
    let errBody: any = {};
    try {
      errBody = JSON.parse(execution.responseBody);
    } catch {}
    throw new Error(errBody.error ?? `Function ${functionId} failed with status ${execution.responseStatusCode}`);
  }
  return JSON.parse(execution.responseBody) as T;
}
