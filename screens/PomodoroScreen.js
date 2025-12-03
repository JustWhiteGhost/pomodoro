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
  Modal,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Audio } from 'expo-av';
import { useApp } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const scale = width / 375;

const normalize = (size) => {
  return Math.round(size * scale);
};

export default function PomodoroScreen() {
  const { currentTask, updateTask, addSession, quotes, musicLibrary, fetchFromGitHub } = useApp();
  const [time, setTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [quote, setQuote] = useState({ text: 'Focus on your goals', author: '' });
  const intervalRef = useRef(null);
  const navigation = useNavigation();
  const [subtasks, setSubtasks] = useState([]);

  // Music player state
  const [sound, setSound] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicModalVisible, setMusicModalVisible] = useState(false);

  useEffect(() => {
    if (quotes.length > 0) {
      setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }
  }, [quotes]);

  // Load subtasks when current task changes
  useEffect(() => {
    if (currentTask) {
      const getAllSubtasks = (task) => {
        let allSubs = [];
        if (task.subtasks && task.subtasks.length > 0) {
          task.subtasks.forEach(sub => {
            allSubs.push(sub);
            if (sub.subtasks && sub.subtasks.length > 0) {
              allSubs = allSubs.concat(getAllSubtasks(sub));
            }
          });
        }
        return allSubs;
      };
      setSubtasks(getAllSubtasks(currentTask));
    } else {
      setSubtasks([]);
    }
  }, [currentTask]);

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

  // Cleanup sound on unmount
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // Music playback status
  useEffect(() => {
    if (sound) {
      sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    }
  }, [sound]);

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setIsMusicPlaying(status.isPlaying);
      
      if (status.didJustFinish) {
        playNextTrack();
      }
    }
  };

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    if (!isBreak) {
      // Work session completed
      if (currentTask) {
        const newSessionCount = sessionCount + 1;
        setSessionCount(newSessionCount);
        
        updateTask(currentTask.id, {
          timeSpent: (currentTask.timeSpent || 0) + 1500,
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
    if (sound) {
      sound.stopAsync();
    }
    navigation.navigate('Tasks');
  };

  const toggleSubtask = (subtaskId) => {
    // Find and toggle the subtask
    const updatedSubtasks = subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    setSubtasks(updatedSubtasks);
    
    // Update in the global state
    updateTask(subtaskId, { completed: !subtasks.find(st => st.id === subtaskId).completed });
  };

  // Music player functions
  const playTrack = async (track) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: track.url },
        { shouldPlay: true }
      );

      setSound(newSound);
      setCurrentTrack(track);
      setIsMusicPlaying(true);
      setMusicModalVisible(false);
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  const toggleMusicPlayPause = async () => {
    if (sound) {
      if (isMusicPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } else if (musicLibrary.length > 0) {
      playTrack(musicLibrary[0]);
    }
  };

  const playNextTrack = () => {
    if (currentTrack && musicLibrary.length > 0) {
      const currentIndex = musicLibrary.findIndex(t => t.id === currentTrack.id);
      const nextIndex = (currentIndex + 1) % musicLibrary.length;
      playTrack(musicLibrary[nextIndex]);
    }
  };

  const playPreviousTrack = () => {
    if (currentTrack && musicLibrary.length > 0) {
      const currentIndex = musicLibrary.findIndex(t => t.id === currentTrack.id);
      const prevIndex = (currentIndex - 1 + musicLibrary.length) % musicLibrary.length;
      playTrack(musicLibrary[prevIndex]);
    }
  };

  const stopMusic = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setCurrentTrack(null);
      setIsMusicPlaying(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = isBreak 
    ? ((5 * 60 - time) / (5 * 60)) * 100
    : ((25 * 60 - time) / (25 * 60)) * 100;

  const circumference = 2 * Math.PI * normalize(120);
  const strokeDashoffset = circumference - (circumference * progress) / 100;

  const completedSubtasks = subtasks.filter(st => st.completed).length;
  const totalSubtasks = subtasks.length;

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
              {totalSubtasks > 0 && (
                <View style={styles.partsIndicator}>
                  <Text style={styles.partsText}>
                    {completedSubtasks}/{totalSubtasks} parts
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Timer Circle */}
        <View style={styles.timerContainer}>
          <View style={styles.circleContainer}>
            <Svg 
              width={normalize(260)} 
              height={normalize(260)} 
              style={styles.svg}
            >
              <Circle
                cx={normalize(130)}
                cy={normalize(130)}
                r={normalize(120)}
                stroke="rgba(96, 165, 250, 0.15)"
                strokeWidth={normalize(8)}
                fill="none"
              />
              <Circle
                cx={normalize(130)}
                cy={normalize(130)}
                r={normalize(120)}
                stroke={isBreak ? "#10b981" : "#60a5fa"}
                strokeWidth={normalize(8)}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${normalize(130)}, ${normalize(130)}`}
              />
            </Svg>
            <View style={styles.timerTextContainer}>
              <Text style={styles.timerText}>{formatTime(time)}</Text>
              <Text style={styles.timerStatus}>
                {isRunning ? (isBreak ? 'break' : 'focus') : 'paused'}
              </Text>
            </View>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={resetTimer}
          >
            <Text style={styles.controlIcon}>↻</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={toggleTimer} 
            style={styles.playButton}
          >
            <Text style={styles.playIcon}>
              {isRunning ? '⏸' : '▶'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setMusicModalVisible(true)}
          >
            <Text style={styles.controlIcon}>♫</Text>
          </TouchableOpacity>
        </View>

        {/* Music Player Widget */}
        {currentTrack && (
          <View style={styles.musicWidget}>
            <View style={styles.musicWidgetHeader}>
              <Text style={styles.musicWidgetTitle}>🎵 {currentTrack.title}</Text>
              <View style={styles.musicControlsCompact}>
                <TouchableOpacity onPress={playPreviousTrack}>
                  <Text style={styles.musicControlIconSmall}>⏮</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleMusicPlayPause}>
                  <Text style={styles.musicControlIconSmall}>
                    {isMusicPlaying ? '⏸' : '▶'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={playNextTrack}>
                  <Text style={styles.musicControlIconSmall}>⏭</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={stopMusic}>
                  <Text style={[styles.musicControlIconSmall, styles.stopIcon]}>■</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Subtasks List */}
        {subtasks.length > 0 && (
          <View style={styles.subtasksSection}>
            <View style={styles.subtasksHeader}>
              <Text style={styles.subtasksSectionTitle}>Parts</Text>
              <Text style={styles.subtasksProgress}>
                {completedSubtasks}/{totalSubtasks}
              </Text>
            </View>
            <View style={styles.subtasksList}>
              {subtasks.map((subtask, index) => (
                <TouchableOpacity
                  key={subtask.id}
                  style={styles.subtaskItem}
                  onPress={() => toggleSubtask(subtask.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.subtaskCheckbox,
                    subtask.completed && styles.subtaskCheckboxCompleted
                  ]}>
                    {subtask.completed && <Text style={styles.subtaskCheckmark}>✓</Text>}
                  </View>
                  <Text 
                    style={[
                      styles.subtaskText,
                      subtask.completed && styles.subtaskTextCompleted
                    ]}
                    numberOfLines={2}
                  >
                    {subtask.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Stats */}
        {currentTask && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Sessions</Text>
              <Text style={styles.statValue}>{currentTask.sessions || 0}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Time Spent</Text>
              <Text style={styles.statValue}>
                {Math.floor((currentTask.timeSpent || 0) / 60)}m
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Music Library Modal */}
      <Modal
        visible={musicModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMusicModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Music Library</Text>
              <TouchableOpacity onPress={() => setMusicModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {musicLibrary.length === 0 ? (
                <View style={styles.emptyMusicState}>
                  <Text style={styles.emptyMusicIcon}>🎵</Text>
                  <Text style={styles.emptyMusicText}>No music available</Text>
                  <TouchableOpacity 
                    style={styles.loadMusicButton}
                    onPress={async () => {
                      await fetchFromGitHub();
                      setMusicModalVisible(false);
                    }}
                  >
                    <Text style={styles.loadMusicButtonText}>Load from GitHub</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.trackList}>
                  {musicLibrary.map((track, index) => (
                    <TouchableOpacity
                      key={track.id || index}
                      style={[
                        styles.trackItem,
                        currentTrack?.id === track.id && styles.trackItemActive
                      ]}
                      onPress={() => playTrack(track)}
                    >
                      <View style={styles.trackNumber}>
                        <Text style={styles.trackNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.trackInfo}>
                        <Text 
                          style={[
                            styles.trackTitle,
                            currentTrack?.id === track.id && styles.trackTitleActive
                          ]}
                          numberOfLines={1}
                        >
                          {track.title}
                        </Text>
                        <Text style={styles.trackArtist} numberOfLines={1}>
                          {track.artist}
                        </Text>
                      </View>
                      {currentTrack?.id === track.id && isMusicPlaying && (
                        <View style={styles.playingIndicator}>
                          <View style={styles.bar} />
                          <View style={styles.bar} />
                          <View style={styles.bar} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
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
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(15),
    borderRadius: normalize(15),
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  currentTaskText: {
    color: 'white',
    fontSize: normalize(20),
    fontWeight: '700',
    marginBottom: normalize(8),
  },
  partsIndicator: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderRadius: normalize(8),
    alignSelf: 'flex-start',
  },
  partsText: {
    color: '#60a5fa',
    fontSize: normalize(12),
    fontWeight: '600',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: normalize(30),
  },
  circleContainer: {
    width: normalize(260),
    height: normalize(260),
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  timerTextContainer: {
    position: 'absolute',
    width: normalize(260),
    height: normalize(260),
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    color: 'white',
    fontSize: normalize(52),
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  timerStatus: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(16),
    marginTop: normalize(8),
    textTransform: 'lowercase',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: normalize(20),
    marginBottom: normalize(25),
  },
  controlButton: {
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(28),
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  controlIcon: {
    color: 'white',
    fontSize: normalize(24),
  },
  playButton: {
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(40),
    backgroundColor: '#60a5fa',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playIcon: {
    color: 'white',
    fontSize: normalize(32),
    marginLeft: normalize(3),
  },
  musicWidget: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    padding: normalize(15),
    borderRadius: normalize(12),
    marginBottom: normalize(20),
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  musicWidgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  musicWidgetTitle: {
    color: 'white',
    fontSize: normalize(14),
    fontWeight: '600',
    flex: 1,
  },
  musicControlsCompact: {
    flexDirection: 'row',
    gap: normalize(15),
    alignItems: 'center',
  },
  musicControlIconSmall: {
    color: '#a78bfa',
    fontSize: normalize(18),
  },
  stopIcon: {
    color: '#ef4444',
  },
  subtasksSection: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    padding: normalize(18),
    borderRadius: normalize(15),
    marginBottom: normalize(20),
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  subtasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(15),
  },
  subtasksSectionTitle: {
    color: 'white',
    fontSize: normalize(16),
    fontWeight: '700',
  },
  subtasksProgress: {
    color: '#60a5fa',
    fontSize: normalize(14),
    fontWeight: '600',
  },
  subtasksList: {
    gap: normalize(10),
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    padding: normalize(14),
    borderRadius: normalize(12),
    gap: normalize(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  subtaskCheckbox: {
    width: normalize(22),
    height: normalize(22),
    borderRadius: normalize(11),
    borderWidth: 2,
    borderColor: '#60a5fa',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  subtaskCheckboxCompleted: {
    backgroundColor: '#60a5fa',
    borderColor: '#60a5fa',
  },
  subtaskCheckmark: {
    color: 'white',
    fontSize: normalize(13),
    fontWeight: 'bold',
  },
  subtaskText: {
    flex: 1,
    color: 'white',
    fontSize: normalize(15),
    lineHeight: normalize(20),
  },
  subtaskTextCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
    color: 'rgba(255,255,255,0.6)',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    padding: normalize(20),
    borderRadius: normalize(15),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: normalize(15),
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(12),
    marginBottom: normalize(6),
  },
  statValue: {
    color: '#60a5fa',
    fontSize: normalize(24),
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: normalize(25),
    borderTopRightRadius: normalize(25),
    padding: normalize(20),
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(20),
  },
  modalTitle: {
    color: 'white',
    fontSize: normalize(22),
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#ef4444',
    fontSize: normalize(28),
    fontWeight: '600',
  },
  modalScroll: {
    flex: 1,
  },
  emptyMusicState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(60),
  },
  emptyMusicIcon: {
    fontSize: normalize(64),
    marginBottom: normalize(15),
  },
  emptyMusicText: {
    color: 'white',
    fontSize: normalize(18),
    fontWeight: '600',
    marginBottom: normalize(20),
  },
  loadMusicButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: normalize(30),
    paddingVertical: normalize(15),
    borderRadius: normalize(12),
  },
  loadMusicButtonText: {
    color: 'white',
    fontSize: normalize(16),
    fontWeight: '600',
  },
  trackList: {
    gap: normalize(10),
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: normalize(15),
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: normalize(12),
  },
  trackItemActive: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  trackNumber: {
    width: normalize(30),
    height: normalize(30),
    borderRadius: normalize(15),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackNumberText: {
    color: 'white',
    fontSize: normalize(12),
    fontWeight: '600',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    color: 'white',
    fontSize: normalize(15),
    fontWeight: '600',
    marginBottom: normalize(4),
  },
  trackTitleActive: {
    color: '#a78bfa',
  },
  trackArtist: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(13),
  },
  playingIndicator: {
    flexDirection: 'row',
    gap: normalize(3),
    alignItems: 'flex-end',
  },
  bar: {
    width: normalize(3),
    height: normalize(16),
    backgroundColor: '#8b5cf6',
    borderRadius: normalize(2),
  },
});