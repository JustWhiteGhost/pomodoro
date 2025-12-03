// screens/QuestionBankScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');
const scale = width / 375;

const normalize = (size) => {
  return Math.round(size * scale);
};

export default function QuestionBankScreen() {
  const { questionBank, fetchFromGitHub } = useApp();
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFromGitHub();
    setRefreshing(false);
  };

  const openQuestion = (question) => {
    setSelectedQuestion(question);
    setShowAnswer(false);
    setModalVisible(true);
  };

  const closeQuestion = () => {
    setModalVisible(false);
    setSelectedQuestion(null);
    setShowAnswer(false);
  };

  const getSubjectColor = (index) => {
    const colors = ['#60a5fa', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
    return colors[index % colors.length];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Question Bank</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Text style={styles.refreshButtonText}>
            {refreshing ? '↻' : '⟳'} Update
          </Text>
        </TouchableOpacity>
      </View>

      {questionBank.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>❓</Text>
          <Text style={styles.emptyText}>No questions available</Text>
          <Text style={styles.emptySubtext}>
            Tap "Update" to fetch questions from GitHub
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {selectedSubject === null ? (
            // Subject List View
            <View style={styles.subjectGrid}>
              {questionBank.map((subject, index) => (
                <TouchableOpacity
                  key={subject.id || index}
                  style={[
                    styles.subjectCard,
                    { borderColor: getSubjectColor(index) }
                  ]}
                  onPress={() => setSelectedSubject(subject)}
                >
                  <View 
                    style={[
                      styles.subjectIcon,
                      { backgroundColor: getSubjectColor(index) }
                    ]}
                  >
                    <Text style={styles.subjectIconText}>
                      {subject.name.charAt(0)}
                    </Text>
                  </View>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <Text style={styles.subjectCount}>
                    {subject.questions?.length || 0} questions
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            // Question List View
            <View>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setSelectedSubject(null)}
              >
                <Text style={styles.backButtonText}>← Back to Subjects</Text>
              </TouchableOpacity>

              <Text style={styles.subjectTitle}>{selectedSubject.name}</Text>

              <View style={styles.questionsList}>
                {selectedSubject.questions?.map((question, index) => (
                  <TouchableOpacity
                    key={question.id || index}
                    style={styles.questionCard}
                    onPress={() => openQuestion(question)}
                  >
                    <View style={styles.questionHeader}>
                      <View style={styles.questionNumber}>
                        <Text style={styles.questionNumberText}>
                          {index + 1}
                        </Text>
                      </View>
                      {question.difficulty && (
                        <View 
                          style={[
                            styles.difficultyBadge,
                            { backgroundColor: getDifficultyColor(question.difficulty) }
                          ]}
                        >
                          <Text style={styles.difficultyText}>
                            {question.difficulty}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.questionText} numberOfLines={2}>
                      {question.question}
                    </Text>
                    {question.topic && (
                      <Text style={styles.questionTopic}>
                        Topic: {question.topic}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Question Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeQuestion}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeQuestion}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
              {selectedQuestion?.difficulty && (
                <View 
                  style={[
                    styles.difficultyBadge,
                    { backgroundColor: getDifficultyColor(selectedQuestion.difficulty) }
                  ]}
                >
                  <Text style={styles.difficultyText}>
                    {selectedQuestion.difficulty}
                  </Text>
                </View>
              )}
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalQuestion}>
                {selectedQuestion?.question}
              </Text>

              {selectedQuestion?.topic && (
                <View style={styles.topicBadge}>
                  <Text style={styles.topicBadgeText}>
                    {selectedQuestion.topic}
                  </Text>
                </View>
              )}

              {!showAnswer ? (
                <TouchableOpacity
                  style={styles.showAnswerButton}
                  onPress={() => setShowAnswer(true)}
                >
                  <Text style={styles.showAnswerButtonText}>
                    Show Answer
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.answerContainer}>
                  <Text style={styles.answerLabel}>Answer:</Text>
                  <Text style={styles.answerText}>
                    {selectedQuestion?.answer}
                  </Text>
                  {selectedQuestion?.explanation && (
                    <>
                      <Text style={styles.explanationLabel}>Explanation:</Text>
                      <Text style={styles.explanationText}>
                        {selectedQuestion.explanation}
                      </Text>
                    </>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getDifficultyColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return '#10b981';
    case 'medium':
      return '#f59e0b';
    case 'hard':
      return '#ef4444';
    default:
      return '#60a5fa';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: normalize(20),
    paddingTop: normalize(50),
    paddingBottom: normalize(15),
  },
  headerTitle: {
    fontSize: normalize(32),
    fontWeight: 'bold',
    color: 'white',
  },
  refreshButton: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(10),
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: '#60a5fa',
  },
  refreshButtonText: {
    color: '#60a5fa',
    fontSize: normalize(14),
    fontWeight: '600',
  },
  scrollContent: {
    padding: normalize(20),
    paddingTop: 0,
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(12),
  },
  subjectCard: {
    width: (width - normalize(52)) / 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: normalize(20),
    borderRadius: normalize(15),
    borderWidth: 2,
    alignItems: 'center',
  },
  subjectIcon: {
    width: normalize(60),
    height: normalize(60),
    borderRadius: normalize(30),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize(12),
  },
  subjectIconText: {
    color: 'white',
    fontSize: normalize(28),
    fontWeight: 'bold',
  },
  subjectName: {
    color: 'white',
    fontSize: normalize(16),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: normalize(5),
  },
  subjectCount: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(12),
  },
  backButton: {
    marginBottom: normalize(20),
  },
  backButtonText: {
    color: '#60a5fa',
    fontSize: normalize(16),
    fontWeight: '600',
  },
  subjectTitle: {
    color: 'white',
    fontSize: normalize(28),
    fontWeight: 'bold',
    marginBottom: normalize(20),
  },
  questionsList: {
    gap: normalize(12),
  },
  questionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: normalize(16),
    borderRadius: normalize(15),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(10),
  },
  questionNumber: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    backgroundColor: '#60a5fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionNumberText: {
    color: 'white',
    fontSize: normalize(14),
    fontWeight: 'bold',
  },
  difficultyBadge: {
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(4),
    borderRadius: normalize(8),
  },
  difficultyText: {
    color: 'white',
    fontSize: normalize(11),
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  questionText: {
    color: 'white',
    fontSize: normalize(15),
    lineHeight: normalize(22),
    marginBottom: normalize(8),
  },
  questionTopic: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(12),
  },
  emptyState: {
    flex: 1,
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
    paddingHorizontal: normalize(40),
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderTopLeftRadius: normalize(25),
    borderTopRightRadius: normalize(25),
    padding: normalize(20),
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(20),
  },
  closeButton: {
    color: '#ef4444',
    fontSize: normalize(28),
    fontWeight: '600',
  },
  modalScroll: {
    flex: 1,
  },
  modalQuestion: {
    color: 'white',
    fontSize: normalize(20),
    fontWeight: '700',
    lineHeight: normalize(28),
    marginBottom: normalize(15),
  },
  topicBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderRadius: normalize(8),
    marginBottom: normalize(20),
  },
  topicBadgeText: {
    color: '#60a5fa',
    fontSize: normalize(12),
    fontWeight: '600',
  },
  showAnswerButton: {
    backgroundColor: '#60a5fa',
    padding: normalize(16),
    borderRadius: normalize(12),
    alignItems: 'center',
  },
  showAnswerButtonText: {
    color: 'white',
    fontSize: normalize(16),
    fontWeight: '700',
  },
  answerContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: normalize(20),
    borderRadius: normalize(15),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  answerLabel: {
    color: '#10b981',
    fontSize: normalize(14),
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: normalize(8),
  },
  answerText: {
    color: 'white',
    fontSize: normalize(16),
    lineHeight: normalize(24),
    marginBottom: normalize(15),
  },
  explanationLabel: {
    color: '#60a5fa',
    fontSize: normalize(14),
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: normalize(8),
  },
  explanationText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: normalize(15),
    lineHeight: normalize(22),
  },
});