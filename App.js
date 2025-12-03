// App.js - Main Entry Point
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { ListIcon, ClockIcon, FileTextIcon, BarChartIcon, HelpCircleIcon } from './components/Icons';

import TaskListScreen from './screens/TaskListScreen';
import PomodoroScreen from './screens/PomodoroScreen';
import NotesScreen from './screens/NotesScreen';
import InsightsScreen from './screens/InsightsScreen';
import QuestionBankScreen from './screens/QuestionBankScreen';
import { AppProvider } from './context/AppContext';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#1f2937',
              borderTopColor: 'rgba(255,255,255,0.1)',
              paddingBottom: 8,
              paddingTop: 8,
              height: 65,
            },
            tabBarActiveTintColor: '#60a5fa',
            tabBarInactiveTintColor: '#9ca3af',
          }}
        >
          <Tab.Screen
            name="Tasks"
            component={TaskListScreen}
            options={{
              tabBarIcon: ({ color, size }) => <ListIcon color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Pomodoro"
            component={PomodoroScreen}
            options={{
              tabBarIcon: ({ color, size }) => <ClockIcon color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Notes"
            component={NotesScreen}
            options={{
              tabBarIcon: ({ color, size }) => <FileTextIcon color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Insights"
            component={InsightsScreen}
            options={{
              tabBarIcon: ({ color, size }) => <BarChartIcon color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Questions"
            component={QuestionBankScreen}
            options={{
              tabBarIcon: ({ color, size }) => <HelpCircleIcon color={color} size={size} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}