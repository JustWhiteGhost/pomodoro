// screens/InsightsScreen.js
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');
const scale = width / 375;

const normalize = (size) => {
  return Math.round(size * scale);
};

export default function InsightsScreen() {
  const { sessions, tasks } = useApp();
  const [timeRange, setTimeRange] = useState('week'); // day, week, month, year

  const getFilteredSessions = useMemo(() => {
    const now = new Date();
    const filtered = sessions.filter(session => {
      const sessionDate = new Date(session.timestamp);
      const diffTime = now - sessionDate;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      switch (timeRange) {
        case 'day':
          return diffDays < 1;
        case 'week':
          return diffDays < 7;
        case 'month':
          return diffDays < 30;
        case 'year':
          return diffDays < 365;
        default:
          return true;
      }
    });
    return filtered;
  }, [sessions, timeRange]);

  const stats = useMemo(() => {
    const totalTime = getFilteredSessions.reduce((acc, s) => acc + s.duration, 0);
    const totalSessions = getFilteredSessions.length;
    const avgPerSession = totalSessions > 0 ? totalTime / totalSessions : 0;
    
    // Calculate sessions per day
    const daysMap = {};
    getFilteredSessions.forEach(session => {
      const date = new Date(session.timestamp).toDateString();
      daysMap[date] = (daysMap[date] || 0) + 1;
    });
    const daysWithSessions = Object.keys(daysMap).length;
    const avgPerDay = daysWithSessions > 0 ? totalSessions / daysWithSessions : 0;

    // Best day
    let bestDay = { date: 'N/A', count: 0 };
    Object.entries(daysMap).forEach(([date, count]) => {
      if (count > bestDay.count) {
        bestDay = { date, count };
      }
    });

    return {
      totalTime,
      totalSessions,
      avgPerSession,
      avgPerDay,
      bestDay,
    };
  }, [getFilteredSessions]);

  const taskStats = useMemo(() => {
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    // Most productive task
    const sortedTasks = [...tasks].sort((a, b) => (b.timeSpent || 0) - (a.timeSpent || 0));
    const topTask = sortedTasks[0];

    return {
      completed,
      total,
      completionRate,
      topTask,
    };
  }, [tasks]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const timeRanges = [
    { key: 'day', label: 'Day' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Insights</Text>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {timeRanges.map(range => (
            <TouchableOpacity
              key={range.key}
              style={[
                styles.timeRangeButton,
                timeRange === range.key && styles.timeRangeButtonActive,
              ]}
              onPress={() => setTimeRange(range.key)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === range.key && styles.timeRangeTextActive,
                ]}
              >
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatTime(stats.totalTime)}</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatTime(stats.avgPerSession)}</Text>
            <Text style={styles.statLabel}>Avg/Session</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.avgPerDay.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg/Day</Text>
          </View>
        </View>

        {/* Task Completion */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Completion</Text>
          <View style={styles.completionCard}>
            <View style={styles.completionHeader}>
              <Text style={styles.completionRate}>
                {taskStats.completionRate.toFixed(0)}%
              </Text>
              <Text style={styles.completionText}>
                {taskStats.completed}/{taskStats.total} tasks completed
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${taskStats.completionRate}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Best Day */}
        {stats.bestDay.count > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Best Day</Text>
            <View style={styles.bestDayCard}>
              <Text style={styles.bestDayDate}>
                {formatDate(stats.bestDay.date)}
              </Text>
              <Text style={styles.bestDayCount}>
                {stats.bestDay.count} sessions
              </Text>
            </View>
          </View>
        )}

        {/* Top Task */}
        {taskStats.topTask && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Most Time Spent</Text>
            <View style={styles.topTaskCard}>
              <Text style={styles.topTaskTitle} numberOfLines={1}>
                {taskStats.topTask.title}
              </Text>
              <View style={styles.topTaskStats}>
                <View style={styles.topTaskStat}>
                  <Text style={styles.topTaskStatValue}>
                    {formatTime(taskStats.topTask.timeSpent || 0)}
                  </Text>
                  <Text style={styles.topTaskStatLabel}>Time</Text>
                </View>
                <View style={styles.topTaskStat}>
                  <Text style={styles.topTaskStatValue}>
                    {taskStats.topTask.sessions || 0}
                  </Text>
                  <Text style={styles.topTaskStatLabel}>Sessions</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Recent Sessions */}
        {getFilteredSessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            <View style={styles.sessionsList}>
              {getFilteredSessions.slice(0, 5).map(session => (
                <View key={session.id} style={styles.sessionItem}>
                  <View style={styles.sessionDot} />
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTask} numberOfLines={1}>
                      {session.taskTitle}
                    </Text>
                    <Text style={styles.sessionTime}>
                      {formatTime(session.duration)} • {formatDate(session.timestamp)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {getFilteredSessions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>No data for this period</Text>
            <Text style={styles.emptySubtext}>
              Complete some Pomodoro sessions to see insights
            </Text>
          </View>
        )}
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
  headerTitle: {
    fontSize: normalize(32),
    fontWeight: 'bold',
    color: 'white',
    marginBottom: normalize(20),
  },
  timeRangeContainer: {
    flexDirection: 'row',
    gap: normalize(10),
    marginBottom: normalize(25),
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(15),
    borderRadius: normalize(12),
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#60a5fa',
  },
  timeRangeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(13),
    fontWeight: '600',
  },
  timeRangeTextActive: {
    color: 'white',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(12),
    marginBottom: normalize(25),
  },
  statCard: {
    width: (width - normalize(52)) / 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: normalize(20),
    borderRadius: normalize(15),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statValue: {
    color: '#60a5fa',
    fontSize: normalize(28),
    fontWeight: 'bold',
    marginBottom: normalize(5),
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(12),
  },
  section: {
    marginBottom: normalize(25),
  },
  sectionTitle: {
    color: 'white',
    fontSize: normalize(18),
    fontWeight: '700',
    marginBottom: normalize(12),
  },
  completionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: normalize(20),
    borderRadius: normalize(15),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(15),
  },
  completionRate: {
    color: '#10b981',
    fontSize: normalize(32),
    fontWeight: 'bold',
  },
  completionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(14),
  },
  progressBar: {
    height: normalize(8),
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: normalize(4),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: normalize(4),
  },
  bestDayCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: normalize(20),
    borderRadius: normalize(15),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  bestDayDate: {
    color: '#f59e0b',
    fontSize: normalize(24),
    fontWeight: 'bold',
    marginBottom: normalize(5),
  },
  bestDayCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(14),
  },
  topTaskCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: normalize(20),
    borderRadius: normalize(15),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  topTaskTitle: {
    color: 'white',
    fontSize: normalize(18),
    fontWeight: '700',
    marginBottom: normalize(15),
  },
  topTaskStats: {
    flexDirection: 'row',
    gap: normalize(20),
  },
  topTaskStat: {
    flex: 1,
  },
  topTaskStatValue: {
    color: '#60a5fa',
    fontSize: normalize(24),
    fontWeight: 'bold',
  },
  topTaskStatLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(12),
    marginTop: normalize(4),
  },
  sessionsList: {
    gap: normalize(10),
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: normalize(15),
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sessionDot: {
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
    backgroundColor: '#60a5fa',
    marginRight: normalize(12),
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTask: {
    color: 'white',
    fontSize: normalize(15),
    fontWeight: '600',
    marginBottom: normalize(4),
  },
  sessionTime: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(12),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(80),
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
    textAlign: 'center',
  },
});