import AsyncStorage from '@react-native-async-storage/async-storage';
import {Task} from '../types';

const TASKS_KEY = '@taskify/tasks';

export async function loadTasks(): Promise<Task[]> {
  try {
    const raw = await AsyncStorage.getItem(TASKS_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as Task[];
  } catch {
    return [];
  }
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export async function addTask(task: Task): Promise<Task[]> {
  const tasks = await loadTasks();
  const updated = [task, ...tasks];
  await saveTasks(updated);
  return updated;
}

export async function updateTask(
  id: string,
  patch: Partial<Task>,
): Promise<Task[]> {
  const tasks = await loadTasks();
  const updated = tasks.map(t => (t.id === id ? {...t, ...patch} : t));
  await saveTasks(updated);
  return updated;
}

export async function deleteTask(id: string): Promise<Task[]> {
  const tasks = await loadTasks();
  const updated = tasks.filter(t => t.id !== id);
  await saveTasks(updated);
  return updated;
}
