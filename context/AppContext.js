import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [questionBank, setQuestionBank] = useState([]);

  const GITHUB_REPO = 'YOUR_USERNAME/pomodoro-data';
  const GITHUB_BRANCH = 'main';

  // Load data from AsyncStorage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksData, notesData, sessionsData, quotesData, qbData] = await Promise.all([
        AsyncStorage.getItem('tasks'),
        AsyncStorage.getItem('notes'),
        AsyncStorage.getItem('sessions'),
        AsyncStorage.getItem('quotes'),
        AsyncStorage.getItem('questionBank'),
      ]);

      if (tasksData) setTasks(JSON.parse(tasksData));
      if (notesData) setNotes(JSON.parse(notesData));
      if (sessionsData) setSessions(JSON.parse(sessionsData));
      if (quotesData) setQuotes(JSON.parse(quotesData));
      if (qbData) setQuestionBank(JSON.parse(qbData));

      // If no data, fetch from GitHub
      if (!quotesData || !qbData) {
        await fetchFromGitHub();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const fetchFromGitHub = async () => {
    try {
      const quotesUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/quotes.json`;
      const questionsUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/questions.json`;

      const [quotesRes, questionsRes] = await Promise.all([
        fetch(quotesUrl),
        fetch(questionsUrl),
      ]);

      if (quotesRes.ok) {
        const quotesData = await quotesRes.json();
        setQuotes(quotesData.quotes || []);
        await AsyncStorage.setItem('quotes', JSON.stringify(quotesData.quotes || []));
      }

      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        setQuestionBank(questionsData.subjects || []);
        await AsyncStorage.setItem('questionBank', JSON.stringify(questionsData.subjects || []));
      }
    } catch (error) {
      console.error('Error fetching from GitHub:', error);
    }
  };

  // Save data to AsyncStorage
  useEffect(() => {
    AsyncStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    AsyncStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    AsyncStorage.setItem('sessions', JSON.stringify(sessions));
  }, [sessions]);

  const addTask = (task) => {
    const newTask = { ...task, id: Date.now().toString(), createdAt: new Date().toISOString() };
    setTasks([...tasks, newTask]);
    return newTask;
  };

  const updateTask = (id, updates) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const addNote = (note) => {
    const newNote = { ...note, id: Date.now().toString(), createdAt: new Date().toISOString() };
    setNotes([...notes, newNote]);
  };

  const updateNote = (id, updates) => {
    setNotes(notes.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteNote = (id) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const addSession = (session) => {
    const newSession = { ...session, id: Date.now().toString(), timestamp: new Date().toISOString() };
    setSessions([...sessions, newSession]);
  };

  const value = {
    tasks,
    notes,
    sessions,
    quotes,
    currentTask,
    questionBank,
    setCurrentTask,
    addTask,
    updateTask,
    deleteTask,
    addNote,
    updateNote,
    deleteNote,
    addSession,
    fetchFromGitHub,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
