import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const scale = width / 375;

const normalize = (size) => {
  return Math.round(size * scale);
};

export default function TaskListScreen() {
  const { tasks, addTask, updateTask, deleteTask, setCurrentTask } = useApp();
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState('all');
  const navigation = useNavigation();

  const handleAddTask = () => {
    if (newTask.trim()) {
      addTask({
        title: newTask,
        completed: false,
        timeSpent: 0,
        sessions: 0,
      });
      setNewTask('');
    }
  };

  const startPomodoro = (task) => {
    setCurrentTask(task);
    navigation.navigate('Pomodoro');
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const completionRate = tasks.length > 0 
    ? (tasks.filter(t => t.completed).length / tasks.length) * 100 
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Tasks</Text>
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Completion Rate</Text>
            <Text style={styles.statsValue}>{completionRate.toFixed(0)}%</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All ({tasks.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
              Active ({tasks.filter(t => !t.completed).length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
            onPress={() => setFilter('completed')}
          >
            <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
              Done ({tasks.filter(t => t.completed).length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add Task Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newTask}
            onChangeText={setNewTask}
            onSubmitEditing={handleAddTask}
            placeholder="Add a new task..."
            placeholderTextColor="rgba(255,255,255,0.5)"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Task List */}
        <View style={styles.taskList}>
          {filteredTasks.map(task => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <TouchableOpacity
                  style={[styles.checkbox, task.completed && styles.checkboxCompleted]}
                  onPress={() => updateTask(task.id, { completed: !task.completed })}
                >
                  {task.completed && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                <View style={styles.taskInfo}>
                  <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                    {task.title}
                  </Text>
                  <Text style={styles.taskMeta}>
                    {task.sessions} sessions · {Math.floor(task.timeSpent / 60)}m
                  </Text>
                </View>
                {!task.completed && (
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => startPomodoro(task)}
                  >
                    <Text style={styles.playButtonText}>▶</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteTask(task.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollContent: {
    padding: normalize(20),
    paddingTop: normalize(50),
  },
  header: {
    marginBottom: normalize(20),
  },
  headerTitle: {
    fontSize: normalize(32),
    fontWeight: 'bold',
    color: 'white',
    marginBottom: normalize(15),
  },
  statsCard: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    padding: normalize(15),
    borderRadius: normalize(15),
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  statsLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(12),
  },
  statsValue: {
    color: '#60a5fa',
    fontSize: normalize(28),
    fontWeight: 'bold',
    marginTop: normalize(5),
  },
  filterContainer: {
    flexDirection: 'row',
    gap: normalize(10),
    marginBottom: normalize(20),
  },
  filterTab: {
    flex: 1,
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(15),
    borderRadius: normalize(12),
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#60a5fa',
  },
  filterText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(13),
    fontWeight: '600',
  },
  filterTextActive: {
    color: 'white',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: normalize(10),
    marginBottom: normalize(20),
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    paddingHorizontal: normalize(15),
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
    fontSize: normalize(15),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  addButton: {
    backgroundColor: '#60a5fa',
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: normalize(24),
    fontWeight: 'bold',
  },
  taskList: {
    gap: normalize(12),
  },
  taskCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: normalize(15),
    borderRadius: normalize(15),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
    marginBottom: normalize(10),
  },
  checkbox: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(12),
    borderWidth: 2,
    borderColor: '#60a5fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#60a5fa',
  },
  checkmark: {
    color: 'white',
    fontSize: normalize(14),
    fontWeight: 'bold',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    color: 'white',
    fontSize: normalize(16),
    fontWeight: '600',
    marginBottom: normalize(4),
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  taskMeta: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(12),
  },
  playButton: {
    backgroundColor: '#10b981',
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    color: 'white',
    fontSize: normalize(16),
    marginLeft: normalize(2),
  },
  deleteButton: {
    alignSelf: 'flex-start',
    paddingVertical: normalize(6),
    paddingHorizontal: normalize(12),
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: normalize(8),
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: normalize(12),
    fontWeight: '600',
  },
});