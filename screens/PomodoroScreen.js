// screens/PomodoroScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const scale = width / 375;

const normalize = (size) => {
  return Math.round(size * scale);
};

export default function PomodoroScreen() {
  const { currentTask, updateTask, addSession, quotes } = useApp();
  const [time, setTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [quote, setQuote] = useState({ text: 'Focus on your goals', author: '' });
  const intervalRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    if (quotes.length > 0) {
      setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }
  }, [quotes]);

  useEffect(() => {
    if (isRunning && time > 0) {
      intervalRef.current = setInterval(() => {
        setTime(prev => prev - 1);
      }, 1000);
    } else if (time === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, time]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    if (!isBreak) {
      // Work session completed
      if (currentTask) {
        const newSessionCount = sessionCount + 1;
        setSessionCount(newSessionCount);
        
        updateTask(currentTask.id, {
          timeSpent: (currentTask.timeSpent || 0) + 1500, // 25 minutes in seconds
          sessions: (currentTask.sessions || 0) + 1,
        });

        addSession({
          taskId: currentTask.id,
          taskTitle: currentTask.title,
          duration: 1500,
          type: 'work',
        });
      }

      setIsBreak(true);
      setTime(5 * 60);
      
      if (quotes.length > 0) {
        setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
      }
    } else {
      // Break completed
      setIsBreak(false);
      setTime(25 * 60);
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setTime(isBreak ? 5 * 60 : 25 * 60);
  };

  const exitPomodoro = () => {
    if (isRunning) {
      setIsRunning(false);
    }
    navigation.navigate('Tasks');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = isBreak 
    ? ((5 * 60 - time) / (5 * 60)) * 100
    : ((25 * 60 - time) / (25 * 60)) * 100;

  const circumference = 2 * Math.PI * normalize(130);
  const strokeDashoffset = circumference - (circumference * progress) / 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={exitPomodoro} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          {currentTask && (
            <View style={styles.currentTaskBadge}>
              <Text style={styles.currentTaskText} numberOfLines={1}>
                {currentTask.title}
              </Text>
            </View>
          )}
        </View>

        {/* Timer Circle */}
        <View style={styles.timerContainer}>
          <View style={styles.circleContainer}>
            <Svg 
              width={normalize(288)} 
              height={normalize(288)} 
              style={styles.svg}
            >
              <Circle
                cx={normalize(144)}
                cy={normalize(144)}
                r={normalize(130)}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={normalize(12)}
                fill="none"
              />
              <Circle
                cx={normalize(144)}
                cy={normalize(144)}
                r={normalize(130)}
                stroke={isBreak ? "#10b981" : "#60a5fa"}
                strokeWidth={normalize(12)}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${normalize(144)}, ${normalize(144)}`}
              />
            </Svg>
            <View style={styles.timerTextContainer}>
              <Text style={styles.timerText}>{formatTime(time)}</Text>
              <Text style={styles.timerLabel}>
                {isBreak ? 'Break Time' : 'Focus Time'}
              </Text>
              {sessionCount > 0 && (
                <Text style={styles.sessionCount}>
                  Session {sessionCount}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity 
            onPress={toggleTimer} 
            style={[styles.mainButton, isRunning ? styles.pauseButton : styles.startButton]}
          >
            <Text style={styles.mainButtonText}>
              {isRunning ? 'Pause' : 'Start'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={resetTimer} 
            style={styles.resetButton}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Quote */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>"{quote.text}"</Text>
          {quote.author && (
            <Text style={styles.quoteAuthor}>— {quote.author}</Text>
          )}
        </View>

        {/* Session Stats */}
        {currentTask && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{currentTask.sessions || 0}</Text>
              <Text style={styles.statLabel}>Total Sessions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {Math.floor((currentTask.timeSpent || 0) / 60)}m
              </Text>
              <Text style={styles.statLabel}>Time Spent</Text>
            </View>
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
  header: {
    marginBottom: normalize(30),
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: normalize(15),
  },
  backButtonText: {
    color: '#60a5fa',
    fontSize: normalize(16),
    fontWeight: '600',
  },
  currentTaskBadge: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  currentTaskText: {
    color: '#60a5fa',
    fontSize: normalize(18),
    fontWeight: '700',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: normalize(30),
  },
  circleContainer: {
    width: normalize(288),
    height: normalize(288),
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  timerTextContainer: {
    position: 'absolute',
    width: normalize(288),
    height: normalize(288),
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    color: 'white',
    fontSize: normalize(64),
    fontWeight: 'bold',
  },
  timerLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(18),
    marginTop: normalize(8),
  },
  sessionCount: {
    color: '#60a5fa',
    fontSize: normalize(14),
    marginTop: normalize(4),
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: normalize(15),
    marginBottom: normalize(30),
  },
  mainButton: {
    paddingHorizontal: normalize(40),
    paddingVertical: normalize(16),
    borderRadius: normalize(25),
    minWidth: normalize(140),
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#60a5fa',
  },
  pauseButton: {
    backgroundColor: '#f59e0b',
  },
  mainButtonText: {
    color: 'white',
    fontSize: normalize(18),
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: normalize(30),
    paddingVertical: normalize(16),
    borderRadius: normalize(25),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: normalize(18),
    fontWeight: '600',
  },
  quoteContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: normalize(20),
    borderRadius: normalize(15),
    marginBottom: normalize(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quoteText: {
    color: 'white',
    fontSize: normalize(16),
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: normalize(24),
  },
  quoteAuthor: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(13),
    textAlign: 'center',
    marginTop: normalize(8),
  },
  statsContainer: {
    flexDirection: 'row',
    gap: normalize(15),
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: normalize(20),
    borderRadius: normalize(15),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statValue: {
    color: '#60a5fa',
    fontSize: normalize(28),
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(12),
    marginTop: normalize(4),
  },
});