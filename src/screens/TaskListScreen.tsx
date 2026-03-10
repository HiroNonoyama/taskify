import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import {useTasks} from '../hooks/useTasks';
import {
  useNotificationListenerPermission,
  useNotifeeEvents,
} from '../hooks/useNotificationListener';
import {useNotifications} from '../hooks/useNotifications';
import {TaskItem} from '../components/TaskItem';
import {Task, TaskStatus} from '../types';
import {CapturedNotification} from '../storage/notificationStorage';
import {v4 as uuidv4} from 'uuid';

type FilterTab = 'notifications' | 'active' | 'done' | 'archived';

export function TaskListScreen() {
  useNotificationListenerPermission();

  const {tasks, loading: tasksLoading, add, setStatus, remove} = useTasks();
  const {
    notifications,
    loading: notifLoading,
    refresh: refreshNotifications,
    clear: clearNotifications,
  } = useNotifications();
  const [filter, setFilter] = useState<FilterTab>('notifications');

  const handleTaskAdded = useCallback(
    (task: Task) => {
      add(task);
    },
    [add],
  );
  useNotifeeEvents(handleTaskAdded);

  // Refresh notification center when a prompt action adds a task in foreground.
  const handleAddFromNotification = useCallback(
    async (item: CapturedNotification) => {
      const task: Task = {
        id: uuidv4(),
        title: item.notification.title,
        body: item.notification.text,
        status: 'active',
        createdAt: Date.now(),
        notification: item.notification,
      };
      await add(task);
      setFilter('active');
    },
    [add],
  );

  const handleClearNotifications = useCallback(() => {
    Alert.alert('通知センターをクリア', '通知履歴をすべて削除しますか？', [
      {text: 'キャンセル', style: 'cancel'},
      {
        text: '削除',
        style: 'destructive',
        onPress: () => clearNotifications(),
      },
    ]);
  }, [clearNotifications]);

  const visibleTasks = tasks.filter(t => t.status === filter);

  function renderTab(tab: FilterTab, label: string) {
    const active = filter === tab;
    return (
      <TouchableOpacity
        key={tab}
        style={[styles.tab, active && styles.activeTab]}
        onPress={() => {
          setFilter(tab);
          if (tab === 'notifications') {
            refreshNotifications();
          }
        }}>
        <Text style={[styles.tabText, active && styles.activeTabText]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderNotificationItem({item}: {item: CapturedNotification}) {
    const appLabel = item.notification.packageName.split('.').pop() ?? item.notification.packageName;
    const time = new Date(item.receivedAt).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return (
      <View style={styles.notifCard}>
        <View style={styles.notifHeader}>
          <Text style={styles.notifApp}>{appLabel}</Text>
          <Text style={styles.notifTime}>{time}</Text>
        </View>
        <Text style={styles.notifTitle} numberOfLines={1}>
          {item.notification.title}
        </Text>
        {!!item.notification.text && (
          <Text style={styles.notifBody} numberOfLines={2}>
            {item.notification.text}
          </Text>
        )}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAddFromNotification(item)}>
          <Text style={styles.addButtonText}>＋ タスクに追加</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isNotificationTab = filter === 'notifications';
  const loading = isNotificationTab ? notifLoading : tasksLoading;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Taskify</Text>
        <Text style={styles.headerSub}>
          通知センターから明示的にタスクを追加できます
        </Text>
      </View>

      <View style={styles.tabBar}>
        {renderTab('notifications', '通知')}
        {renderTab('active', 'Active')}
        {renderTab('done', 'Done')}
        {renderTab('archived', 'Archived')}
      </View>

      {loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Loading…</Text>
        </View>
      ) : isNotificationTab ? (
        notifications.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              他のアプリから通知が届くとここに表示されます。
            </Text>
          </View>
        ) : (
          <>
            <FlatList<CapturedNotification>
              data={notifications}
              keyExtractor={item => item.id}
              renderItem={renderNotificationItem}
              contentContainerStyle={styles.list}
            />
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearNotifications}>
              <Text style={styles.clearButtonText}>履歴をクリア</Text>
            </TouchableOpacity>
          </>
        )
      ) : visibleTasks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {filter === 'active'
              ? 'タスクがありません。\n通知センターの [タスクに追加] をタップすると追加されます。'
              : `${filter === 'done' ? '完了済み' : 'アーカイブ済み'}タスクはありません。`}
          </Text>
        </View>
      ) : (
        <FlatList<Task>
          data={visibleTasks}
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
    fontSize: 12,
    color: '#777',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#111',
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
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
  // Notification center card
  notifCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifApp: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  notifTime: {
    fontSize: 11,
    color: '#bbb',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
  },
  notifBody: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    marginBottom: 8,
  },
  addButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#ff3b30',
  },
});
