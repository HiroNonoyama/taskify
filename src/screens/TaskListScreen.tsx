import React, {useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {useTasks} from '../hooks/useTasks';
import {useNotificationListenerPermission} from '../hooks/useNotificationListener';
import {TaskItem} from '../components/TaskItem';
import {Task, TaskStatus} from '../types';

type FilterTab = 'active' | 'done' | 'archived';

export function TaskListScreen() {
  useNotificationListenerPermission();

  const {tasks, loading, setStatus, remove} = useTasks();
  const [filter, setFilter] = useState<FilterTab>('active');

  const visible = tasks.filter(t => t.status === filter);

  function renderTab(tab: FilterTab, label: string) {
    const active = filter === tab;
    return (
      <TouchableOpacity
        key={tab}
        style={[styles.tab, active && styles.activeTab]}
        onPress={() => setFilter(tab)}>
        <Text style={[styles.tabText, active && styles.activeTabText]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Taskify</Text>
        <Text style={styles.headerSub}>
          Tap a notification-task to open the app
        </Text>
      </View>

      <View style={styles.tabBar}>
        {renderTab('active', 'Active')}
        {renderTab('done', 'Done')}
        {renderTab('archived', 'Archived')}
      </View>

      {loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Loading…</Text>
        </View>
      ) : visible.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {filter === 'active'
              ? 'No active tasks.\nNotifications will appear here automatically.'
              : `No ${filter} tasks.`}
          </Text>
        </View>
      ) : (
        <FlatList<Task>
          data={visible}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <TaskItem
              task={item}
              onStatusChange={(id: string, status: TaskStatus) =>
                setStatus(id, status)
              }
              onDelete={remove}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  headerSub: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    color: '#777',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#111',
    fontWeight: '700',
  },
  list: {
    paddingBottom: 24,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
  },
});
