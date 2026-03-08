import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {Task, TaskStatus} from '../types';
import {useNotificationTap} from '../hooks/useNotificationTap';

interface Props {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({task, onStatusChange, onDelete}: Props) {
  const launchApp = useNotificationTap();

  function handlePress() {
    if (task.notification) {
      launchApp(task.notification);
    }
  }

  function handleLongPress() {
    Alert.alert(task.title, 'What would you like to do?', [
      {
        text: task.status === 'done' ? 'Mark active' : 'Mark done',
        onPress: () =>
          onStatusChange(task.id, task.status === 'done' ? 'active' : 'done'),
      },
      {
        text: 'Archive',
        onPress: () => onStatusChange(task.id, 'archived'),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(task.id),
      },
      {text: 'Cancel', style: 'cancel'},
    ]);
  }

  const isDone = task.status === 'done';
  const isArchived = task.status === 'archived';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isDone && styles.done,
        isArchived && styles.archived,
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}>
      <View style={styles.content}>
        <Text style={[styles.title, isDone && styles.doneText]} numberOfLines={1}>
          {task.title}
        </Text>
        {task.body.length > 0 && (
          <Text style={styles.body} numberOfLines={2}>
            {task.body}
          </Text>
        )}
        {task.notification && (
          <Text style={styles.appLabel}>
            {task.notification.packageName}
          </Text>
        )}
      </View>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>
          {task.status === 'active' ? '●' : task.status === 'done' ? '✓' : '🗄'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  done: {
    opacity: 0.6,
  },
  archived: {
    opacity: 0.4,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  doneText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  body: {
    marginTop: 4,
    fontSize: 13,
    color: '#555',
  },
  appLabel: {
    marginTop: 6,
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
  },
  statusBadge: {
    marginLeft: 12,
  },
  statusText: {
    fontSize: 18,
  },
});
