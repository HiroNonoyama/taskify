import {useState, useEffect, useCallback} from 'react';
import {Task, TaskStatus} from '../types';
import {
  loadTasks,
  addTask,
  updateTask,
  deleteTask,
} from '../storage/taskStorage';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks().then(loaded => {
      setTasks(loaded);
      setLoading(false);
    });
  }, []);

  const add = useCallback(async (task: Task) => {
    const updated = await addTask(task);
    setTasks(updated);
  }, []);

  const setStatus = useCallback(
    async (id: string, status: TaskStatus) => {
      const updated = await updateTask(id, {status});
      setTasks(updated);
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    const updated = await deleteTask(id);
    setTasks(updated);
  }, []);

  return {tasks, loading, add, setStatus, remove};
}
