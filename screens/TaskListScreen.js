// screens/TaskListScreen.js
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
  Modal,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const scale = width / 375;

const normalize = (size) => {
  return Math.round(size * scale);
};

const TaskItem = ({ 
  task, 
  level = 0, 
  onToggle, 
  onDelete, 
  onStartPomodoro, 
  onAddSubtask,
  expandedTasks,
  toggleExpanded 
}) => {
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const isExpanded = expandedTasks[task.id];
  const indent = level * normalize(20);
  const canAddSubtask = level < 2; // Only allow 2 levels deep (0 and 1)
  const isMainTask = level === 0; // Only main tasks (level 0) get play button

  return (
    <View>
      <View style={[styles.taskCard, { marginLeft: indent }]}>
        <View style={styles.taskHeader}>
          {hasSubtasks && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => toggleExpanded(task.id)}
            >
              <Text style={styles.expandIcon}>
                {isExpanded ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.checkbox, 
              task.completed && styles.checkboxCompleted,
              !hasSubtasks && styles.checkboxNoExpand
            ]}
            onPress={() => onToggle(task.id, !task.completed)}
          >
            {task.completed && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          <View style={styles.taskInfo}>
            <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
              {task.title}
            </Text>
            <View style={styles.taskMetaRow}>
              <Text style={styles.taskMeta}>
                {task.sessions || 0} sessions · {Math.floor((task.timeSpent || 0) / 60)}m
              </Text>
              {hasSubtasks && (
                <Text style={styles.subtaskCount}>
                  {task.subtasks.length} subtask{task.subtasks.length !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </View>

          {/* Only show play button for main tasks (level 0) */}
          {isMainTask && !task.completed && (
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => onStartPomodoro(task)}
            >
              <Text style={styles.playButtonText}>▶</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.taskActions}>
          {/* Only show Add Subtask if level < 2 */}
          {canAddSubtask && (
            <TouchableOpacity
              style={styles.addSubtaskButton}
              onPress={() => onAddSubtask(task.id)}
            >
              <Text style={styles.addSubtaskText}>+ Add Subtask</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.deleteButton, canAddSubtask && styles.deleteButtonWithSubtask]}
            onPress={() => onDelete(task.id)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Render subtasks */}
      {hasSubtasks && isExpanded && (
        <View style={styles.subtasksContainer}>
          {task.subtasks.map(subtask => (
            <TaskItem
              key={subtask.id}
              task={subtask}
              level={level + 1}
              onToggle={onToggle}
              onDelete={onDelete}
              onStartPomodoro={onStartPomodoro}
              onAddSubtask={onAddSubtask}
              expandedTasks={expandedTasks}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default function TaskListScreen() {
  const { tasks, addTask, addSubtask, updateTask, deleteTask, setCurrentTask } = useApp();
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [subtaskText, setSubtaskText] = useState('');
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState({});
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

  const handleAddSubtask = (parentId) => {
    setSelectedParentId(parentId);
    setSubtaskText('');
    setModalVisible(true);
  };

  const saveSubtask = () => {
    if (subtaskText.trim() && selectedParentId) {
      addSubtask(selectedParentId, {
        title: subtaskText,
        completed: false,
        timeSpent: 0,
        sessions: 0,
      });
      setModalVisible(false);
      setSubtaskText('');
      setSelectedParentId(null);
      
      // Auto-expand parent task
      setExpandedTasks(prev => ({ ...prev, [selectedParentId]: true }));
    }
  };

  const toggleExpanded = (taskId) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const startPomodoro = (task) => {
    setCurrentTask(task);
    navigation.navigate('Pomodoro');
  };

  const getAllTasks = (taskList) => {
    let allTasks = [];
    taskList.forEach(task => {
      allTasks.push(task);
      if (task.subtasks && task.subtasks.length > 0) {
        allTasks = allTasks.concat(getAllTasks(task.subtasks));
      }
    });
    return allTasks;
  };

  const allTasks = getAllTasks(tasks);
  
  const filteredTasks = tasks.filter(t => {
    const taskAndSubtasks = getAllTasks([t]);
    if (filter === 'active') return taskAndSubtasks.some(task => !task.completed);
    if (filter === 'completed') return taskAndSubtasks.every(task => task.completed);
    return true;
  });

  const completionRate = allTasks.length > 0 
    ? (allTasks.filter(t => t.completed).length / allTasks.length) * 100 
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
            <Text style={styles.statsSubtext}>
              {allTasks.filter(t => t.completed).length}/{allTasks.length} tasks
            </Text>
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
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
            onPress={() => setFilter('completed')}
          >
            <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
              Done
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
            <TaskItem
              key={task.id}
              task={task}
              level={0}
              onToggle={updateTask}
              onDelete={deleteTask}
              onStartPomodoro={startPomodoro}
              onAddSubtask={handleAddSubtask}
              expandedTasks={expandedTasks}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </View>

        {filteredTasks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No tasks found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' 
                ? 'Add a task to get started' 
                : `No ${filter} tasks`}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Subtask Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Subtask</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              value={subtaskText}
              onChangeText={setSubtaskText}
              onSubmitEditing={saveSubtask}
              placeholder="Enter subtask..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              autoFocus
            />

            <TouchableOpacity style={styles.saveButton} onPress={saveSubtask}>
              <Text style={styles.saveButtonText}>Add Subtask</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  statsSubtext: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(11),
    marginTop: normalize(4),
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
  expandButton: {
    width: normalize(24),
    height: normalize(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandIcon: {
    color: '#60a5fa',
    fontSize: normalize(12),
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
  checkboxNoExpand: {
    marginLeft: normalize(36),
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
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(10),
  },
  taskMeta: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(12),
  },
  subtaskCount: {
    color: '#60a5fa',
    fontSize: normalize(11),
    fontWeight: '600',
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
  taskActions: {
    flexDirection: 'row',
    gap: normalize(10),
  },
  addSubtaskButton: {
    flex: 1,
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(12),
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderRadius: normalize(8),
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  addSubtaskText: {
    color: '#60a5fa',
    fontSize: normalize(12),
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(12),
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: normalize(8),
  },
  deleteButtonWithSubtask: {
    flex: 0,
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: normalize(12),
    fontWeight: '600',
  },
  subtasksContainer: {
    marginTop: normalize(8),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(60),
  },
  emptyIcon: {
    fontSize: normalize(64),
    marginBottom: normalize(15),
  },
  emptyText: {
    color: 'white',
    fontSize: normalize(20),
    fontWeight: '600',
    marginBottom: normalize(8),
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(14),
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: normalize(20),
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderRadius: normalize(20),
    padding: normalize(25),
    width: '100%',
    maxWidth: normalize(400),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(20),
  },
  modalTitle: {
    color: 'white',
    fontSize: normalize(20),
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#ef4444',
    fontSize: normalize(24),
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    paddingHorizontal: normalize(15),
    paddingVertical: normalize(15),
    borderRadius: normalize(12),
    fontSize: normalize(16),
    marginBottom: normalize(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  saveButton: {
    backgroundColor: '#60a5fa',
    paddingVertical: normalize(15),
    borderRadius: normalize(12),
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: normalize(16),
    fontWeight: 'bold',
  },
});